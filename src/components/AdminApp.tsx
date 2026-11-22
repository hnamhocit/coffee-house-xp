import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MantineProvider,
  Container,
  Group,
  Stack,
  Text,
  Title,
  Button,
  SimpleGrid,
  Paper,
  Skeleton,
} from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { IconReceipt, IconCoffee, IconBrandGoogle, IconLogout } from '@tabler/icons-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';
import {
  subscribeProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  resetProductsToDefault,
  subscribeCustomerOrders,
  fetchOrderHistory,
  type OrderHistoryCursor,
  updateOrderStatus,
  deleteCustomerOrder,
  createCustomerOrder,
} from '../services/firebaseService';
import type { MenuItem, MenuCategory } from '../data/menuData';
import { MENU_ITEMS } from '../data/menuData';
import type { CustomerOrder, OrderStatus, OrderItemDetail } from '../types/order';
import { theme } from '../theme/mantineTheme';
import { WebsiteQrModal } from './WebsiteQrModal';
import { fuzzyMatchVietnamese, getSearchRelevanceScore } from '../utils/vietnameseSearch';
import { AdminOrderDialogs } from './AdminOrderDialogs';
import { AdminHeader } from './AdminHeader';
import { AdminOrdersPanel } from './AdminOrdersPanel';
import { AdminProductsPanel } from './AdminProductsPanel';
import { AdminProductModal } from './AdminProductModal';
import { AdminManualOrderModal } from './AdminManualOrderModal';

// Date filter preset types
export type DateFilterPreset = 'all' | 'today' | 'yesterday' | '7days' | 'month' | 'custom';

// Pure Date Parsing & Formatting Helpers
export const parseOrderDate = (createdAt: any): Date => {
  if (!createdAt) return new Date();
  if (typeof createdAt === 'number') return new Date(createdAt);
  if (typeof createdAt?.toDate === 'function') return createdAt.toDate();
  if (typeof createdAt?.seconds === 'number') return new Date(createdAt.seconds * 1000);
  const parsed = new Date(createdAt);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const formatDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getDayLabel = (
  d: Date,
  todayKey: string,
  yesterdayKey: string
): {
  dayLabel: string;
  formattedDate: string;
  isToday: boolean;
  isYesterday: boolean;
} => {
  const key = formatDateKey(d);
  const formattedDate = d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (key === todayKey) {
    return {
      dayLabel: 'Hôm Nay',
      formattedDate,
      isToday: true,
      isYesterday: false,
    };
  }
  if (key === yesterdayKey) {
    return {
      dayLabel: 'Hôm Qua',
      formattedDate,
      isToday: false,
      isYesterday: true,
    };
  }
  return {
    dayLabel: d.toLocaleDateString('vi-VN', { weekday: 'long' }),
    formattedDate,
    isToday: false,
    isYesterday: false,
  };
};

// 2 UID DUY NHẤT ĐƯỢC PHÉP TRUY CẬP VÀO HỆ THỐNG QUẢN TRỊ ADMIN
export const ALLOWED_ADMIN_UIDS = [
  'hedaE90aVETHApCcrrjX0sYbehc2m',
  '8lWfVmxxS9YMnzYm1vk405Fkdhw1',
];

export const AdminApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [products, setProducts] = useState<MenuItem[]>(MENU_ITEMS);
  const [liveOrders, setLiveOrders] = useState<CustomerOrder[]>([]);
  const [history, setHistory] = useState<CustomerOrder[]>([]);
  const [historyCursor, setHistoryCursor] = useState<OrderHistoryCursor>();
  const [historyError, setHistoryError] = useState(false);
  const [liveUnavailable, setLiveUnavailable] = useState(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  const historyRequest = useRef(0);
  const orders = useMemo(() => [...liveOrders, ...history.filter((entry) =>
    !liveOrders.some((live) => live.id === entry.id))], [liveOrders, history]);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [standeeModalOpen, setStandeeModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Check if current logged-in user is one of the 2 authorized admin UIDs
  const isAllowedAdmin = Boolean(user && ALLOWED_ADMIN_UIDS.includes(user.uid));

  // Product edit/create state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MenuCategory>('coffee');
  const [formPrice, setFormPrice] = useState<number>(25000);
  const [formImage, setFormImage] = useState('');
  const [formBadge, setFormBadge] = useState<string>('none');
  const [formAllowIce, setFormAllowIce] = useState(true);
  const [formAllowSugar, setFormAllowSugar] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  // Filters & Invoice state
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerOrder | null>(null);
  const [qrModalOrder, setQrModalOrder] = useState<CustomerOrder | null>(null);

  // Pagination for Orders (Tránh render hàng trăm đơn cũ gây giật lag)
  const [orderPage, setOrderPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Manual POS Order Creation State (Khách gọi trực tiếp tại quán)
  const [manualOrderOpen, setManualOrderOpen] = useState(false);
  const [manualCustomerNote, setManualCustomerNote] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'cash' | 'vietqr'>('cash');
  const [manualInitialStatus, setManualInitialStatus] = useState<OrderStatus>('pending');
  const [manualCart, setManualCart] = useState<{
    item: MenuItem;
    quantity: number;
    ice: string;
    sugar: string;
    note: string;
  }[]>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [savingManualOrder, setSavingManualOrder] = useState(false);

  const handleOpenManualOrder = () => {
    setManualCustomerNote('');
    setManualPaymentMethod('cash');
    setManualInitialStatus('pending');
    setManualCart([]);
    setManualSearchQuery('');
    setManualOrderOpen(true);
  };

  const handleAddManualItem = (product: MenuItem) => {
    setManualCart((prev) => {
      const idx = prev.findIndex((p) => p.item.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          item: product,
          quantity: 1,
          ice: '100% Đá',
          sugar: '100% Đường',
          note: '',
        },
      ];
    });
  };

  const handleUpdateManualQty = (idx: number, delta: number) => {
    setManualCart((prev) => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], quantity: newQty };
      }
      return next;
    });
  };

  const handleUpdateManualOption = (idx: number, field: 'ice' | 'sugar' | 'note', val: string) => {
    setManualCart((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSaveManualOrder = async () => {
    if (manualCart.length === 0) {
      notifications.show({
        title: 'Chưa chọn món',
        message: 'Vui lòng chọn ít nhất 1 món nước vào đơn.',
        color: 'red',
      });
      return;
    }

    const unavailable = manualCart.find(({ item }) => !products.some((product) => product.id === item.id && product.available !== false));
    if (unavailable) {
      notifications.show({ color: 'red', message: `${unavailable.item.name} đã hết hàng hoặc ngừng bán. Hãy bỏ món khỏi đơn.` });
      return;
    }

    try {
      setSavingManualOrder(true);
      const totalAmount = manualCart.reduce(
        (sum, p) => sum + p.quantity * p.item.price,
        0
      );

      const items: OrderItemDetail[] = manualCart.map((p) => ({
        id: p.item.id,
        name: p.item.name,
        price: p.item.price,
        quantity: p.quantity,
        totalPrice: p.quantity * p.item.price,
        ice: p.ice,
        sugar: p.sugar,
        note: p.note,
      }));

      const res = await createCustomerOrder({
        items,
        totalAmount,
        paymentMethod: manualPaymentMethod,
        note: manualCustomerNote.trim(),
        status: manualInitialStatus,
        customerPaid: manualInitialStatus === 'completed',
      });

      const createdOrder: CustomerOrder = {
        id: res.id,
        orderCode: res.orderCode,
        items,
        totalAmount,
        paymentMethod: manualPaymentMethod,
        note: manualCustomerNote.trim(),
        status: manualInitialStatus,
        customerPaid: manualInitialStatus === 'completed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setManualOrderOpen(false);
      if (manualInitialStatus === 'completed' || manualInitialStatus === 'cancelled') handleManualRefreshOrders();

      // Nếu khách chọn chuyển khoản VietQR và chưa thu tiền: tự động mở ngay popup mã QR cho khách quét tại quầy
      if (manualPaymentMethod === 'vietqr' && manualInitialStatus !== 'completed') {
        setQrModalOrder(createdOrder);
        notifications.show({
          title: 'Đã tạo đơn - Mở mã QR VietQR',
          message: `Đơn #${res.orderCode} (${formatPrice(totalAmount)}) - Đang mở mã QR cho khách quét tại quầy.`,
          color: 'teal',
          autoClose: 6000,
        });
      } else {
        notifications.show({
          title: 'Tạo đơn tại quán thành công!',
          message: `Đơn #${res.orderCode} (${formatPrice(totalAmount)}) đã được lưu vào hệ thống.`,
          color: 'teal',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi tạo đơn',
        message: err.message || 'Không thể tạo đơn hàng.',
        color: 'red',
      });
    } finally {
      setSavingManualOrder(false);
    }
  };

  // Sound chime tracking refs
  const prevOrderIdsRef = useRef<Set<string> | null>(null);
  const prevPaidOrdersRef = useRef<Set<string>>(new Set());
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  const historyRange = useMemo(() => {
    if (dateFilter === 'all') return {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(today);
    const to = new Date(today);
    to.setDate(to.getDate() + 1);

    if (dateFilter === 'yesterday') {
      from.setDate(from.getDate() - 1);
      return { from: from.getTime(), to: today.getTime() };
    }
    if (dateFilter === '7days') from.setDate(from.getDate() - 6);
    if (dateFilter === 'month') from.setDate(1);
    if (dateFilter === 'custom' && customDate) {
      const selected = new Date(`${customDate}T00:00:00`);
      const next = new Date(selected);
      next.setDate(next.getDate() + 1);
      return { from: selected.getTime(), to: next.getTime() };
    }
    return { from: from.getTime(), to: to.getTime() };
  }, [dateFilter, customDate, historyRevision]);

  useEffect(() => {
    if (!isAllowedAdmin) return;
    const request = ++historyRequest.current;
    setRefreshingOrders(true);
    setHistory([]);
    setHistoryCursor(undefined);
    setHistoryError(false);
    fetchOrderHistory(historyRange).then((page) => {
      if (request !== historyRequest.current) return;
      setHistory(page.orders);
      setHistoryCursor(page.cursor);
    }).catch(() => {
      if (request === historyRequest.current) setHistoryError(true);
    }).finally(() => {
      if (request === historyRequest.current) setRefreshingOrders(false);
    });
    return () => { historyRequest.current++; };
  }, [isAllowedAdmin, historyRange]);

  const handleManualRefreshOrders = () => setHistoryRevision((version) => version + 1);

  const handleLoadOlderOrders = async () => {
    if (!historyCursor || refreshingOrders) return;
    const request = ++historyRequest.current;
    setRefreshingOrders(true);
    setHistoryError(false);
    try {
      const page = await fetchOrderHistory(historyRange, historyCursor);
      if (request !== historyRequest.current) return;
      setHistory((previous) => [...previous, ...page.orders]);
      setHistoryCursor(page.cursor);
    } catch {
      if (request === historyRequest.current) setHistoryError(true);
    } finally {
      if (request === historyRequest.current) setRefreshingOrders(false);
    }
  };

  // Web Audio Synthetic Chime ("tinh tinh")
  const playOrderChime = (preview = false) => {
    if (!soundEnabled && !preview) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tone 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      // Tone 2: 1320Hz (E6) - "tinh tinh"
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.16);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.16);
      osc2.stop(ctx.currentTime + 0.65);
      osc2.onended = () => { void ctx.close().catch(() => {}); };
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // Reset order pagination to page 1 when filter changes
  useEffect(() => {
    setOrderPage(1);
  }, [dateFilter, orderFilter, customDate]);

  // Track Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time products (ONLY IF AUTHORIZED ADMIN)
  useEffect(() => {
    if (!isAllowedAdmin) return;
    const unsubscribe = subscribeProducts((realtimeProducts) => {
      setProducts(realtimeProducts);
    });
    return () => unsubscribe();
  }, [isAllowedAdmin]);

  // Subscribe to real-time orders (ONLY IF AUTHORIZED ADMIN)
  useEffect(() => {
    if (!isAllowedAdmin) {
      setOrdersLoading(false);
      setLiveOrders([]);
      prevOrderIdsRef.current = null;
      prevPaidOrdersRef.current.clear();
      return;
    }

    setOrdersLoading(true);
    const unsubscribe = subscribeCustomerOrders((realtimeOrders) => {
      setOrdersLoading(false);
      // Check for incoming orders or payment notification to trigger chime
      const previousIds = prevOrderIdsRef.current;
      const nextIds = new Set(realtimeOrders.map(({ id }) => id));
      if (previousIds) {
        if ([...previousIds].some((id) => !nextIds.has(id))) handleManualRefreshOrders();
        const newOrder = realtimeOrders.find((order) => !previousIds.has(order.id) && order.status === 'pending');
        if (newOrder) {
          playOrderChime();
          notifications.show({
            title: `🔔 Đơn Mới #${newOrder.orderCode}!`,
            message: `Khách vừa gửi đơn ${newOrder.items.length} món (${formatPrice(newOrder.totalAmount)}). Hãy soạn món trước nhé!`,
            color: 'yellow',
            autoClose: 5000,
          });
        }

        // Check if any customer just marked paid
        realtimeOrders.forEach((ord) => {
          if (ord.customerPaid && !prevPaidOrdersRef.current.has(ord.id) && ord.status === 'served') {
            playOrderChime();
            notifications.show({
              title: `💰 Khách Báo Đã Trả Tiền! #${ord.orderCode}`,
              message: `Đơn #${ord.orderCode} (${formatPrice(ord.totalAmount)}). Vui lòng kiểm tra tài khoản và xác nhận hoàn tất!`,
              color: 'teal',
              autoClose: 6000,
            });
          }
        });
      }

      prevOrderIdsRef.current = nextIds;
      prevPaidOrdersRef.current = new Set(realtimeOrders.filter((o) => o.customerPaid).map((o) => o.id));
      setLiveOrders(realtimeOrders);
    }, (unavailable) => {
      setLiveUnavailable(unavailable);
      setOrdersLoading(false);
    });
    return () => unsubscribe();
  }, [isAllowedAdmin, soundEnabled]);

  const handleGoogleLogin = async () => {
    try {
      const loggedInUser = await signInWithGoogle();
      if (!ALLOWED_ADMIN_UIDS.includes(loggedInUser.uid)) {
        notifications.show({
          title: 'Truy cập bị từ chối',
          message: `Tài khoản ${loggedInUser.email} không có quyền quản trị quán.`,
          color: 'red',
          autoClose: 6000,
        });
      } else {
        notifications.show({
          title: 'Đăng nhập thành công!',
          message: 'Chào mừng bạn đến với hệ thống quản trị quán.',
          color: 'teal',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Đăng nhập thất bại',
        message: err.message || 'Không thể đăng nhập bằng Google. Vui lòng kiểm tra lại.',
        color: 'red',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      notifications.show({
        title: 'Đã đăng xuất',
        message: 'Bạn đã đăng xuất khỏi trang quản lý.',
        color: 'gray',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  const formatTime = (ts: number) => {
    const d = parseOrderDate(ts);
    return (
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ' ' +
      d.toLocaleDateString('vi-VN')
    );
  };

  // Open product create
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('coffee');
    setFormPrice(25000);
    setFormImage('/images/drinks/cf-muoi.jpg');
    setFormBadge('none');
    setFormAllowIce(true);
    setFormAllowSugar(true);
    setFormOpen(true);
  };

  // Open product edit
  const handleOpenEditProduct = (item: MenuItem) => {
    setEditingProduct(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormImage(item.image);
    setFormBadge(item.badge || 'none');
    setFormAllowIce(item.allowCustomization !== false);
    setFormAllowSugar(item.allowCustomization !== false);
    setFormOpen(true);
  };

  // Save product (Add or Update)
  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      notifications.show({
        title: 'Thiếu tên món',
        message: 'Vui lòng nhập tên món nước.',
        color: 'red',
      });
      return;
    }

    try {
      setSavingProduct(true);
      const productPayload: Omit<MenuItem, 'id'> = {
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice) || 10000,
        image: formImage.trim() || '/images/drinks/cf-muoi.jpg',
        badge: formBadge !== 'none' ? (formBadge as any) : undefined,
        allowCustomization: formAllowIce || formAllowSugar,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productPayload);
        notifications.show({
          title: 'Cập nhật thành công',
          message: `Đã lưu thông tin món "${formName}".`,
          color: 'teal',
        });
      } else {
        await addProduct(productPayload);
        notifications.show({
          title: 'Thêm món thành công',
          message: `Đã thêm món "${formName}" vào thực đơn.`,
          color: 'teal',
        });
      }
      setFormOpen(false);
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi lưu món',
        message: err.message || 'Không thể lưu món nước vào Firestore.',
        color: 'red',
      });
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (item: MenuItem) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa món "${item.name}" khỏi thực đơn?`)) {
      try {
        await deleteProduct(item.id);
        notifications.show({
          title: 'Đã xóa món',
          message: `Món "${item.name}" đã được xóa khỏi thực đơn.`,
          color: 'teal',
        });
      } catch (err: any) {
        notifications.show({
          title: 'Lỗi xóa món',
          message: err.message,
          color: 'red',
        });
      }
    }
  };

  // Reset default 47 products
  const handleResetProducts = async () => {
    if (window.confirm('Khôi phục lại toàn bộ 47 món nước mặc định ban đầu từ hệ thống?')) {
      try {
        await resetProductsToDefault();
        notifications.show({
          title: 'Khôi phục thành công',
          message: 'Đã đồng bộ lại 47 món gốc.',
          color: 'teal',
        });
      } catch (err: any) {
        notifications.show({
          title: 'Lỗi khôi phục',
          message: err.message,
          color: 'red',
        });
      }
    }
  };

  // Update order status
  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      notifications.show({
        title: 'Cập nhật trạng thái',
        message: `Đơn hàng chuyển sang: ${
          status === 'completed'
            ? 'Đã thu tiền & Hoàn tất đơn'
            : status === 'served'
            ? 'Đã phục vụ nước (Màn hình khách mở quét QR)'
            : status === 'cancelled'
            ? 'Đã hủy đơn'
            : 'Đang soạn món'
        }`,
        color: 'teal',
      });
      return true;
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi cập nhật',
        message: err.message,
        color: 'red',
      });
      return false;
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa đơn hàng này khỏi lịch sử?')) {
      try {
        await deleteCustomerOrder(orderId);
        setHistory((previous) => previous.filter(({ id }) => id !== orderId));
        notifications.show({
          title: 'Đã xóa đơn',
          message: 'Đơn hàng đã được xóa khỏi danh sách.',
          color: 'teal',
        });
      } catch (err: any) {
        notifications.show({
          title: 'Lỗi xóa đơn',
          message: err.message,
          color: 'red',
        });
      }
    }
  };

  // Date calculations
  const now = new Date();
  const todayKey = formatDateKey(now);
  const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterdayDate);
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);

  // Filter orders by date range
  const dateFilteredOrders = orders.filter((o) => {
    const oDate = parseOrderDate(o.createdAt);
    const key = formatDateKey(oDate);

    if (dateFilter === 'today') return key === todayKey;
    if (dateFilter === 'yesterday') return key === yesterdayKey;
    if (dateFilter === '7days') return oDate.getTime() >= sevenDaysAgo.getTime();
    if (dateFilter === 'month') return oDate.getFullYear() === now.getFullYear() && oDate.getMonth() === now.getMonth();
    if (dateFilter === 'custom') return key === (customDate || todayKey);
    return true; // 'all'
  });

  // Filter dateFilteredOrders by orderStatus
  const displayOrders = dateFilteredOrders.filter((o) => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'pending') return o.status === 'pending' || o.status === 'preparing';
    return o.status === orderFilter;
  });

  // KPIs for the selected date range
  const completedInPeriod = dateFilteredOrders.filter((o) => o.status === 'completed');
  const totalRevenueInPeriod = completedInPeriod.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingInPeriod = dateFilteredOrders.filter((o) => o.status === 'pending' || o.status === 'preparing');
  const servedInPeriod = dateFilteredOrders.filter((o) => o.status === 'served');

  // Overall counts for badges & alerts
  const allPendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing');
  const allServedOrders = orders.filter((o) => o.status === 'served');

  const dateFilterLabel =
    dateFilter === 'today'
      ? 'Hôm Nay'
      : dateFilter === 'yesterday'
      ? 'Hôm Qua'
      : dateFilter === '7days'
      ? '7 Ngày Qua'
      : dateFilter === 'month'
      ? 'Tháng Này'
      : dateFilter === 'custom' && customDate
      ? `Ngày ${customDate.split('-').reverse().join('/')}`
      : 'Tất Cả';

  // Pagination calculations for Orders
  const totalOrdersInView = displayOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrdersInView / pageSize));
  const safePage = Math.min(orderPage, totalPages);

  // Paginated slice of orders (newest first, only pageSize orders in DOM)
  const paginatedOrders = useMemo(() => {
    const sorted = [...displayOrders].sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : parseOrderDate(a.createdAt).getTime();
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : parseOrderDate(b.createdAt).getTime();
      return timeB - timeA;
    });

    const startIndex = (safePage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [displayOrders, safePage, pageSize]);

  // Group ONLY paginatedOrders by date for structured display
  const groupedOrders = useMemo(() => {
    const groupsMap = new Map<string, CustomerOrder[]>();

    for (const ord of paginatedOrders) {
      const key = formatDateKey(parseOrderDate(ord.createdAt));
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(ord);
    }

    const groups: {
      dateKey: string;
      dayLabel: string;
      formattedDate: string;
      isToday: boolean;
      isYesterday: boolean;
      orders: CustomerOrder[];
      dayTotalRevenue: number;
      dayPendingCount: number;
      dayServedCount: number;
      dayCompletedCount: number;
    }[] = [];

    const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));

    for (const dateKey of sortedKeys) {
      const ords = groupsMap.get(dateKey)!;
      const firstDate = parseOrderDate(ords[0].createdAt);
      const { dayLabel, formattedDate, isToday, isYesterday } = getDayLabel(firstDate, todayKey, yesterdayKey);
      const completed = ords.filter((o) => o.status === 'completed');
      const dayTotalRevenue = completed.reduce((sum, o) => sum + o.totalAmount, 0);
      const dayPendingCount = ords.filter((o) => o.status === 'pending' || o.status === 'preparing').length;
      const dayServedCount = ords.filter((o) => o.status === 'served').length;
      const dayCompletedCount = completed.length;

      groups.push({
        dateKey,
        dayLabel,
        formattedDate,
        isToday,
        isYesterday,
        orders: ords,
        dayTotalRevenue,
        dayPendingCount,
        dayServedCount,
        dayCompletedCount,
      });
    }

    return groups;
  }, [paginatedOrders, todayKey, yesterdayKey]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p: MenuItem) => {
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) {
        return false;
      }
      if (productSearch.trim()) {
        return fuzzyMatchVietnamese(productSearch, p.name, `${p.category} ${p.badge || ''}`);
      }
      return true;
    });

    if (productSearch.trim()) {
      list = [...list].sort((a: MenuItem, b: MenuItem) => {
        return (
          getSearchRelevanceScore(productSearch, b.name, b.category) -
          getSearchRelevanceScore(productSearch, a.name, a.category)
        );
      });
    }
    return list;
  }, [products, productCategoryFilter, productSearch]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" zIndex={2000} autoClose={3000} />

      <div className="admin-app">
        {/* TOP HEADER NAVIGATION */}
        <AdminHeader
          onOpenQr={() => setStandeeModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) playOrderChime(true);
          }}
          signedIn={Boolean(user)}
          onLogout={handleLogout}
        />

        {/* MAIN BODY */}
        <main className="admin-main">
          <Container size="xl" className="admin-shell">
            {authLoading ? (
              <Stack gap="md" aria-label="Đang tải trang quản trị" aria-busy="true">
                <Skeleton height={38} width={160} />
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                  {[1, 2, 3, 4].map((key) => <Skeleton key={key} height={104} />)}
                </SimpleGrid>
              </Stack>
            ) : !user || !isAllowedAdmin ? (
              <Paper className="admin-auth-card" withBorder radius="lg" p="xl" ta="center">
                <Title order={1} size="h3">{user ? 'Tài khoản chưa có quyền quản trị' : 'Đăng nhập quản trị'}</Title>
                <Text c="dimmed" size="sm" mt="xs" mb="lg">
                  {user ? user.email : 'Dùng tài khoản Google của quán để xem đơn và chỉnh thực đơn.'}
                </Text>
                {user ? (
                  <Button variant="light" leftSection={<IconLogout size={18} />} onClick={handleLogout}>Đăng xuất</Button>
                ) : (
                  <Button leftSection={<IconBrandGoogle size={18} />} onClick={handleGoogleLogin}>Đăng nhập với Google</Button>
                )}
              </Paper>
            ) : (
              <Stack gap="md">
                <Group className="admin-page-heading" justify="space-between" align="end" gap="md">
                  <div>
                    <Title order={1} size="h2">{activeTab === 'orders' ? 'Đơn hàng' : 'Thực đơn'}</Title>
                    <Text size="sm" c="dimmed">{user.displayName || user.email}</Text>
                  </div>
                  <Group className="admin-navigation" role="group" aria-label="Mục quản trị" gap={4} wrap="nowrap">
                    <Button
                      variant={activeTab === 'orders' ? 'white' : 'subtle'}
                      aria-pressed={activeTab === 'orders'}
                      size="compact-md"
                      leftSection={<IconReceipt size={16} />}
                      onClick={() => setActiveTab('orders')}
                    >
                      Đơn hàng
                    </Button>
                    <Button
                      variant={activeTab === 'products' ? 'white' : 'subtle'}
                      aria-pressed={activeTab === 'products'}
                      size="compact-md"
                      leftSection={<IconCoffee size={16} />}
                      onClick={() => setActiveTab('products')}
                    >
                      Thực đơn
                    </Button>
                  </Group>
                </Group>

                {/* TAB 1: ORDERS & INVOICES */}
                {activeTab === 'orders' && (
                  <AdminOrdersPanel
                    dateFilterLabel={dateFilterLabel}
                    ordersLoading={ordersLoading}
                    formatPrice={formatPrice}
                    totalRevenueInPeriod={totalRevenueInPeriod}
                    allPendingOrders={allPendingOrders}
                    pendingInPeriod={pendingInPeriod}
                    allServedOrders={allServedOrders}
                    servedInPeriod={servedInPeriod}
                    dateFilteredOrders={dateFilteredOrders}
                    completedInPeriod={completedInPeriod}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    setCustomDate={setCustomDate}
                    orderFilter={orderFilter}
                    setOrderFilter={setOrderFilter}
                    handleOpenManualOrder={handleOpenManualOrder}
                    refreshingOrders={refreshingOrders}
                    handleManualRefreshOrders={handleManualRefreshOrders}
                    liveUnavailable={liveUnavailable}
                    historyError={historyError}
                    historyCursor={historyCursor}
                    handleLoadOlderOrders={handleLoadOlderOrders}
                    customDate={customDate}
                    totalOrdersInView={totalOrdersInView}
                    safePage={safePage}
                    pageSize={pageSize}
                    totalPages={totalPages}
                    setOrderPage={setOrderPage}
                    groupedOrders={groupedOrders}
                    formatTime={formatTime}
                    handleStatusChange={handleStatusChange}
                    setSelectedInvoice={setSelectedInvoice}
                    setQrModalOrder={setQrModalOrder}
                    handleDeleteOrder={handleDeleteOrder}
                    setPageSize={setPageSize}
                  />
                )}

                {/* TAB 2: PRODUCTS & OPTIONS MANAGEMENT */}
                {activeTab === 'products' && (
                  <AdminProductsPanel
                    productSearch={productSearch}
                    setProductSearch={setProductSearch}
                    productCategoryFilter={productCategoryFilter}
                    setProductCategoryFilter={setProductCategoryFilter}
                    products={products}
                    handleOpenCreateProduct={handleOpenCreateProduct}
                    handleResetProducts={handleResetProducts}
                    filteredProducts={filteredProducts}
                    formatPrice={formatPrice}
                    handleOpenEditProduct={handleOpenEditProduct}
                    handleDeleteProduct={handleDeleteProduct}
                  />
                )}
              </Stack>
            )}
          </Container>
        </main>

        {/* MODAL / FORM: THÊM / CHỈNH SỬA MÓN NƯỚC (FULL OPTIONS, ZERO Z-INDEX ISSUES) */}
        <AdminProductModal
          formOpen={formOpen}
          setFormOpen={setFormOpen}
          editingProduct={editingProduct}
          formName={formName}
          setFormName={setFormName}
          formCategory={formCategory}
          setFormCategory={setFormCategory}
          formPrice={formPrice}
          setFormPrice={setFormPrice}
          formImage={formImage}
          setFormImage={setFormImage}
          formBadge={formBadge}
          setFormBadge={setFormBadge}
          formAllowIce={formAllowIce}
          setFormAllowIce={setFormAllowIce}
          formAllowSugar={formAllowSugar}
          setFormAllowSugar={setFormAllowSugar}
          handleSaveProduct={handleSaveProduct}
          savingProduct={savingProduct}
        />

        {/* MODAL: TẠO ĐƠN HÀNG TẠI QUÁN (POS) */}
        <AdminManualOrderModal
          manualOrderOpen={manualOrderOpen}
          setManualOrderOpen={setManualOrderOpen}
          manualCustomerNote={manualCustomerNote}
          setManualCustomerNote={setManualCustomerNote}
          manualPaymentMethod={manualPaymentMethod}
          setManualPaymentMethod={setManualPaymentMethod}
          manualInitialStatus={manualInitialStatus}
          setManualInitialStatus={setManualInitialStatus}
          products={products.filter(({ available }) => available !== false)}
          manualSearchQuery={manualSearchQuery}
          setManualSearchQuery={setManualSearchQuery}
          formatPrice={formatPrice}
          handleAddManualItem={handleAddManualItem}
          manualCart={manualCart}
          setManualCart={setManualCart}
          handleUpdateManualQty={handleUpdateManualQty}
          handleUpdateManualOption={handleUpdateManualOption}
          handleSaveManualOrder={handleSaveManualOrder}
          savingManualOrder={savingManualOrder}
        />

        {/* MODAL: SIMPLE INVOICE / PHIẾU TÍNH TIỀN */}
        <AdminOrderDialogs
          selectedInvoice={selectedInvoice}
          qrModalOrder={qrModalOrder}
          onCloseInvoice={() => setSelectedInvoice(null)}
          onClosePayment={() => setQrModalOrder(null)}
          formatPrice={formatPrice}
          formatTime={formatTime}
          handleStatusChange={handleStatusChange}
        />

        {/* MODAL: STANDEE QR CODE QUÁN (CHO KHÁCH QUÉT VÀO WEB GỌI MÓN) */}
        <WebsiteQrModal
          opened={standeeModalOpen}
          onClose={() => setStandeeModalOpen(false)}
        />
      </div>
    </MantineProvider>
  );
};
