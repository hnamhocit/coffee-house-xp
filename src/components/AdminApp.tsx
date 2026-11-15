import React, { useState, useEffect, useRef } from 'react';
import {
  MantineProvider,
  Container,
  Group,
  Stack,
  Text,
  Title,
  Button,
  Badge,
  TextInput,
  NumberInput,
  Switch,
  Card,
  SimpleGrid,
  ActionIcon,
  Table,
  Avatar,
  Divider,
  Paper,
  Box,
  Tooltip,
  Textarea,
  Modal,
  ThemeIcon,
} from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import {
  IconLock,
  IconReceipt,
  IconCoffee,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconClock,
  IconBrandGoogle,
  IconLogout,
  IconRefresh,
  IconSearch,
  IconEye,
  IconArrowLeft,
  IconCurrencyDong,
  IconCup,
  IconFlame,
  IconSettings,
  IconQrcode,
  IconBell,
  IconVolume,
  IconVolumeOff,
  IconAlertCircle,
  IconCalendar,
  IconCalendarEvent,
  IconFilter,
  IconX,
} from '@tabler/icons-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';
import {
  subscribeProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  resetProductsToDefault,
  subscribeCustomerOrders,
  fetchCustomerOrders,
  updateOrderStatus,
  deleteCustomerOrder,
} from '../services/firebaseService';
import type { MenuItem, MenuCategory } from '../data/menuData';
import { MENU_ITEMS, CATEGORIES } from '../data/menuData';
import type { CustomerOrder, OrderStatus } from '../types/order';
import { theme } from '../theme/mantineTheme';
import { WebsiteQrModal } from './WebsiteQrModal';

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

export const AdminApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<MenuItem[]>(MENU_ITEMS);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [standeeModalOpen, setStandeeModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

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
  const [formTemperature, setFormTemperature] = useState<'both' | 'ice-only' | 'hot-only'>('both');
  const [formDescription, setFormDescription] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Filters & Invoice state
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerOrder | null>(null);

  // Sound chime tracking refs
  const prevOrderCountRef = useRef<number | null>(null);
  const prevPaidOrdersRef = useRef<Set<string>>(new Set());
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  // Manual refresh orders
  const handleManualRefreshOrders = async () => {
    try {
      setRefreshingOrders(true);
      const latestOrders = await fetchCustomerOrders();
      setOrders(latestOrders);
      notifications.show({
        title: 'Đã cập nhật đơn hàng!',
        message: `Đã tải lại ${latestOrders.length} đơn hàng từ Firestore.`,
        color: 'teal',
      });
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi tải đơn',
        message: err.message,
        color: 'red',
      });
    } finally {
      setRefreshingOrders(false);
    }
  };

  // Web Audio Synthetic Chime ("tinh tinh")
  const playOrderChime = () => {
    if (!soundEnabled) return;
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
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // Track Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time products
  useEffect(() => {
    const unsubscribe = subscribeProducts((realtimeProducts) => {
      setProducts(realtimeProducts);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time orders (runs immediately on mount!)
  useEffect(() => {
    const unsubscribe = subscribeCustomerOrders((realtimeOrders) => {
      // Check for incoming orders or payment notification to trigger chime
      if (prevOrderCountRef.current !== null) {
        if (realtimeOrders.length > prevOrderCountRef.current) {
          playOrderChime();
          const newOrder = realtimeOrders[0];
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

      prevOrderCountRef.current = realtimeOrders.length;
      prevPaidOrdersRef.current = new Set(realtimeOrders.filter((o) => o.customerPaid).map((o) => o.id));
      setOrders(realtimeOrders);
    });
    return () => unsubscribe();
  }, [soundEnabled]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      notifications.show({
        title: 'Đăng nhập thành công!',
        message: 'Chào mừng bạn đến với hệ thống quản trị quán.',
        color: 'teal',
      });
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

  const formatTime = (ts: any) => {
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
    setFormTemperature('both');
    setFormDescription('');
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
    setFormTemperature('both');
    setFormDescription('');
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
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi cập nhật',
        message: err.message,
        color: 'red',
      });
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa đơn hàng này khỏi lịch sử?')) {
      try {
        await deleteCustomerOrder(orderId);
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

  // Counts per date preset across all orders
  const todayCount = orders.filter((o) => formatDateKey(parseOrderDate(o.createdAt)) === todayKey).length;
  const yesterdayCount = orders.filter((o) => formatDateKey(parseOrderDate(o.createdAt)) === yesterdayKey).length;
  const sevenDaysCount = orders.filter((o) => parseOrderDate(o.createdAt).getTime() >= sevenDaysAgo.getTime()).length;
  const thisMonthCount = orders.filter((o) => {
    const d = parseOrderDate(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  // Filter orders by date range
  const dateFilteredOrders = orders.filter((o) => {
    const oDate = parseOrderDate(o.createdAt);
    const key = formatDateKey(oDate);

    if (dateFilter === 'today') return key === todayKey;
    if (dateFilter === 'yesterday') return key === yesterdayKey;
    if (dateFilter === '7days') return oDate.getTime() >= sevenDaysAgo.getTime();
    if (dateFilter === 'month') return oDate.getFullYear() === now.getFullYear() && oDate.getMonth() === now.getMonth();
    if (dateFilter === 'custom') return customDate ? key === customDate : true;
    return true; // 'all'
  });

  // Filter dateFilteredOrders by orderStatus
  const displayOrders = dateFilteredOrders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  // KPIs for the selected date range
  const completedInPeriod = dateFilteredOrders.filter((o) => o.status === 'completed');
  const totalRevenueInPeriod = completedInPeriod.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingInPeriod = dateFilteredOrders.filter((o) => o.status === 'pending');
  const servedInPeriod = dateFilteredOrders.filter((o) => o.status === 'served');
  const cancelledInPeriod = dateFilteredOrders.filter((o) => o.status === 'cancelled');

  // Overall counts for badges & alerts
  const allPendingOrders = orders.filter((o) => o.status === 'pending');
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

  // Group displayOrders by date for structured display
  const groupedOrders = React.useMemo(() => {
    const groupsMap = new Map<string, CustomerOrder[]>();

    // Sort displayOrders descending (newest timestamp first)
    const sorted = [...displayOrders].sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : parseOrderDate(a.createdAt).getTime();
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : parseOrderDate(b.createdAt).getTime();
      return timeB - timeA;
    });

    for (const ord of sorted) {
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
      const dayPendingCount = ords.filter((o) => o.status === 'pending').length;
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
  }, [displayOrders, todayKey, yesterdayKey]);

  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) {
      return false;
    }
    if (productSearch.trim()) {
      return p.name.toLowerCase().includes(productSearch.toLowerCase().trim());
    }
    return true;
  });

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" zIndex={2000} autoClose={3000} />

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f9f6' }}>
        {/* TOP HEADER NAVIGATION */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1.5px solid #dceee1',
            padding: '10px 14px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <Container size="xl" px={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Brand Logo & Title */}
            <Group gap="xs" wrap="nowrap">
              <img
                src="/images/logo.png"
                alt="Logo"
                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ lineHeight: 1.2 }}>
                <Text fw={800} size="sm" c="#14281b" style={{ fontFamily: 'var(--font-heading)' }}>
                  Xuân Phạm <span style={{ color: '#226135' }}>Coffee</span>
                </Text>
                <Text size="11px" c="#607667">
                  Quản Trị Quán Real-Time
                </Text>
              </div>
            </Group>

            {/* Desktop Actions (visibleFrom="sm") */}
            <Group gap="xs" visibleFrom="sm">
              <Button
                size="xs"
                color="bamboo"
                variant="outline"
                leftSection={<IconQrcode size={16} />}
                onClick={() => setStandeeModalOpen(true)}
              >
                Mã QR Standee Quán
              </Button>

              <Tooltip label={soundEnabled ? 'Chuông báo đơn mới (tinh tinh): ĐANG BẬT' : 'Chuông báo: ĐANG TẮT'} withArrow>
                <ActionIcon
                  size="md"
                  variant={soundEnabled ? 'light' : 'subtle'}
                  color={soundEnabled ? 'teal' : 'gray'}
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    if (next) playOrderChime();
                  }}
                  title="Bật/Tắt âm thanh báo đơn mới"
                >
                  {soundEnabled ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
                </ActionIcon>
              </Tooltip>

              <Button
                component="a"
                href="/"
                variant="light"
                color="bamboo"
                size="xs"
                leftSection={<IconArrowLeft size={16} />}
              >
                Về Trang Khách
              </Button>

              {user && (
                <Group gap="xs" ml="xs">
                  <Avatar src={user.photoURL} alt={user.displayName || 'Admin'} radius="xl" size="sm" />
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    leftSection={<IconLogout size={14} />}
                    onClick={handleLogout}
                  >
                    Đăng Xuất
                  </Button>
                </Group>
              )}
            </Group>

            {/* Mobile Actions (hiddenFrom="sm") - Compact Single Row */}
            <Group gap={6} hiddenFrom="sm" wrap="nowrap">
              <ActionIcon
                size="md"
                variant="outline"
                color="bamboo"
                onClick={() => setStandeeModalOpen(true)}
                title="Mã QR Standee Quán"
                aria-label="QR Standee"
              >
                <IconQrcode size={18} />
              </ActionIcon>

              <ActionIcon
                size="md"
                variant={soundEnabled ? 'light' : 'subtle'}
                color={soundEnabled ? 'teal' : 'gray'}
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playOrderChime();
                }}
                title="Chuông báo"
                aria-label="Chuông báo đơn"
              >
                {soundEnabled ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
              </ActionIcon>

              <ActionIcon
                component="a"
                href="/"
                size="md"
                variant="light"
                color="bamboo"
                title="Về trang khách"
                aria-label="Về trang khách"
              >
                <IconArrowLeft size={18} />
              </ActionIcon>

              {user && (
                <ActionIcon
                  size="md"
                  variant="subtle"
                  color="red"
                  onClick={handleLogout}
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <IconLogout size={18} />
                </ActionIcon>
              )}
            </Group>
          </Container>
        </header>

        {/* MAIN BODY */}
        <main style={{ flex: 1, padding: '14px 0' }}>
          <Container size="xl" px={{ base: 'xs', sm: 'md' }}>
            {/* State 1: Auth Loading */}
            {authLoading ? (
              <Stack align="center" justify="center" py="5rem">
                <Text size="sm" c="#455b4e">
                  Đang tải thông tin xác thực Firebase...
                </Text>
              </Stack>
            ) : !user ? (
              /* State 2: Login Required (Full-page Card) */
              <div style={{ maxWidth: '480px', margin: '40px auto' }}>
                <Paper
                  withBorder
                  p="xl"
                  radius="lg"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#b8d7be',
                    boxShadow: '0 8px 30px rgba(34, 97, 53, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src="/images/logo.png"
                    alt="Logo Quán"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      margin: '0 auto 16px auto',
                      display: 'block',
                      border: '2px solid #b8d7be',
                    }}
                  />

                  <Title order={2} c="#14281b" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '8px' }}>
                    Đăng Nhập Quản Trị Quán
                  </Title>

                  <Text size="sm" c="#536b5a" mb="xl" style={{ lineHeight: 1.5 }}>
                    Khu vực dành cho chủ quán và nhân viên quản lý: cập nhật thực đơn, điều chỉnh giá nước, xem đơn đặt món thời gian thực và quản lý lịch sử hóa đơn.
                  </Text>

                  <Button
                    size="md"
                    color="bamboo"
                    fullWidth
                    leftSection={<IconBrandGoogle size={20} />}
                    onClick={handleGoogleLogin}
                    style={{ fontWeight: 700 }}
                  >
                    Đăng Nhập Bằng Tài Khoản Google
                  </Button>

                  <Text size="xs" c="#789080" mt="md">
                    Hệ thống xác thực qua Google Firebase an toàn và bảo mật.
                  </Text>
                </Paper>
              </div>
            ) : (
              /* State 3: Admin Dashboard (Full Page) */
              <Stack gap="md">
                {/* Welcome & 2-Tab Navigation Bar */}
                <Paper
                  withBorder
                  p={{ base: 'xs', sm: 'md' }}
                  radius="md"
                  style={{
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid #226135',
                    borderColor: '#dceee1',
                  }}
                >
                  <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                    <div>
                      <Text fw={800} size="sm" c="#174421">
                        Xin chào, {user.displayName || 'Chủ Quán Xuân Phạm'}!
                      </Text>
                      <Text size="11px" c="#546c5c">
                        Tài khoản: <b>{user.email}</b>
                      </Text>
                    </div>
                  </Group>

                  {/* Responsive 2-Tab Grid Bar (100% Mobile Optimized) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      width: '100%',
                      marginTop: '10px',
                    }}
                  >
                    <Button
                      variant={activeTab === 'orders' ? 'filled' : 'light'}
                      color="bamboo"
                      size="sm"
                      leftSection={<IconReceipt size={17} />}
                      onClick={() => setActiveTab('orders')}
                      style={{ fontWeight: 700 }}
                    >
                      Đơn Hàng ({orders.length})
                    </Button>

                    <Button
                      variant={activeTab === 'products' ? 'filled' : 'light'}
                      color="bamboo"
                      size="sm"
                      leftSection={<IconCoffee size={17} />}
                      onClick={() => setActiveTab('products')}
                      style={{ fontWeight: 700 }}
                    >
                      Thực Đơn ({products.length})
                    </Button>
                  </div>
                </Paper>

                {/* TAB 1: ORDERS & INVOICES */}
                {activeTab === 'orders' && (
                  <Stack gap="md">
                    {/* KPI Cards - Clean & Minimal (Zero noisy desc text under numbers) */}
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={{ base: 'xs', sm: 'md' }}>
                      {/* Card 1: Doanh Thu */}
                      <Paper
                        withBorder
                        p={{ base: 'xs', sm: 'md' }}
                        radius="md"
                        style={{
                          backgroundColor: '#ffffff',
                          borderColor: '#b8d7be',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Group justify="space-between" align="center" mb={2} wrap="nowrap">
                          <Text size="11px" c="#546c5c" fw={700} tt="uppercase">
                            DOANH THU
                          </Text>
                          <Badge size="xs" variant="light" color="teal">
                            {dateFilterLabel}
                          </Badge>
                        </Group>
                        <Text fw={800} size="lg" c="#226135" style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                          {formatPrice(totalRevenueInPeriod)}
                        </Text>
                      </Paper>

                      {/* Card 2: 1. Đang Soạn Món */}
                      <Paper
                        withBorder
                        p={{ base: 'xs', sm: 'md' }}
                        radius="md"
                        style={{
                          backgroundColor: '#ffffff',
                          borderColor: '#fcc419',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Group justify="space-between" align="center" mb={2} wrap="nowrap">
                          <Text size="11px" c="#8c5800" fw={700} tt="uppercase">
                            1. ĐANG SOẠN
                          </Text>
                          {allPendingOrders.length > pendingInPeriod.length && (
                            <Badge size="xs" color="yellow" variant="filled">
                              +{allPendingOrders.length - pendingInPeriod.length} cũ
                            </Badge>
                          )}
                        </Group>
                        <Text fw={800} size="lg" c="#f59f00" style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                          {pendingInPeriod.length} đơn
                        </Text>
                      </Paper>

                      {/* Card 3: 2. Đã Phục Vụ Nước */}
                      <Paper
                        withBorder
                        p={{ base: 'xs', sm: 'md' }}
                        radius="md"
                        style={{
                          backgroundColor: '#ffffff',
                          borderColor: '#74c0fc',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Group justify="space-between" align="center" mb={2} wrap="nowrap">
                          <Text size="11px" c="#184e77" fw={700} tt="uppercase">
                            2. ĐÃ PHỤC VỤ
                          </Text>
                          {allServedOrders.length > servedInPeriod.length && (
                            <Badge size="xs" color="blue" variant="filled">
                              +{allServedOrders.length - servedInPeriod.length} cũ
                            </Badge>
                          )}
                        </Group>
                        <Text fw={800} size="lg" c="#1c7ed6" style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                          {servedInPeriod.length} đơn
                        </Text>
                      </Paper>

                      {/* Card 4: Tổng Số Đơn */}
                      <Paper
                        withBorder
                        p={{ base: 'xs', sm: 'md' }}
                        radius="md"
                        style={{
                          backgroundColor: '#ffffff',
                          borderColor: '#dceee1',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Text size="11px" c="#546c5c" fw={700} tt="uppercase" mb={2}>
                          TỔNG SỐ ĐƠN
                        </Text>
                        <Text fw={800} size="lg" c="#14281b" style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                          {dateFilteredOrders.length} đơn
                        </Text>
                      </Paper>
                    </SimpleGrid>

                    {/* Filter Controls: Date Preset Chips + Status Chips + Refresh */}
                    <Paper withBorder p="xs" radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#dceee1' }}>
                      <Stack gap="xs">
                        {/* ROW 1: DATE PRESETS & CUSTOM DATE */}
                        <div>
                          <Group justify="space-between" align="center" mb={6}>
                            <Group gap={4} align="center">
                              <IconCalendar size={15} color="#226135" />
                              <Text size="11px" fw={700} c="#174421" tt="uppercase">
                                Phân Loại Theo Ngày:
                              </Text>
                            </Group>

                            {dateFilter === 'custom' && (
                              <Button
                                size="compact-xs"
                                variant="subtle"
                                color="red"
                                leftSection={<IconX size={12} />}
                                onClick={() => {
                                  setDateFilter('all');
                                  setCustomDate('');
                                }}
                              >
                                Bỏ chọn ngày
                              </Button>
                            )}
                          </Group>

                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              overflowX: 'auto',
                              WebkitOverflowScrolling: 'touch',
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none',
                              padding: '2px 0',
                              alignItems: 'center',
                            }}
                          >
                            <Button
                              size="xs"
                              variant={dateFilter === 'all' ? 'filled' : 'subtle'}
                              color="bamboo"
                              onClick={() => {
                                setDateFilter('all');
                                setCustomDate('');
                              }}
                              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                              Tất Cả Lịch Sử ({orders.length})
                            </Button>

                            <Button
                              size="xs"
                              variant={dateFilter === 'today' ? 'filled' : 'subtle'}
                              color="teal"
                              onClick={() => {
                                setDateFilter('today');
                                setCustomDate('');
                              }}
                              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                              ⭐ Hôm Nay ({todayCount})
                            </Button>

                            <Button
                              size="xs"
                              variant={dateFilter === 'yesterday' ? 'filled' : 'subtle'}
                              color="blue"
                              onClick={() => {
                                setDateFilter('yesterday');
                                setCustomDate('');
                              }}
                              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                              ⏳ Hôm Qua ({yesterdayCount})
                            </Button>

                            <Button
                              size="xs"
                              variant={dateFilter === '7days' ? 'filled' : 'subtle'}
                              color="cyan"
                              onClick={() => {
                                setDateFilter('7days');
                                setCustomDate('');
                              }}
                              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                              🗓️ 7 Ngày Qua ({sevenDaysCount})
                            </Button>

                            <Button
                              size="xs"
                              variant={dateFilter === 'month' ? 'filled' : 'subtle'}
                              color="indigo"
                              onClick={() => {
                                setDateFilter('month');
                                setCustomDate('');
                              }}
                              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                              📊 Tháng Này ({thisMonthCount})
                            </Button>

                            {/* Custom Date Input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <input
                                type="date"
                                value={customDate}
                                onChange={(e) => {
                                  setCustomDate(e.target.value);
                                  if (e.target.value) {
                                    setDateFilter('custom');
                                  } else {
                                    setDateFilter('all');
                                  }
                                }}
                                title="Chọn ngày cụ thể để xem đơn"
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: dateFilter === 'custom' ? '1.5px solid #226135' : '1px solid #b8d7be',
                                  backgroundColor: dateFilter === 'custom' ? '#eef7f1' : '#ffffff',
                                  color: '#174421',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  height: '30px',
                                  outline: 'none',
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <Divider color="#e5f0e8" />

                        {/* ROW 2: ORDER STATUS FILTER + MANUAL REFRESH */}
                        <div>
                          <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                            <div
                              style={{
                                display: 'flex',
                                gap: '6px',
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                padding: '2px 0',
                                flex: 1,
                              }}
                            >
                              <Button
                                size="xs"
                                variant={orderFilter === 'all' ? 'filled' : 'subtle'}
                                color="bamboo"
                                onClick={() => setOrderFilter('all')}
                                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                              >
                                Tất Cả ({dateFilteredOrders.length})
                              </Button>
                              <Button
                                size="xs"
                                variant={orderFilter === 'pending' ? 'filled' : 'subtle'}
                                color="yellow"
                                onClick={() => setOrderFilter('pending')}
                                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                              >
                                1. Đang Soạn ({pendingInPeriod.length})
                              </Button>
                              <Button
                                size="xs"
                                variant={orderFilter === 'served' ? 'filled' : 'subtle'}
                                color="blue"
                                onClick={() => setOrderFilter('served')}
                                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                              >
                                2. Đã Phục Vụ ({servedInPeriod.length})
                              </Button>
                              <Button
                                size="xs"
                                variant={orderFilter === 'completed' ? 'filled' : 'subtle'}
                                color="teal"
                                onClick={() => setOrderFilter('completed')}
                                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                              >
                                3. Đã Thu Tiền ({completedInPeriod.length})
                              </Button>
                            </div>

                            <Button
                              size="xs"
                              variant="light"
                              color="bamboo"
                              leftSection={<IconRefresh size={14} />}
                              loading={refreshingOrders}
                              onClick={handleManualRefreshOrders}
                              style={{ flexShrink: 0, whiteSpace: 'nowrap', fontWeight: 700 }}
                            >
                              Làm Mới
                            </Button>
                          </Group>
                        </div>
                      </Stack>
                    </Paper>

                    {/* Grouped Orders List By Date */}
                    {groupedOrders.length === 0 ? (
                      <Paper withBorder p="xl" radius="md" ta="center" style={{ backgroundColor: '#ffffff', borderColor: '#dceee1' }}>
                        <IconReceipt size={48} color="#badcc3" stroke={1.2} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                        <Text fw={700} size="sm" c="#174421" mb={4}>
                          Không tìm thấy đơn hàng nào!
                        </Text>
                        <Text size="xs" c="#607667" mb="md">
                          Không có đơn hàng nào theo bộ lọc "{dateFilterLabel}" ({orderFilter === 'all' ? 'Tất cả trạng thái' : orderFilter}).
                        </Text>
                        <Button
                          size="xs"
                          variant="light"
                          color="bamboo"
                          onClick={() => {
                            setDateFilter('all');
                            setOrderFilter('all');
                            setCustomDate('');
                          }}
                        >
                          Xem Tất Cả Lịch Sử Đơn
                        </Button>
                      </Paper>
                    ) : (
                      <Stack gap="lg">
                        {groupedOrders.map((group) => (
                          <div key={group.dateKey}>
                            {/* Day Header Section Banner */}
                            <Paper
                              withBorder
                              p={{ base: 'xs', sm: 'sm' }}
                              radius="md"
                              mb="sm"
                              style={{
                                backgroundColor: group.isToday ? '#edf7f0' : group.isYesterday ? '#eef4ff' : '#f8faf9',
                                borderColor: group.isToday ? '#76c48c' : group.isYesterday ? '#9ec1f9' : '#d2e8d8',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                              }}
                            >
                              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                                <Group gap="xs" align="center" wrap="nowrap">
                                  <ThemeIcon
                                    size="md"
                                    radius="md"
                                    color={group.isToday ? 'teal' : group.isYesterday ? 'blue' : 'gray'}
                                    variant="light"
                                  >
                                    <IconCalendarEvent size={18} />
                                  </ThemeIcon>
                                  <Group gap={6} align="center" wrap="nowrap">
                                    <Text
                                      fw={800}
                                      size="sm"
                                      c={group.isToday ? '#174421' : group.isYesterday ? '#103975' : '#2d3748'}
                                      style={{ fontFamily: 'var(--font-heading)' }}
                                    >
                                      {group.dayLabel}
                                    </Text>
                                    <Badge
                                      size="xs"
                                      variant="outline"
                                      color={group.isToday ? 'teal' : group.isYesterday ? 'blue' : 'gray'}
                                    >
                                      {group.formattedDate}
                                    </Badge>
                                  </Group>
                                </Group>

                                {/* Day metrics as clean badges - No noisy desc text under date */}
                                <Group gap={6} wrap="wrap">
                                  <Badge size="xs" variant="light" color="gray">
                                    {group.orders.length} đơn
                                  </Badge>
                                  <Badge size="xs" variant={group.dayTotalRevenue > 0 ? 'filled' : 'outline'} color={group.dayTotalRevenue > 0 ? 'teal' : 'gray'}>
                                    Doanh thu: {formatPrice(group.dayTotalRevenue)}
                                  </Badge>
                                  {group.dayPendingCount > 0 && (
                                    <Badge size="xs" color="yellow" variant="filled">
                                      {group.dayPendingCount} đang soạn
                                    </Badge>
                                  )}
                                  {group.dayServedCount > 0 && (
                                    <Badge size="xs" color="blue" variant="filled">
                                      {group.dayServedCount} đã phục vụ
                                    </Badge>
                                  )}
                                </Group>
                              </Group>
                            </Paper>

                            {/* List of Orders in this Day Group */}
                            <Stack gap="sm">
                              {group.orders.map((order) => (
                                <Card
                                  key={order.id}
                                  withBorder
                                  radius="md"
                                  p={{ base: 'xs', sm: 'md' }}
                                  style={{
                                    backgroundColor: '#ffffff',
                                    borderLeft: `5px solid ${
                                      order.status === 'pending'
                                        ? '#f59f00'
                                        : order.status === 'served'
                                        ? '#1c7ed6'
                                        : order.status === 'completed'
                                        ? '#226135'
                                        : '#e03131'
                                    }`,
                                  }}
                                >
                                  <Stack gap="xs">
                                    {/* Order Header */}
                                    <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                                      <Group gap="xs" wrap="wrap">
                                        <Text fw={800} size="md" c="#174421">
                                          #{order.orderCode}
                                        </Text>
                                        <Badge
                                          size="sm"
                                          color={
                                            order.status === 'pending'
                                              ? 'yellow'
                                              : order.status === 'served'
                                              ? 'blue'
                                              : order.status === 'completed'
                                              ? 'teal'
                                              : 'red'
                                          }
                                        >
                                          {order.status === 'pending'
                                            ? '1. Đang soạn món'
                                            : order.status === 'served'
                                            ? '2. Đã phục vụ - Chờ thanh toán'
                                            : order.status === 'completed'
                                            ? '3. Đã thu tiền / Hoàn tất'
                                            : 'Đã hủy'}
                                        </Badge>
                                        <Badge size="sm" variant="outline" color={order.paymentMethod === 'vietqr' ? 'bamboo' : 'gray'}>
                                          {order.paymentMethod === 'vietqr' ? '💳 VietQR' : '💵 Tiền mặt'}
                                        </Badge>
                                      </Group>

                                      <Text size="11px" c="#607667">
                                        {formatTime(order.createdAt)}
                                      </Text>
                                    </Group>

                                    {/* Pulsing Customer Paid Alert Badge */}
                                    {order.customerPaid && order.status === 'served' && (
                                      <Badge size="md" color="teal" variant="filled" fullWidth leftSection={<IconBell size={14} />}>
                                        🔔 KHÁCH BÁO ĐÃ CHUYỂN TIỀN / GỬI TIỀN!
                                      </Badge>
                                    )}

                                    {/* Items in order */}
                                    <Paper p="xs" radius="sm" style={{ backgroundColor: '#fafcfa' }}>
                                      <Stack gap={4}>
                                        {order.items.map((it, idx) => {
                                          const itemOptions = [it.ice, it.sugar, it.note].filter(Boolean).join(', ');
                                          return (
                                            <Group key={idx} justify="space-between" align="center" wrap="nowrap">
                                              <Text size="sm" c="#2c3e32" style={{ flex: 1 }}>
                                                <b>{it.quantity}x</b> {it.name}
                                                {itemOptions && (
                                                  <span style={{ color: '#536b5a', fontStyle: 'italic', marginLeft: 4, fontSize: '12px' }}>
                                                    ({itemOptions})
                                                  </span>
                                                )}
                                              </Text>
                                              <Text size="sm" fw={700} c="#226135">
                                                {formatPrice(it.totalPrice)}
                                              </Text>
                                            </Group>
                                          );
                                        })}
                                      </Stack>

                                      {order.note && (
                                        <Text size="xs" c="#e67700" mt={6} fs="italic">
                                          Ghi chú khách: "{order.note}"
                                        </Text>
                                      )}
                                    </Paper>

                                    {/* Total Amount & Action Buttons (Mobile-first Touch targets) */}
                                    <Group justify="space-between" align="center" mt={4}>
                                      <Text size="xs" c="#607667" fw={700}>
                                        TỔNG TIỀN:
                                      </Text>
                                      <Text fw={800} size="lg" c="#226135" style={{ fontFamily: 'var(--font-heading)' }}>
                                        {formatPrice(order.totalAmount)}
                                      </Text>
                                    </Group>

                                    {/* BƯỚC 1: QUÁN ĐANG SOẠN ➔ BẤM ĐÃ PHỤC VỤ (Touch-friendly 44px) */}
                                    {order.status === 'pending' && (
                                      <Button
                                        size="md"
                                        color="blue"
                                        fullWidth
                                        leftSection={<IconCup size={18} />}
                                        onClick={() => handleStatusChange(order.id, 'served')}
                                        style={{ fontWeight: 700, minHeight: '44px' }}
                                      >
                                        🍹 Đã Phục Vụ (Mở Cho Khách Quét QR)
                                      </Button>
                                    )}

                                    {/* BƯỚC 2: KHÁCH ĐÃ CÓ QR / TRẢ TIỀN ➔ BẤM XÁC NHẬN ĐÃ THU TIỀN */}
                                    {order.status === 'served' && (
                                      <Button
                                        size="md"
                                        color="teal"
                                        fullWidth
                                        leftSection={<IconCheck size={18} />}
                                        onClick={() => handleStatusChange(order.id, 'completed')}
                                        style={{ fontWeight: 800, minHeight: '44px' }}
                                      >
                                        ✅ Xác Nhận Đã Thu Tiền (Hoàn Thành)
                                      </Button>
                                    )}

                                    {/* Sub-actions Row (View invoice, Cancel, Delete) */}
                                    <Group justify="space-between" align="center" mt={2}>
                                      <Button
                                        size="xs"
                                        variant="light"
                                        color="gray"
                                        leftSection={<IconEye size={14} />}
                                        onClick={() => setSelectedInvoice(order)}
                                      >
                                        Xem Hóa Đơn
                                      </Button>

                                      <Group gap={6}>
                                        {order.status !== 'cancelled' && order.status !== 'completed' && (
                                          <Button
                                            size="xs"
                                            variant="subtle"
                                            color="red"
                                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                                          >
                                            Hủy Đơn
                                          </Button>
                                        )}

                                        <ActionIcon
                                          size="md"
                                          variant="subtle"
                                          color="red"
                                          onClick={() => handleDeleteOrder(order.id)}
                                          title="Xóa đơn"
                                        >
                                          <IconTrash size={16} />
                                        </ActionIcon>
                                      </Group>
                                    </Group>
                                  </Stack>
                                </Card>
                              ))}
                            </Stack>
                          </div>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                )}

                {/* TAB 2: PRODUCTS & OPTIONS MANAGEMENT */}
                {activeTab === 'products' && (
                  <Stack gap="md">
                    {/* Controls Bar - Responsive Mobile Layout */}
                    <Paper withBorder p={{ base: 'xs', sm: 'md' }} radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#dceee1' }}>
                      <Stack gap="sm">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', width: '100%' }}>
                          <TextInput
                            placeholder="Tìm kiếm món theo tên..."
                            leftSection={<IconSearch size={16} />}
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.currentTarget.value)}
                            size="sm"
                            style={{ width: '100%' }}
                          />

                          {/* Category Filter Select */}
                          <select
                            value={productCategoryFilter}
                            onChange={(e) => setProductCategoryFilter(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1.5px solid #b8d7be',
                              backgroundColor: '#ffffff',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#174421',
                              cursor: 'pointer',
                              outline: 'none',
                              minHeight: '36px',
                            }}
                          >
                            <option value="all">Tất Cả Danh Mục ({products.length})</option>
                            {CATEGORIES.filter((c) => c.id !== 'all' && c.id !== 'best-seller').map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                          <Button
                            size="sm"
                            color="bamboo"
                            variant="filled"
                            leftSection={<IconPlus size={16} />}
                            onClick={handleOpenCreateProduct}
                            style={{ fontWeight: 700 }}
                          >
                            + Thêm Món
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            color="gray"
                            leftSection={<IconRefresh size={15} />}
                            onClick={handleResetProducts}
                          >
                            Khôi Phục Gốc
                          </Button>
                        </div>
                      </Stack>
                    </Paper>

                    {/* Products Table - Responsive Horizontal Scrollable Container */}
                    <Paper withBorder radius="md" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', backgroundColor: '#ffffff', borderColor: '#dceee1' }}>
                      <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: '620px' }}>
                        <Table.Thead style={{ backgroundColor: '#f0f7f2' }}>
                          <Table.Tr>
                            <Table.Th style={{ width: 64 }}>Ảnh</Table.Th>
                            <Table.Th>Tên Món Nước</Table.Th>
                            <Table.Th>Danh Mục</Table.Th>
                            <Table.Th>Giá Bán</Table.Th>
                            <Table.Th>Tùy Chọn Món</Table.Th>
                            <Table.Th>Huy Hiệu</Table.Th>
                            <Table.Th style={{ width: 110, textAlign: 'center' }}>Thao Tác</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filteredProducts.map((p) => (
                            <Table.Tr key={p.id}>
                              <Table.Td>
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  style={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    display: 'block',
                                    border: '1.5px solid #dceee1',
                                  }}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/images/drinks/cf-muoi.jpg';
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <Text fw={700} size="sm" c="#174421">
                                  {p.name}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge size="sm" variant="light" color="bamboo">
                                  {CATEGORIES.find((c) => c.id === p.category)?.label || p.category}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text fw={800} size="sm" c="#226135">
                                  {formatPrice(p.price)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                {p.allowCustomization !== false ? (
                                  <Badge size="xs" variant="outline" color="teal">
                                    Đá + Đường
                                  </Badge>
                                ) : (
                                  <Badge size="xs" variant="outline" color="gray">
                                    Món Cố Định
                                  </Badge>
                                )}
                              </Table.Td>
                              <Table.Td>
                                {p.badge ? (
                                  <Badge size="sm" color="orange" variant="filled">
                                    {p.badge}
                                  </Badge>
                                ) : (
                                  <Text size="xs" c="#adb5bd">
                                    -
                                  </Text>
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Group gap={6} justify="center">
                                  <Button
                                    size="compact-xs"
                                    variant="light"
                                    color="bamboo"
                                    leftSection={<IconEdit size={13} />}
                                    onClick={() => handleOpenEditProduct(p)}
                                  >
                                    Sửa
                                  </Button>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleDeleteProduct(p)}
                                    title="Xóa món"
                                  >
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  </Stack>
                )}
              </Stack>
            )}
          </Container>
        </main>

        {/* MODAL / FORM: THÊM / CHỈNH SỬA MÓN NƯỚC (FULL OPTIONS, ZERO Z-INDEX ISSUES) */}
        <Modal
          opened={formOpen}
          onClose={() => setFormOpen(false)}
          title={
            <Text fw={800} size="md" c="#174421" style={{ fontFamily: 'var(--font-heading)' }}>
              {editingProduct ? `Chỉnh Sửa Món: ${editingProduct.name}` : 'Thêm Món Nước Mới'}
            </Text>
          }
          size="lg"
          radius="md"
          zIndex={1200}
        >
          <Stack gap="md">
            {/* 1. Tên món */}
            <TextInput
              label="Tên món nước: *"
              placeholder="Ví dụ: Cà Phê Muối Sữa..."
              value={formName}
              onChange={(e) => setFormName(e.currentTarget.value)}
              required
            />

            {/* 2. Danh mục - Clean native select: 100% working on all platforms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#174421' }}>
                Danh mục món nước: *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as MenuCategory)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #b8d7be',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: '#14281b',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {CATEGORIES.filter((c) => c.id !== 'all' && c.id !== 'best-seller').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Giá bán */}
            <NumberInput
              label="Giá bán (VNĐ): *"
              placeholder="25000"
              value={formPrice}
              onChange={(val) => setFormPrice(Number(val) || 0)}
              step={1000}
              min={0}
              required
            />

            {/* 4. URL Ảnh sản phẩm + LIVE PREVIEW */}
            <div>
              <TextInput
                label="URL Ảnh sản phẩm:"
                placeholder="Dán link ảnh (https://... hoặc /images/drinks/...)"
                value={formImage}
                onChange={(e) => setFormImage(e.currentTarget.value)}
              />

              {/* Live Preview Container */}
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <Text size="xs" c="#607667" mb={4}>
                  Xem trước ảnh sản phẩm thực tế:
                </Text>
                <div
                  style={{
                    display: 'inline-block',
                    width: '130px',
                    height: '130px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '2px solid #226135',
                    backgroundColor: '#f0f5f1',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  }}
                >
                  <img
                    src={formImage || '/images/drinks/cf-muoi.jpg'}
                    alt="Xem trước ảnh"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/drinks/cf-muoi.jpg';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 5. Huy hiệu / Nhãn nổi bật (Badge) - Clean select: 100% working on all platforms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#174421' }}>
                Huy hiệu / Nhãn nổi bật:
              </label>
              <select
                value={formBadge}
                onChange={(e) => setFormBadge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #b8d7be',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: '#14281b',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="none">Không có nhãn</option>
                <option value="Best Seller">🔥 Best Seller (Bán chạy nhất)</option>
                <option value="Mới">✨ Món Mới</option>
                <option value="Thanh Mát">🍃 Thanh Mát (Giải nhiệt)</option>
                <option value="Đậm Đà">☕ Đậm Đà</option>
                <option value="Ưu Đãi">🏷️ Ưu Đãi (Giá tốt)</option>
              </select>
            </div>

            {/* 6. TÙY CHỌN MÓN NƯỚC (PRODUCT CUSTOMIZATION OPTIONS) */}
            <Paper withBorder p="sm" radius="md" style={{ backgroundColor: '#f9fbf9', borderColor: '#dceee1' }}>
              <Text fw={700} size="sm" c="#174421" mb="xs">
                Tùy chọn phục vụ cho khách:
              </Text>
              <Stack gap="xs">
                <Switch
                  label="Cho phép khách chọn % Đá (100% đá, 50% đá, không đá...)"
                  checked={formAllowIce}
                  onChange={(e) => setFormAllowIce(e.currentTarget.checked)}
                  color="bamboo"
                />

                <Switch
                  label="Cho phép khách chọn % Đường (100% đường, 50% đường, không đường...)"
                  checked={formAllowSugar}
                  onChange={(e) => setFormAllowSugar(e.currentTarget.checked)}
                  color="bamboo"
                />
              </Stack>
            </Paper>

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setFormOpen(false)}>
                Hủy
              </Button>
              <Button color="bamboo" onClick={handleSaveProduct} loading={savingProduct} style={{ fontWeight: 700 }}>
                Lưu Món Nước
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* MODAL: SIMPLE INVOICE / PHIẾU TÍNH TIỀN */}
        <Modal
          opened={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={
            <Text fw={700} size="md" c="#174421">
              Hóa Đơn Bán Nước #{selectedInvoice?.orderCode}
            </Text>
          }
          zIndex={1600}
        >
          {selectedInvoice && (
            <Stack gap="xs">
              <Paper p="sm" withBorder radius="md" style={{ backgroundColor: '#fafdfb' }}>
                <Text size="xs" c="#607667">
                  Quán: <b>Xuân Phạm Coffee House</b>
                </Text>
                <Text size="xs" c="#607667">
                  Địa chỉ: 905 Hùng Vương, Phú Mỹ, Thủ Dầu Một
                </Text>
                <Text size="xs" c="#607667">
                  Thời gian: <b>{formatTime(selectedInvoice.createdAt)}</b>
                </Text>
                <Text size="xs" c="#607667">
                  Thanh toán: <b>{selectedInvoice.paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Tiền mặt'}</b>
                </Text>
              </Paper>

              <Divider my="xs" />

              <Text fw={700} size="sm">
                Chi tiết đồ uống:
              </Text>
              <Stack gap={4}>
                {selectedInvoice.items.map((it, i) => (
                  <Group key={i} justify="space-between" align="center">
                    <div>
                      <Text size="sm" fw={600}>
                        {it.quantity}x {it.name}
                      </Text>
                      {(it.ice || it.sugar || it.note) && (
                        <Text size="xs" c="#607667">
                          {it.ice} - {it.sugar} {it.note ? `(${it.note})` : ''}
                        </Text>
                      )}
                    </div>
                    <Text size="sm" fw={700} c="#226135">
                      {formatPrice(it.totalPrice)}
                    </Text>
                  </Group>
                ))}
              </Stack>

              <Divider my="xs" />

              <Group justify="space-between" align="center">
                <Text fw={700} size="md">
                  TỔNG TIỀN:
                </Text>
                <Text fw={800} size="xl" c="#226135" style={{ fontFamily: 'var(--font-heading)' }}>
                  {formatPrice(selectedInvoice.totalAmount)}
                </Text>
              </Group>

              {selectedInvoice.note && (
                <Text size="xs" c="#e67700" fs="italic" mt={4}>
                  Ghi chú: {selectedInvoice.note}
                </Text>
              )}

              <Button color="bamboo" variant="light" fullWidth mt="sm" onClick={() => setSelectedInvoice(null)}>
                Đóng Hóa Đơn
              </Button>
            </Stack>
          )}
        </Modal>

        {/* MODAL: STANDEE QR CODE QUÁN (CHO KHÁCH QUÉT VÀO WEB GỌI MÓN) */}
        <WebsiteQrModal
          opened={standeeModalOpen}
          onClose={() => setStandeeModalOpen(false)}
        />
      </div>
    </MantineProvider>
  );
};
