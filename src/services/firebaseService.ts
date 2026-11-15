import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import QRCode from "qrcode";
import { db } from "../lib/firebase";
import type { MenuItem } from "../data/menuData";
import { MENU_ITEMS } from "../data/menuData";
import type { CustomerOrder, OrderItemDetail, OrderStatus } from "../types/order";

const PRODUCTS_COLLECTION = "products";
const ORDERS_COLLECTION = "orders";
export const OFFICIAL_WEBSITE_URL = "https://coffee-house-xp.vercel.app";

/**
 * Hàm lọc sạch tất cả các giá trị `undefined` đệ quy trước khi gửi vào Firestore.
 * Firestore tuyệt đối không chấp nhận trường có giá trị `undefined`.
 */
export const sanitizeFirestoreData = <T>(data: T): T => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        clean[key] = sanitizeFirestoreData(val);
      }
    }
    return clean as T;
  }
  return data;
};

/* ========================================================
   PRODUCTS CRUD SERVICES
   ======================================================== */

export const seedProductsIfEmpty = async (): Promise<boolean> => {
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snapshot.empty) {
      console.log("Khởi tạo 47 món ban đầu lên Firestore...");
      const batchPromises = MENU_ITEMS.map((item) => {
        const docRef = doc(db, PRODUCTS_COLLECTION, item.id);
        return setDoc(docRef, item);
      });
      await Promise.all(batchPromises);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("Lỗi khi kiểm tra/khởi tạo sản phẩm Firestore (có thể do AdBlock/Brave Shield):", error);
    return false;
  }
};

export const resetProductsToDefault = async (): Promise<void> => {
  try {
    const batchPromises = MENU_ITEMS.map((item) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, item.id);
      return setDoc(docRef, item);
    });
    await Promise.all(batchPromises);
  } catch (error) {
    console.error("Lỗi khi đặt lại thực đơn mặc định:", error);
    throw error;
  }
};

export const subscribeProducts = (
  callback: (products: MenuItem[]) => void
): (() => void) => {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    return onSnapshot(
      colRef,
      async (snapshot) => {
        try {
          if (snapshot.empty) {
            await seedProductsIfEmpty();
            callback(MENU_ITEMS);
          } else {
            const products: MenuItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              products.push({
                id: docSnap.id,
                name: data.name || "",
                category: data.category || "coffee",
                price: Number(data.price) || 0,
                image: data.image || "/images/drinks/cf-muoi.jpg",
                badge: data.badge || undefined,
                allowCustomization: data.allowCustomization !== false,
              });
            });
            callback(products);
          }
        } catch (innerErr) {
          console.warn("Lỗi xử lý snapshot Firestore, dùng menu mặc định:", innerErr);
          callback(MENU_ITEMS);
        }
      },
      (error) => {
        console.warn("Firestore kết nối bị chặn hoặc lỗi (AdBlock / Brave Shield):", error);
        callback(MENU_ITEMS);
      }
    );
  } catch (outerErr) {
    console.warn("Không thể đăng ký Firestore listener:", outerErr);
    callback(MENU_ITEMS);
    return () => {};
  }
};

export const addProduct = async (
  product: Omit<MenuItem, "id">
): Promise<string> => {
  try {
    const cleanProduct = sanitizeFirestoreData(product);
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), cleanProduct);
    return docRef.id;
  } catch (error) {
    console.error("Lỗi thêm món mới:", error);
    throw error;
  }
};

export const updateProduct = async (
  id: string,
  updates: Partial<MenuItem>
): Promise<void> => {
  try {
    const cleanUpdates = sanitizeFirestoreData(updates);
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    console.error("Lỗi cập nhật món:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Lỗi xóa món:", error);
    throw error;
  }
};

/* ========================================================
   ORDERS & INVOICES SERVICES (REALTIME STATE MACHINE)
   ======================================================== */

/**
 * Bước 1: Khách tạo đơn hàng (trạng thái 'pending' - Chờ phục vụ)
 */
export const createCustomerOrder = async (orderData: {
  items: OrderItemDetail[];
  totalAmount: number;
  paymentMethod: "vietqr" | "cash";
  note?: string;
  status?: OrderStatus;
  customerPaid?: boolean;
}): Promise<{ id: string; orderCode: string }> => {
  try {
    const orderCode = `XP-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();

    // Chuẩn hóa và làm sạch tất cả các món trong giỏ (loại bỏ triệt để trường undefined)
    const cleanItems = (orderData.items || []).map((it) => {
      const itemClean: Record<string, any> = {
        id: it.id || "",
        name: it.name || "",
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        totalPrice: Number(it.totalPrice) || 0,
      };
      if (it.ice && it.ice.trim()) itemClean.ice = it.ice.trim();
      if (it.sugar && it.sugar.trim()) itemClean.sugar = it.sugar.trim();
      if (it.note && it.note.trim()) itemClean.note = it.note.trim();
      return itemClean;
    });

    const newOrder = sanitizeFirestoreData({
      orderCode,
      items: cleanItems,
      totalAmount: Number(orderData.totalAmount) || 0,
      paymentMethod: orderData.paymentMethod || "vietqr",
      status: orderData.status || "pending", // Mặc định 'pending' hoặc do chủ quán chọn khi tạo thủ công
      note: (orderData.note || "").trim(),
      customerPaid: orderData.customerPaid ?? (orderData.status === "completed"),
      createdAt: now,
      updatedAt: now,
    });

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), newOrder);
    return { id: docRef.id, orderCode };
  } catch (error) {
    console.error("Lỗi lưu đơn hàng vào Firestore:", error);
    throw error;
  }
};

/**
 * Lắng nghe đơn hàng cụ thể theo thời gian thực (cho phía khách hàng)
 */
export const subscribeSingleOrder = (
  orderId: string,
  callback: (order: CustomerOrder | null) => void
): (() => void) => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          callback({
            id: docSnap.id,
            orderCode: data.orderCode || `XP-${docSnap.id.slice(0, 4)}`,
            items: data.items || [],
            totalAmount: Number(data.totalAmount) || 0,
            paymentMethod: data.paymentMethod || "vietqr",
            status: data.status || "pending",
            note: data.note || "",
            customerPaid: !!data.customerPaid,
            createdAt: Number(data.createdAt) || Date.now(),
            updatedAt: Number(data.updatedAt) || Date.now(),
          });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn("Lỗi lắng nghe cập nhật đơn hàng:", error);
      }
    );
  } catch (err) {
    console.warn("Không thể đăng ký listener đơn hàng đơn lẻ:", err);
    return () => {};
  }
};

/**
 * Khách bấm "Tôi đã chuyển khoản / Đã gửi tiền mặt"
 */
export const markOrderCustomerPaid = async (orderId: string): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      customerPaid: true,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Lỗi cập nhật khách đã trả tiền:", error);
    throw error;
  }
};

/**
 * Đọc trực tiếp danh sách đơn hàng từ Firestore (phương thức GET/POST qua getDocs)
 */
export const fetchCustomerOrders = async (): Promise<CustomerOrder[]> => {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const orders: CustomerOrder[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      orders.push({
        id: docSnap.id,
        orderCode: data.orderCode || `XP-${docSnap.id.slice(0, 4)}`,
        items: data.items || [],
        totalAmount: Number(data.totalAmount) || 0,
        paymentMethod: data.paymentMethod || "vietqr",
        status: data.status || "pending",
        note: data.note || "",
        customerPaid: !!data.customerPaid,
        createdAt: Number(data.createdAt) || Date.now(),
        updatedAt: Number(data.updatedAt) || Date.now(),
      });
    });
    orders.sort((a, b) => b.createdAt - a.createdAt);
    return orders;
  } catch (err) {
    console.warn("Lỗi fetchCustomerOrders:", err);
    return [];
  }
};

/**
 * Lắng nghe toàn bộ danh sách đơn hàng cho Admin Dashboard (Real-time onSnapshot + Heartbeat polling dự phòng)
 */
export const subscribeCustomerOrders = (
  callback: (orders: CustomerOrder[]) => void
): (() => void) => {
  let isCancelled = false;

  // 1. Tải tức thì lần đầu tiên bằng getDocs (Không để màn hình chờ WebChannel stream)
  fetchCustomerOrders().then((initialOrders) => {
    if (!isCancelled && initialOrders.length > 0) {
      callback(initialOrders);
    }
  });

  // 2. Đăng ký Real-time onSnapshot
  let unsubscribeSnapshot = () => {};
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    unsubscribeSnapshot = onSnapshot(
      colRef,
      { includeMetadataChanges: false },
      (snapshot) => {
        if (isCancelled) return;
        try {
          const orders: CustomerOrder[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            orders.push({
              id: docSnap.id,
              orderCode: data.orderCode || `XP-${docSnap.id.slice(0, 4)}`,
              items: data.items || [],
              totalAmount: Number(data.totalAmount) || 0,
              paymentMethod: data.paymentMethod || "vietqr",
              status: data.status || "pending",
              note: data.note || "",
              customerPaid: !!data.customerPaid,
              createdAt: Number(data.createdAt) || Date.now(),
              updatedAt: Number(data.updatedAt) || Date.now(),
            });
          });
          // Mới nhất lên đầu
          orders.sort((a, b) => b.createdAt - a.createdAt);
          callback(orders);
        } catch (innerErr) {
          console.warn("Lỗi xử lý snapshot orders:", innerErr);
        }
      },
      (error) => {
        console.warn("Firestore snapshot bị gián đoạn (Brave Shield hoặc mạng):", error);
        // Không xóa sạch dữ liệu đơn bằng mảng rỗng! Tự động fallback sang getDocs
        fetchCustomerOrders().then((fallbackOrders) => {
          if (!isCancelled && fallbackOrders.length > 0) {
            callback(fallbackOrders);
          }
        });
      }
    );
  } catch (outerErr) {
    console.warn("Không thể mở Firestore onSnapshot:", outerErr);
  }

  // 3. Heartbeat polling mỗi 4 giây (Bảo đảm 100% cập nhật kể cả khi trình duyệt chặn WebChannel)
  const pollInterval = setInterval(async () => {
    if (isCancelled) return;
    try {
      const polledOrders = await fetchCustomerOrders();
      if (!isCancelled && polledOrders.length > 0) {
        callback(polledOrders);
      }
    } catch {
      // Bỏ qua lỗi polling ngầm
    }
  }, 4000);

  return () => {
    isCancelled = true;
    unsubscribeSnapshot();
    clearInterval(pollInterval);
  };
};

/**
 * Cập nhật trạng thái đơn hàng:
 * - 'pending' ➔ 'served': Chủ quán bấm "Đã phục vụ nước" (Mở chỗ cho khách quét QR thanh toán)
 * - 'served' ➔ 'completed': Chủ quán bấm "Xác nhận đã thu tiền" (Đơn hoàn thành & ghi nhận hóa đơn)
 * - 'cancelled': Hủy đơn
 */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn:", error);
    throw error;
  }
};

/**
 * Xóa một đơn hàng
 */
export const deleteCustomerOrder = async (orderId: string): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Lỗi xóa đơn hàng:", error);
    throw error;
  }
};

/* ========================================================
   WEBSITE QR CODE GENERATOR (Standee / Chia sẻ website)
   ======================================================== */

/**
 * Sinh ảnh DataURL mã QR cho trang web https://coffee-house-xp.vercel.app
 */
export const generateWebsiteQr = async (
  url: string = OFFICIAL_WEBSITE_URL
): Promise<string> => {
  try {
    return await QRCode.toDataURL(url, {
      width: 450,
      margin: 2,
      color: {
        dark: "#143820",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Lỗi sinh mã QR website:", error);
    return "";
  }
};
