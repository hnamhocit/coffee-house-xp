import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  writeBatch,
  query,
  where,
  limit,
  orderBy,
  startAfter,
  getDocsFromServer,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { customerDb, db } from "../lib/firebase";
import { priceOrderItems } from "./orderPricing";
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

export const resetProductsToDefault = async (): Promise<void> => {
  const batch = writeBatch(db);
  for (const item of MENU_ITEMS) {
    batch.set(doc(db, PRODUCTS_COLLECTION, item.id), item);
  }
  await batch.commit();
};

export const subscribeProducts = (
  callback: (products: MenuItem[]) => void
): (() => void) => {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    return onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        try {
          if (snapshot.empty && snapshot.metadata.fromCache) return;
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
  callback: (order: CustomerOrder | null, fromCache: boolean) => void,
  onError: () => void
): (() => void) => {
  try {
    const docRef = doc(customerDb, ORDERS_COLLECTION, orderId);
    return onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          callback(decodeOrder(docSnap), docSnap.metadata.fromCache);
          if (docSnap.metadata.fromCache) onError();
        } else if (!docSnap.metadata.fromCache) {
          callback(null, false);
        } else {
          onError();
        }
      },
      (error) => {
        console.warn("Lỗi lắng nghe cập nhật đơn hàng:", error);
        onError();
      }
    );
  } catch (err) {
    console.warn("Không thể đăng ký listener đơn hàng đơn lẻ:", err);
    onError();
    return () => {};
  }
};

/**
 * Khách bấm "Tôi đã chuyển khoản / Đã gửi tiền mặt"
 */
export const markOrderCustomerPaid = async (orderId: string): Promise<void> => {
  try {
    const docRef = doc(customerDb, ORDERS_COLLECTION, orderId);
    await runTransaction(customerDb, async (transaction) => {
      const order = await transaction.get(docRef);
      if (!order.exists() || order.get("status") !== "served") {
        throw new Error("Đơn hàng chưa ở bước thanh toán.");
      }
      if (!order.get("customerPaid")) {
        transaction.update(docRef, { customerPaid: true, updatedAt: serverTimestamp() });
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật khách đã trả tiền:", error);
    throw error;
  }
};

function decodeOrder(snapshot: QueryDocumentSnapshot): CustomerOrder {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    orderCode: data.orderCode || `XP-${snapshot.id.slice(0, 4)}`,
    items: Array.isArray(data.items) ? data.items.flatMap((item) => {
      if (!item || typeof item.id !== "string" || typeof item.name !== "string" || !Number.isSafeInteger(item.quantity)) return [];
      return [{
        id: item.id, name: item.name, quantity: item.quantity,
        price: Number.isSafeInteger(item.price) ? item.price : 0,
        totalPrice: Number.isSafeInteger(item.totalPrice) ? item.totalPrice : 0,
        ice: typeof item.ice === "string" ? item.ice : "",
        sugar: typeof item.sugar === "string" ? item.sugar : "",
        note: typeof item.note === "string" ? item.note : "",
      }];
    }) : [],
    totalAmount: Number(data.totalAmount) || 0,
    paymentMethod: data.paymentMethod || "vietqr",
    status: data.status || "pending",
    note: data.note || "",
    partySize: Number.isSafeInteger(data.partySize) && data.partySize > 0 ? data.partySize : undefined,
    priceVerified: data.priceVerified !== false,
    customerPaid: Boolean(data.customerPaid),
    createdAt: Number(data.createdAt) || data.createdAt?.toMillis?.() || Date.now(),
    updatedAt: Number(data.updatedAt) || data.updatedAt?.toMillis?.(),
  };
}

export type OrderHistoryCursor = QueryDocumentSnapshot;
const HISTORY_PAGE_SIZE = 50;

export async function fetchOrderHistory(
  range: { from?: number; to?: number },
  cursor?: OrderHistoryCursor,
) {
  const history = query(
    collection(db, ORDERS_COLLECTION),
    ...(range.from === undefined ? [] : [where("createdAt", ">=", range.from)]),
    ...(range.to === undefined ? [] : [where("createdAt", "<", range.to)]),
    orderBy("createdAt", "desc"),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(HISTORY_PAGE_SIZE + 1),
  );
  const snapshot = await getDocsFromServer(history);
  const page = snapshot.docs.slice(0, HISTORY_PAGE_SIZE);
  return {
    orders: page.map(decodeOrder).filter(({ status }) => status === "completed" || status === "cancelled"),
    cursor: snapshot.docs.length > HISTORY_PAGE_SIZE ? page.at(-1) : undefined,
  };
}

export function subscribeCustomerOrders(
  callback: (orders: CustomerOrder[]) => void,
  onUnavailable: (unavailable: boolean) => void,
): () => void {
  const activeOrders = query(collection(db, ORDERS_COLLECTION), where("status", "in", ["pending", "preparing", "served"]));
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const poll = async () => {
    try {
      const snapshot = await getDocsFromServer(activeOrders);
      if (!stopped) {
        callback(snapshot.docs.map(decodeOrder));
        onUnavailable(false);
      }
    } catch {
      if (!stopped) onUnavailable(true);
    } finally {
      if (!stopped) timer = setTimeout(poll, 10000);
    }
  };

  const unsubscribe = onSnapshot(activeOrders, { includeMetadataChanges: true }, (snapshot) => {
    onUnavailable(snapshot.metadata.fromCache);
    if (!snapshot.metadata.fromCache) callback(snapshot.docs.map(decodeOrder));
  }, () => {
    onUnavailable(true);
    void poll();
  });

  return () => {
    stopped = true;
    unsubscribe();
    clearTimeout(timer);
  };
}

const nextOrderStatuses: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["preparing", "served", "completed", "cancelled"],
  preparing: ["served", "completed", "cancelled"],
  served: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await runTransaction(db, async (transaction) => {
    const order = await transaction.get(docRef);
    if (!order.exists()) throw new Error("Đơn này không còn trong danh sách.");
    const current = (order.get("status") || "pending") as OrderStatus;
    if (current === status) return;
    if (!nextOrderStatuses[current]?.includes(status)) {
      throw new Error("Trạng thái đơn đã thay đổi. Hãy tải lại trước khi xử lý.");
    }
    const verified = status !== "cancelled" && order.get("priceVerified") === false
      ? { ...await priceOrderItems(db, transaction, order.get("items")), priceVerified: true }
      : {};
    transaction.update(docRef, { ...verified, status, updatedAt: serverTimestamp() });
  });
}

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
    const { default: QRCode } = await import("qrcode");
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
