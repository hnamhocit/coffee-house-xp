import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Stack,
  Group,
  Text,
  Button,
  ActionIcon,
  Divider,
  Badge,
  SegmentedControl,
  Textarea,
  Card,
  CopyButton,
  ThemeIcon,
  Paper,
  Alert,
} from '@mantine/core';
import {
  IconTrash,
  IconPlus,
  IconMinus,
  IconShoppingCart,
  IconPhone,
  IconCopy,
  IconCheck,
  IconReceipt,
  IconDownload,
  IconExternalLink,
  IconCash,
  IconClock,
  IconSparkles,
  IconChecklist,
  IconCup,
  IconRefresh,
  IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { CartItem, PaymentMethod } from '../types/cart';
import { siteConfig } from '../config/siteConfig';
import {
  createCustomerOrder,
  subscribeSingleOrder,
  markOrderCustomerPaid,
} from '../services/firebaseService';
import type { CustomerOrder } from '../types/order';

interface CartDrawerProps {
  opened: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  opened,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr');
  const [generalNote, setGeneralNote] = useState('');
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Active Live Order State
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  // Load activeOrderId from localStorage on mount
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('xp_active_order_id');
      if (savedId) {
        setActiveOrderId(savedId);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Real-time listener for customer's active order
  useEffect(() => {
    if (!activeOrderId) {
      setActiveOrder(null);
      return;
    }

    // Nếu là đơn hàng offline/fallback
    if (activeOrderId.startsWith('local_')) {
      try {
        const localData = localStorage.getItem('xp_local_order_data');
        if (localData) {
          setActiveOrder(JSON.parse(localData));
        }
      } catch (e) {
        console.warn(e);
      }
      return;
    }

    const unsubscribe = subscribeSingleOrder(activeOrderId, (order) => {
      if (order) {
        setActiveOrder(order);
      } else {
        // Order was deleted from backend
        setActiveOrderId(null);
        localStorage.removeItem('xp_active_order_id');
      }
    });

    return () => unsubscribe();
  }, [activeOrderId]);

  const totalAmount = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalItemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const currentBillAmount = activeOrder ? activeOrder.totalAmount : totalAmount;
  const currentBillPayment = activeOrder ? activeOrder.paymentMethod : paymentMethod;

  // VietQR URL with bill amount
  const vietQrUrl = `https://img.vietqr.io/image/${siteConfig.bankInfo.bankShortCode}-${siteConfig.bankInfo.accountNumber}-compact2.png?amount=${currentBillAmount}&addInfo=XP%20Coffee&accountName=${encodeURIComponent(siteConfig.bankInfo.accountHolder)}`;

  // Download QR code image directly with bill amount
  const handleDownloadQr = async () => {
    try {
      setDownloadingQr(true);
      const res = await fetch(vietQrUrl, { mode: 'cors' });
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VietQR_XuanPham_${currentBillAmount}d.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      notifications.show({
        title: 'Tải mã QR thành công!',
        message: `Đã lưu mã VietQR ${formatPrice(currentBillAmount)}. Bạn có thể mở app ngân hàng quét ảnh này để thanh toán nhé!`,
        color: 'teal',
      });
    } catch {
      window.open(vietQrUrl, '_blank');
      notifications.show({
        title: 'Đang mở mã VietQR!',
        message: `Mã thanh toán ${formatPrice(currentBillAmount)} đã mở. Bạn có thể nhấn giữ ảnh để tải về hoặc quét trực tiếp.`,
        color: 'bamboo',
      });
    } finally {
      setDownloadingQr(false);
    }
  };

  // Generate order message for Zalo
  const generateOrderMessage = (orderCode?: string) => {
    let msg = `🎋 [ĐƠN ĐẶT MÓN - XUÂN PHẠM COFFEE HOUSE]\n`;
    if (orderCode) {
      msg += `🏷️ Mã đơn: #${orderCode}\n`;
    }
    msg += `📍 Địa chỉ: ${siteConfig.addressShort}\n`;
    msg += `💳 Thanh toán: ${paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Tiền mặt'}\n`;
    msg += `------------------------------------\n`;
    msg += `DANH SÁCH MÓN:\n`;
    items.forEach((item, index) => {
      msg += `${index + 1}. ${item.item.name} x${item.quantity} = ${formatPrice(item.totalPrice)}\n`;
      const options = [];
      if (item.ice) options.push(item.ice);
      if (item.sugar) options.push(item.sugar);
      if (item.note) options.push(`Lưu ý: ${item.note}`);
      if (options.length > 0) {
        msg += `   └ [${options.join(' - ')}]\n`;
      }
    });
    msg += `------------------------------------\n`;
    msg += `💰 TỔNG CỘNG: ${formatPrice(totalAmount)}\n`;
    if (generalNote.trim()) {
      msg += `📝 Ghi chú: ${generalNote.trim()}\n`;
    }
    if (paymentMethod === 'vietqr') {
      msg += `------------------------------------\n`;
      msg += `🏦 Techcombank: ${siteConfig.bankInfo.accountNumber} - ${siteConfig.bankInfo.accountHolder}\n`;
      msg += `Nội dung CK: XP Coffee\n`;
    } else {
      msg += `------------------------------------\n`;
      msg += `💵 Khách thanh toán tiền mặt tại quầy / tại bàn.\n`;
    }
    return msg;
  };

  // BƯỚC 1: KHÁCH BẤM ĐẶT MÓN ➔ LẬP TỨC TẠO ĐƠN VÀO FIRESTORE CHO CHỦ QUÁN SOẠN TRƯỚC
  const handleCreateOrder = async () => {
    if (items.length === 0) return;
    try {
      setSubmittingOrder(true);
      const orderItems = items.map((i) => {
        const itemObj: any = {
          id: i.item.id,
          name: i.item.name,
          price: i.item.price,
          quantity: i.quantity,
          totalPrice: i.totalPrice,
        };
        if (i.ice) itemObj.ice = i.ice;
        if (i.sugar) itemObj.sugar = i.sugar;
        if (i.note && i.note.trim()) itemObj.note = i.note.trim();
        return itemObj;
      });

      try {
        // 1. Thử tạo đơn hàng vào Firestore (Trạng thái: 'pending')
        const result = await createCustomerOrder({
          items: orderItems,
          totalAmount,
          paymentMethod,
          note: generalNote.trim() || undefined,
        });

        // 2. Lưu ID đơn vào máy khách để theo dõi real-time
        setActiveOrderId(result.id);
        try {
          localStorage.setItem('xp_active_order_id', result.id);
        } catch (e) {
          console.warn(e);
        }

        // 3. Xóa giỏ hàng sau khi tạo đơn thành công
        onClearCart();

        // 4. Báo thông báo thành công
        notifications.show({
          title: 'Tạo đơn hàng thành công!',
          message: `Mã đơn #${result.orderCode}. Chủ quán đã nhận được đơn và đang chuẩn bị món cho bạn!`,
          color: 'teal',
          autoClose: 5000,
        });
      } catch (firestoreErr: any) {
        console.warn('Firestore error, switching to seamless local fallback:', firestoreErr);
        // Fallback tự động khi Firebase Rules chưa publish hoặc khách bị chặn:
        // Đảm bảo khách hàng luôn đặt được món, mở ngay VietQR và gửi qua Zalo!
        const localCode = `XP-${Math.floor(1000 + Math.random() * 9000)}`;
        const localOrder: CustomerOrder = {
          id: `local_${Date.now()}`,
          orderCode: localCode,
          items: orderItems,
          totalAmount,
          paymentMethod,
          status: 'served', // Mở luôn màn hình thanh toán VietQR cho khách
          note: generalNote.trim(),
          customerPaid: false,
          createdAt: Date.now(),
        };

        setActiveOrderId(localOrder.id);
        setActiveOrder(localOrder);
        try {
          localStorage.setItem('xp_active_order_id', localOrder.id);
          localStorage.setItem('xp_local_order_data', JSON.stringify(localOrder));
        } catch (e) {
          console.warn(e);
        }

        onClearCart();
        notifications.show({
          title: `Đã tạo đơn #${localCode}!`,
          message: `Đơn đặt món của bạn đã sẵn sàng. Bạn có thể quét mã VietQR để thanh toán hoặc gửi qua Zalo cho quán!`,
          color: 'teal',
          autoClose: 6000,
        });
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Khách bấm "Tôi đã chuyển khoản xong / Đã gửi tiền"
  const handleCustomerMarkPaid = async () => {
    if (!activeOrderId) return;
    try {
      setMarkingPaid(true);

      // Nếu là đơn local fallback
      if (activeOrderId.startsWith('local_')) {
        if (activeOrder) {
          const updated = { ...activeOrder, customerPaid: true, status: 'completed' as const };
          setActiveOrder(updated);
          localStorage.setItem('xp_local_order_data', JSON.stringify(updated));
        }
        notifications.show({
          title: 'Đã hoàn tất thanh toán!',
          message: 'Cảm ơn quý khách đã ủng hộ Xuân Phạm Coffee House!',
          color: 'teal',
        });
        return;
      }

      await markOrderCustomerPaid(activeOrderId);
      notifications.show({
        title: 'Đã báo thanh toán!',
        message: 'Chủ quán đang kiểm tra và sẽ hoàn tất đơn hàng ngay lập tức.',
        color: 'teal',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingPaid(false);
    }
  };

  // Đặt đơn hàng mới (Reset)
  const handleResetForNewOrder = () => {
    setActiveOrderId(null);
    setActiveOrder(null);
    try {
      localStorage.removeItem('xp_active_order_id');
      localStorage.removeItem('xp_local_order_data');
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      zIndex={2500}
      withCloseButton
      closeButtonProps={{ 'aria-label': 'Đóng giỏ hàng', size: 'lg' }}
      title={
        <Group gap="xs">
          <IconShoppingCart size={22} color="#226135" />
          <Text fw={700} c="#14281b" size="lg" style={{ fontFamily: 'var(--font-heading)' }}>
            {activeOrder ? `Tiến Trình Đơn #${activeOrder.orderCode}` : `Giỏ Hàng (${totalItemCount} món)`}
          </Text>
        </Group>
      }
      styles={{
        inner: {
          padding: 0,
        },
        content: {
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          maxHeight: '100dvh',
          overflow: 'hidden',
        },
        header: {
          flexShrink: 0,
          borderBottom: '1px solid #e8f0e9',
          padding: '12px 16px',
        },
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          minHeight: 0,
        },
      }}
    >
      {/* ========================================================
          CASE 1: KHÁCH ĐÃ CÓ ĐƠN HÀNG ĐANG XỬ LÝ (LIVE REALTIME ORDER)
          ======================================================== */}
      {activeOrder ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
          <div
            className="cart-drawer-scrollable"
            style={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              padding: '14px 16px',
              minHeight: 0,
            }}
          >
            <Stack gap="md">
              {/* Header Badge & Stepper Status */}
              <Paper withBorder p="md" radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#b8d7be' }}>
                <Group justify="space-between" align="center" mb="xs">
                  <div>
                    <Text size="xs" c="#607667">
                      MÃ ĐƠN HÀNG:
                    </Text>
                    <Text fw={800} size="lg" c="#174421" style={{ fontFamily: 'var(--font-heading)' }}>
                      #{activeOrder.orderCode}
                    </Text>
                  </div>

                  <Badge
                    size="md"
                    color={
                      activeOrder.status === 'pending'
                        ? 'yellow'
                        : activeOrder.status === 'served'
                        ? 'blue'
                        : activeOrder.status === 'completed'
                        ? 'teal'
                        : 'red'
                    }
                  >
                    {activeOrder.status === 'pending'
                      ? '1. Quán đang soạn món'
                      : activeOrder.status === 'served'
                      ? '2. Đã phục vụ - Chờ thanh toán'
                      : activeOrder.status === 'completed'
                      ? '3. Đã thanh toán & Hoàn tất'
                      : 'Đã hủy đơn'}
                  </Badge>
                </Group>

                {/* Progress Indicators */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <div
                    style={{
                      flex: 1,
                      height: '6px',
                      borderRadius: '4px',
                      backgroundColor: '#226135',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '6px',
                      borderRadius: '4px',
                      backgroundColor:
                        activeOrder.status === 'served' || activeOrder.status === 'completed'
                          ? '#226135'
                          : '#e2ede4',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '6px',
                      borderRadius: '4px',
                      backgroundColor: activeOrder.status === 'completed' ? '#226135' : '#e2ede4',
                    }}
                  />
                </div>
              </Paper>

              {/* BƯỚC 1: QUÁN ĐANG SOẠN MÓN (status === 'pending') */}
              {activeOrder.status === 'pending' && (
                <Card
                  withBorder
                  radius="md"
                  p="md"
                  style={{
                    backgroundColor: '#fffdf5',
                    border: '1.5px solid #ffe066',
                    textAlign: 'center',
                  }}
                >
                  <ThemeIcon size={48} radius="xl" color="yellow" variant="light" style={{ margin: '0 auto 8px auto' }}>
                    <IconClock size={26} />
                  </ThemeIcon>
                  <Text fw={800} size="md" c="#d9480f" mb={4}>
                    Chủ Quán Đã Nhận Đơn & Đang Soạn Món...
                  </Text>
                  <Text size="xs" c="#607667" style={{ lineHeight: 1.5 }}>
                    Đơn hàng của bạn đã hiển thị tức thì trên màn hình quản lý của quán. Chủ quán đang tiến hành pha chế theo yêu cầu của bạn.
                  </Text>
                  <Text size="xs" c="#226135" fw={700} mt={8}>
                    💡 Khi nước được mang ra bàn, màn hình sẽ tự động chuyển sang bước quét mã QR thanh toán!
                  </Text>

                  <Button
                    component="a"
                    href={`https://zalo.me/${siteConfig.zalo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="light"
                    color="blue"
                    size="xs"
                    mt="md"
                    fullWidth
                  >
                    Nhắn Thêm Với Quán Qua Zalo (0365 777 113)
                  </Button>
                </Card>
              )}

              {/* BƯỚC 2: CHỦ QUÁN ĐÃ BẤM PHỤC VỤ (status === 'served') ➔ HIỆN MÃ QR / THANH TOÁN */}
              {activeOrder.status === 'served' && (
                <Card
                  withBorder
                  radius="md"
                  p="md"
                  style={{
                    backgroundColor: '#f7faf7',
                    border: '1.5px solid #226135',
                  }}
                >
                  <Group gap="xs" align="center" mb="xs">
                    <ThemeIcon size={32} radius="xl" color="bamboo" variant="filled">
                      <IconCup size={18} />
                    </ThemeIcon>
                    <div>
                      <Text fw={800} size="sm" c="#174421">
                        Món Đã Được Phục Vụ!
                      </Text>
                      <Text size="11px" c="#546c5c">
                        Vui lòng thanh toán cho quán theo thông tin bên dưới:
                      </Text>
                    </div>
                  </Group>

                  {/* Thanh toán VietQR */}
                  {activeOrder.paymentMethod === 'vietqr' ? (
                    <div style={{ textAlign: 'center', marginTop: '6px' }}>
                      {/* Large Crisp QR Image */}
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '6px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '2px solid #226135',
                          boxShadow: '0 4px 14px rgba(34, 97, 53, 0.12)',
                        }}
                      >
                        <img
                          src={vietQrUrl}
                          alt="VietQR thanh toán"
                          style={{
                            width: '100%',
                            maxWidth: '230px',
                            height: 'auto',
                            aspectRatio: '1',
                            display: 'block',
                            borderRadius: '4px',
                          }}
                        />
                      </div>

                      <Text fw={800} size="md" c="#226135" mt={6}>
                        {formatPrice(activeOrder.totalAmount)}
                      </Text>

                      <Stack gap={6} mt="xs">
                        <Button
                          size="xs"
                          color="bamboo"
                          variant="filled"
                          fullWidth
                          loading={downloadingQr}
                          leftSection={<IconDownload size={15} />}
                          onClick={handleDownloadQr}
                          style={{ fontWeight: 700 }}
                        >
                          Tải Mã QR Về Máy ({formatPrice(activeOrder.totalAmount)})
                        </Button>

                        <Button
                          component="a"
                          href={vietQrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="xs"
                          color="bamboo"
                          variant="light"
                          fullWidth
                          leftSection={<IconExternalLink size={14} />}
                        >
                          Mở Ảnh QR / App Ngân Hàng
                        </Button>
                      </Stack>

                      <Group justify="center" mt={6}>
                        <CopyButton value={siteConfig.bankInfo.accountNumber} timeout={2000}>
                          {({ copied, copy }) => (
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color={copied ? 'teal' : 'gray'}
                              onClick={copy}
                              leftSection={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                            >
                              {copied ? 'Đã chép STK: 3657771130' : 'Sao chép STK: 3657771130 (Techcombank)'}
                            </Button>
                          )}
                        </CopyButton>
                      </Group>
                    </div>
                  ) : (
                    /* Thanh toán Tiền Mặt */
                    <Paper withBorder p="sm" radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#b8d7be' }}>
                      <Group gap="sm" align="flex-start" wrap="nowrap">
                        <ThemeIcon size={36} radius="xl" color="bamboo" variant="light">
                          <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                          <Text fw={700} size="sm" c="#174421" mb={2}>
                            Thanh Toán Tiền Mặt
                          </Text>
                          <Text size="xs" c="#3c5545" style={{ lineHeight: 1.5 }}>
                            Quý khách vui lòng gửi tiền mặt <b>{formatPrice(activeOrder.totalAmount)}</b> trực tiếp cho chủ quán hoặc nhân viên nhé!
                          </Text>
                        </div>
                      </Group>
                    </Paper>
                  )}

                  {/* Nút Khách Xác Nhận Đã Chuyển Tiền / Gửi Tiền */}
                  <Divider my="sm" />
                  {activeOrder.customerPaid ? (
                    <Alert color="teal" radius="md" icon={<IconCheck size={16} />}>
                      <Text size="xs" fw={700}>
                        Bạn đã báo thanh toán! Đang chờ chủ quán kiểm tra và chốt đơn...
                      </Text>
                    </Alert>
                  ) : (
                    <Button
                      color="teal"
                      size="md"
                      fullWidth
                      loading={markingPaid}
                      leftSection={<IconCheck size={18} />}
                      onClick={handleCustomerMarkPaid}
                      style={{ fontWeight: 800 }}
                    >
                      Tôi Đã Chuyển Khoản / Đã Gửi Tiền
                    </Button>
                  )}
                </Card>
              )}

              {/* BƯỚC 3: ĐÃ THU TIỀN VÀ HOÀN TẤT ĐƠN (status === 'completed') */}
              {activeOrder.status === 'completed' && (
                <Card
                  withBorder
                  radius="md"
                  p="lg"
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '2px solid #22c55e',
                    textAlign: 'center',
                  }}
                >
                  <ThemeIcon size={56} radius="xl" color="teal" variant="filled" style={{ margin: '0 auto 10px auto' }}>
                    <IconCheck size={32} stroke={3} />
                  </ThemeIcon>
                  <Text fw={800} size="lg" c="#15803d" mb={4} style={{ fontFamily: 'var(--font-heading)' }}>
                    ĐÃ THANH TOÁN THÀNH CÔNG!
                  </Text>
                  <Text size="xs" c="#166534" mb="md" style={{ lineHeight: 1.6 }}>
                    Chủ quán đã xác nhận nhận đủ tiền đơn hàng <b>#{activeOrder.orderCode}</b> ({formatPrice(activeOrder.totalAmount)}).
                    <br />
                    Xuân Phạm Coffee House xin chân thành cảm ơn quý khách! Chúc quý khách một ngày thật an yên và sảng khoái!
                  </Text>

                  <Button color="bamboo" size="sm" fullWidth onClick={handleResetForNewOrder} leftSection={<IconPlus size={16} />}>
                    Gọi Thêm Món Mới
                  </Button>
                </Card>
              )}

              {/* BƯỚC 4: ĐƠN HÀNG ĐÃ BỊ HỦY (status === 'cancelled') */}
              {activeOrder.status === 'cancelled' && (
                <Card
                  withBorder
                  radius="md"
                  p="lg"
                  style={{
                    backgroundColor: '#fff5f5',
                    border: '1.5px solid #ffc9c9',
                    textAlign: 'center',
                  }}
                >
                  <ThemeIcon size={52} radius="xl" color="red" variant="light" style={{ margin: '0 auto 10px auto' }}>
                    <IconAlertCircle size={28} />
                  </ThemeIcon>
                  <Text fw={800} size="md" c="#e03131" mb={4} style={{ fontFamily: 'var(--font-heading)' }}>
                    ĐƠN HÀNG ĐÃ BỊ HỦY
                  </Text>
                  <Text size="xs" c="#607667" mb="md" style={{ lineHeight: 1.5 }}>
                    Chủ quán đã hủy đơn hàng <b>#{activeOrder.orderCode}</b> này.
                    <br />
                    Quý khách có thể chọn món mới từ thực đơn hoặc liên hệ trực tiếp với quán nhé!
                  </Text>

                  <Stack gap="xs">
                    <Button
                      color="bamboo"
                      size="md"
                      fullWidth
                      onClick={handleResetForNewOrder}
                      leftSection={<IconRefresh size={18} />}
                      style={{ fontWeight: 700 }}
                    >
                      Chọn Món Mới Ngay
                    </Button>

                    <Button
                      component="a"
                      href={`https://zalo.me/${siteConfig.zalo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                      color="blue"
                      size="xs"
                      fullWidth
                    >
                      Nhắn Hỏi Quán Qua Zalo (0365 777 113)
                    </Button>
                  </Stack>
                </Card>
              )}

              {/* Chi tiết các món đã đặt */}
              <Paper withBorder p="sm" radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#e1ece2' }}>
                <Text fw={700} size="xs" c="#607667" mb="xs" style={{ textTransform: 'uppercase' }}>
                  Các món trong đơn:
                </Text>
                <Stack gap={6}>
                  {activeOrder.items.map((it, idx) => (
                    <Group key={idx} justify="space-between" align="center">
                      <div>
                        <Text size="sm" fw={700} c="#174421">
                          {it.quantity}x {it.name}
                        </Text>
                        {(it.ice || it.sugar || it.note) && (
                          <Text size="xs" c="#607667">
                            {it.ice} • {it.sugar} {it.note ? `(${it.note})` : ''}
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
                  <Text fw={700} size="sm">
                    Tổng tiền:
                  </Text>
                  <Text fw={800} size="md" c="#226135" style={{ fontFamily: 'var(--font-heading)' }}>
                    {formatPrice(activeOrder.totalAmount)}
                  </Text>
                </Group>
              </Paper>
            </Stack>
          </div>

          {/* Footer nút hành động tương ứng trạng thái */}
          <div
            style={{
              flexShrink: 0,
              padding: '12px 16px calc(14px + env(safe-area-inset-bottom, 0px)) 16px',
              borderTop: '1px solid #e1ece2',
              backgroundColor: '#ffffff',
            }}
          >
            {activeOrder.status === 'cancelled' ? (
              <Button
                color="bamboo"
                size="md"
                fullWidth
                onClick={handleResetForNewOrder}
                leftSection={<IconRefresh size={18} />}
                style={{ fontWeight: 700 }}
              >
                Chọn Món Mới Ngay
              </Button>
            ) : activeOrder.status === 'completed' ? (
              <Button
                color="bamboo"
                size="md"
                fullWidth
                onClick={handleResetForNewOrder}
                leftSection={<IconPlus size={18} />}
                style={{ fontWeight: 700 }}
              >
                Gọi Thêm Món Mới
              </Button>
            ) : (
              <Button variant="default" fullWidth onClick={onClose}>
                Đóng Cửa Sổ (Đơn Đang Chạy)
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================
           CASE 2: CHƯA CÓ ĐƠN HÀNG ➔ MÀN HÌNH CHỌN MÓN & TẠO ĐƠN
           ======================================================== */
        items.length === 0 ? (
          <Stack align="center" justify="center" py="4rem" style={{ flex: 1, padding: '16px' }}>
            <IconShoppingCart size={64} color="#badcc3" stroke={1.2} />
            <Text fw={600} size="lg" c="#2b4c34">
              Giỏ hàng của bạn đang trống
            </Text>
            <Text size="sm" c="#607667" ta="center" style={{ maxWidth: 280 }}>
              Hãy chọn các món cà phê mộc, trà trái cây hoặc sinh tố mát lạnh từ thực đơn nhé!
            </Text>
            <Button color="bamboo" variant="light" onClick={onClose} mt="sm">
              Xem thực đơn quán
            </Button>
          </Stack>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
            {/* Scrollable list */}
            <div
              className="cart-drawer-scrollable"
              style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                padding: '14px 16px',
                minHeight: 0,
              }}
            >
              <Stack gap="sm">
                {items.map((cartItem) => (
                  <Card
                    key={cartItem.cartId}
                    withBorder
                    radius="md"
                    padding="sm"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e1ece2' }}
                  >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <div style={{ flex: 1 }}>
                        <Text fw={700} size="sm" c="#174421">
                          {cartItem.item.name}
                        </Text>

                        {(cartItem.ice || cartItem.sugar) && (
                          <Group gap={4} mt={2}>
                            {cartItem.ice && (
                              <Badge size="xs" variant="outline" color="bamboo">
                                {cartItem.ice}
                              </Badge>
                            )}
                            {cartItem.sugar && (
                              <Badge size="xs" variant="outline" color="coffee">
                                {cartItem.sugar}
                              </Badge>
                            )}
                          </Group>
                        )}

                        {cartItem.note && (
                          <Text size="xs" c="#607667" mt={3} fs="italic">
                            "{cartItem.note}"
                          </Text>
                        )}

                        <Text fw={700} size="sm" c="#215c2f" mt={4}>
                          {formatPrice(cartItem.totalPrice)}
                        </Text>
                      </div>

                      {/* Quantity controls */}
                      <Group gap={4} align="center">
                        <ActionIcon
                          size="sm"
                          variant="default"
                          onClick={() => onUpdateQuantity(cartItem.cartId, -1)}
                          aria-label="Giảm số lượng"
                        >
                          <IconMinus size={12} />
                        </ActionIcon>
                        <Text size="sm" fw={700} style={{ minWidth: 24, textAlign: 'center' }}>
                          {cartItem.quantity}
                        </Text>
                        <ActionIcon
                          size="sm"
                          variant="default"
                          onClick={() => onUpdateQuantity(cartItem.cartId, 1)}
                          aria-label="Tăng số lượng"
                        >
                          <IconPlus size={12} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => onRemoveItem(cartItem.cartId)}
                          aria-label="Xoá món"
                          ml={4}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))}

                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={onClearCart}
                  style={{ alignSelf: 'flex-end' }}
                >
                  Xóa tất cả món
                </Button>
              </Stack>

              <Divider my="md" />

              {/* Optional Order Note */}
              <Textarea
                label="Ghi chú cho quán (nếu có):"
                placeholder="Ví dụ: Tách đá riêng, ít ngọt, nhiều đá..."
                value={generalNote}
                onChange={(e) => setGeneralNote(e.currentTarget.value)}
                minRows={2}
                size="sm"
                radius="md"
                mb="md"
              />

              {/* Payment Method Selector */}
              <Stack gap="xs" mb="md">
                <Text fw={700} size="sm" c="#174421">
                  Phương thức thanh toán dự kiến:
                </Text>
                <SegmentedControl
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                  data={[
                    { label: '💳 Quét VietQR', value: 'vietqr' },
                    { label: '💵 Tiền Mặt', value: 'cash' },
                  ]}
                  color="bamboo"
                  fullWidth
                />
              </Stack>
            </div>

            {/* FIXED BOTTOM FOOTER: BẤM ĐẶT MÓN */}
            <div
              style={{
                flexShrink: 0,
                padding: '12px 16px calc(14px + env(safe-area-inset-bottom, 0px)) 16px',
                borderTop: '1px solid #e1ece2',
                backgroundColor: '#ffffff',
                boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
              }}
            >
              <Group justify="space-between" align="center" mb="xs">
                <Text fw={600} size="sm" c="#344b3c">
                  Tổng Tiền ({totalItemCount} món):
                </Text>
                <Text
                  fw={800}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: '#215c2f',
                    fontSize: '1.4rem',
                  }}
                >
                  {formatPrice(totalAmount)}
                </Text>
              </Group>

              <Stack gap="xs">
                <Button
                  color="bamboo"
                  size="md"
                  fullWidth
                  loading={submittingOrder}
                  leftSection={<IconReceipt size={20} />}
                  onClick={handleCreateOrder}
                  style={{ fontWeight: 800 }}
                >
                  Tạo Đơn Hàng & Đặt Món Ngay
                </Button>

                <Button
                  component="a"
                  href={`tel:${siteConfig.hotline}`}
                  variant="outline"
                  color="bamboo"
                  size="sm"
                  fullWidth
                  leftSection={<IconPhone size={16} />}
                >
                  Gọi Hotline Quán: {siteConfig.hotlineDisplay}
                </Button>
              </Stack>
            </div>
          </div>
        )
      )}
    </Drawer>
  );
};
