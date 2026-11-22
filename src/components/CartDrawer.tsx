import React, { useState, useEffect, useRef } from 'react';
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
  NumberInput,
  Card,
  Alert,
} from '@mantine/core';
import {
  IconTrash,
  IconPlus,
  IconMinus,
  IconShoppingCart,
  IconPhone,
  IconReceipt,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { CartItem, PaymentMethod } from '../types/cart';
import { siteConfig } from '../config/siteConfig';
import {
  subscribeSingleOrder,
  markOrderCustomerPaid,
} from '../services/firebaseService';
import { ensureOrderSession } from '../lib/firebase';
import { buildCheckout, CheckoutNotSent, OrderPricingError, submitCheckout, type CheckoutAttempt } from '../services/customerCheckout';
import type { CustomerOrder, OrderItemDetail } from '../types/order';
import { OrderStatusPanel, orderStatusLabels } from './OrderStatusPanel';

type RecentOrder = Pick<CustomerOrder, 'id' | 'orderCode' | 'items'>;
const recentOrdersKey = 'xp_recent_orders';

function readRecentOrders(): RecentOrder[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(recentOrdersKey) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((order) => typeof order?.id === 'string' && typeof order.orderCode === 'string'
      && Array.isArray(order.items) && order.items.length > 0
      && order.items.every((item: OrderItemDetail) => typeof item?.id === 'string'
        && typeof item.name === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0)).slice(0, 5);
  } catch {
    return [];
  }
}

interface CartDrawerProps {
  opened: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onRefreshCart: () => void;
  onReorder: (items: OrderItemDetail[]) => { added: number; unavailable: number };
  onTrackingChange: (tracking: boolean) => void;
  onShowOrder: () => void;
  onOpenCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  opened,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onRefreshCart,
  onReorder,
  onTrackingChange,
  onShowOrder,
  onOpenCart,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr');
  const [generalNote, setGeneralNote] = useState('');
  const [partySize, setPartySize] = useState<number | string>('');
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [reorderMessage, setReorderMessage] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const submitting = useRef(false);
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(null);
  const [editingAttempt, setEditingAttempt] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [cartNeedsRefresh, setCartNeedsRefresh] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [trackingRetry, setTrackingRetry] = useState(0);

  // Active Live Order State
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const lastServerOrder = useRef<Pick<CustomerOrder, 'id' | 'status'> | null>(null);

  useEffect(() => {
    setRecentOrders(readRecentOrders());
    try {
      const savedOrderId = localStorage.getItem('xp_active_order_id');
      setActiveOrderId(savedOrderId);
      if (savedOrderId) {
        localStorage.removeItem('xp_checkout_attempt');
        return;
      }
      const saved = localStorage.getItem('xp_checkout_attempt');
      if (saved) {
        const pending = JSON.parse(saved) as CheckoutAttempt;
        if (pending.requestId && Array.isArray(pending.checkout?.items)) {
          setAttempt(pending);
          setPaymentMethod(pending.checkout.paymentMethod);
          setGeneralNote(pending.checkout.note);
          setPartySize(pending.checkout.partySize ?? '');
        }
      }
    } catch (error) {
      console.warn('Không thể khôi phục đơn trên thiết bị này:', error);
    }
  }, []);

  useEffect(() => {
    onTrackingChange(Boolean(activeOrderId));
  }, [activeOrderId, onTrackingChange]);

  useEffect(() => {
    if (!activeOrderId) return;
    if (activeOrderId.startsWith('local_')) {
      setTrackingError('Đơn cũ chỉ được lưu trên thiết bị. Hãy liên hệ quán để kiểm tra đơn hoặc khoản chuyển.');
      return;
    }

    let cancelled = false;
    let unsubscribe = () => {};
    setTrackingError('');
    const reportError = () => {
      if (!cancelled) setTrackingError('Chưa cập nhật được đơn. Hãy thử lại hoặc liên hệ quán để kiểm tra.');
    };
    ensureOrderSession().then(() => {
      if (cancelled) return;
      unsubscribe = subscribeSingleOrder(activeOrderId, (order, fromCache) => {
        if (order) {
          setActiveOrder(order);
          setTrackingError('');
          if (!fromCache) {
            const previous = lastServerOrder.current;
            lastServerOrder.current = { id: order.id, status: order.status };
            if (previous?.id === order.id && previous.status !== order.status) {
              notifications.show({
                id: `order-status-${order.id}-${order.status}`,
                title: orderStatusLabels[order.status],
                message: (
                  <Group gap="xs">
                    <Text size="sm">Đơn #{order.orderCode}</Text>
                    <Button variant="subtle" size="compact-xs" onClick={onShowOrder}>Xem đơn</Button>
                  </Group>
                ),
                color: order.status === 'cancelled' ? 'red' : 'bamboo',
                role: 'status',
                autoClose: 7000,
              });
            }
          }
        } else {
          setActiveOrder(null);
          setTrackingError('Quán không còn lưu đơn này. Hãy liên hệ quán nếu cần đối chiếu.');
        }
      }, reportError);
    }).catch(reportError);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [activeOrderId, trackingRetry, onShowOrder]);

  useEffect(() => {
    if (activeOrder?.status !== 'completed' || activeOrder.items.length === 0) return;
    const { id, orderCode, items } = activeOrder;
    const next = [{ id, orderCode, items }, ...readRecentOrders().filter((order) => order.id !== id)].slice(0, 5);
    setRecentOrders(next);
    try {
      localStorage.setItem(recentOrdersKey, JSON.stringify(next));
    } catch {
      // Keep recent orders in memory when storage is unavailable.
    }
  }, [activeOrder]);

  const totalAmount = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalItemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const forgetAttempt = () => {
    setAttempt(null);
    setEditingAttempt(false);
    try {
      localStorage.removeItem('xp_checkout_attempt');
    } catch (error) {
      console.warn(error);
    }
  };

  const handleCreateOrder = async () => {
    if (submitting.current || activeOrderId || ((!attempt || editingAttempt) && items.length === 0)) return;
    if (partySize !== '' && (typeof partySize !== 'number' || !Number.isInteger(partySize) || partySize < 1 || partySize > 99)) {
      setCheckoutError('Nhập số người từ 1 đến 99 hoặc để trống.');
      return;
    }
    submitting.current = true;
    setSubmittingOrder(true);
    setCheckoutError('');
    setCartNeedsRefresh(false);

    try {
      const cartCheckout = buildCheckout(items, paymentMethod, generalNote, typeof partySize === 'number' ? partySize : undefined);
      const nextAttempt = {
        requestId: attempt?.requestId ?? crypto.randomUUID(),
        checkout: attempt && !editingAttempt ? attempt.checkout : cartCheckout,
      };
      try {
        localStorage.setItem('xp_checkout_attempt', JSON.stringify(nextAttempt));
      } catch (error) {
        throw new CheckoutNotSent('Trình duyệt chưa cho phép lưu mã đơn. Bạn có thể gọi quán để đặt món.', { cause: error });
      }
      setAttempt(nextAttempt);
      setEditingAttempt(false);

      const result = await submitCheckout(nextAttempt);
      setActiveOrderId(result.id);
      try {
        localStorage.setItem('xp_active_order_id', result.id);
        forgetAttempt();
      } catch (error) {
        console.warn('Không thể lưu mã đơn:', error);
      }
      setAttempt(null);
      if (result.matchesCheckout && JSON.stringify(nextAttempt.checkout) === JSON.stringify(cartCheckout)) {
        onClearCart();
        setGeneralNote('');
        setPartySize('');
        setReorderMessage('');
      } else {
        setReorderMessage('Quán đã nhận phiên bản trước của đơn. Giỏ đã chỉnh được giữ lại.');
      }
      onShowOrder();
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      if (error instanceof CheckoutNotSent || error instanceof OrderPricingError || code === 'permission-denied') {
        if (!attempt && error instanceof CheckoutNotSent) forgetAttempt();
        else setEditingAttempt(true);
        setCheckoutError(code === 'permission-denied'
          ? 'Firebase từ chối lưu đơn. Giỏ hàng vẫn còn. Hãy gọi quán nếu cần đặt ngay.'
          : (error as Error).message);
        setCartNeedsRefresh(error instanceof OrderPricingError);
      } else {
        setCheckoutError('Chưa xác nhận được đơn. Hãy thử lại để kiểm tra cùng đơn này.');
      }
    } finally {
      submitting.current = false;
      setSubmittingOrder(false);
    }
  };

  // Khách bấm "Tôi đã chuyển khoản xong / Đã gửi tiền"
  const handleCustomerMarkPaid = async () => {
    if (!activeOrderId || trackingError) return;
    try {
      setMarkingPaid(true);

      setPaymentError('');
      await markOrderCustomerPaid(activeOrderId);
      notifications.show({
        title: 'Đã báo thanh toán!',
        message: 'Chủ quán đang kiểm tra và sẽ hoàn tất đơn hàng ngay lập tức.',
        color: 'teal',
      });
    } catch {
      setPaymentError('Chưa gửi được báo cáo thanh toán. Hãy thử lại hoặc gọi quán.');
    } finally {
      setMarkingPaid(false);
    }
  };

  // Đặt đơn hàng mới (Reset)
  const handleResetForNewOrder = () => {
    setActiveOrderId(null);
    setActiveOrder(null);
    forgetAttempt();
    setTrackingError('');
    setPaymentError('');
    try {
      localStorage.removeItem('xp_active_order_id');
      localStorage.removeItem('xp_local_order_data');
    } catch (e) {
      console.warn(e);
    }
  };

  const reorder = (order: RecentOrder) => {
    const { added, unavailable } = onReorder(order.items);
    if (added && activeOrder?.status === 'completed') handleResetForNewOrder();
    setReorderMessage(added
      ? (unavailable ? 'Đã thêm các món còn bán. Một số món trong đơn cũ đã hết.' : 'Đã thêm combo vào giỏ theo giá hiện tại.')
      : 'Các món trong đơn này hiện không có trong thực đơn.');
    return Boolean(added);
  };

  const recentOrderList = recentOrders.length > 0 && (
    <Stack gap="xs">
      <Text fw={700} size="sm">Đơn gần đây</Text>
      {recentOrders.map((order) => (
        <Group key={order.id} justify="space-between" align="center" wrap="nowrap">
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="sm">#{order.orderCode}</Text>
            <Text size="xs" c="dimmed" lineClamp={2}>
              {order.items.map((item) => `${item.quantity} × ${item.name}`).join(' · ')}
            </Text>
          </div>
          <Button variant="light" size="compact-sm" onClick={() => reorder(order)} aria-label={`Đặt lại đơn ${order.orderCode}`}>
            Đặt lại
          </Button>
        </Group>
      ))}
    </Stack>
  );

  return (
    <>
      {activeOrderId && (
        <OrderStatusPanel
          order={activeOrder}
          trackingError={trackingError}
          feedback={reorderMessage}
          markingPaid={markingPaid}
          paymentError={paymentError}
          canRetry={!activeOrderId.startsWith('local_')}
          onRetry={() => setTrackingRetry((count) => count + 1)}
          onMarkPaid={handleCustomerMarkPaid}
          onReorder={() => {
            if (activeOrder && reorder(activeOrder)) onOpenCart();
          }}
          onOpenCart={onOpenCart}
          onDismiss={handleResetForNewOrder}
        />
      )}
      <Drawer
        opened={opened}
        onClose={() => { if (!submitting.current) onClose(); }}
        position="right"
        size="md"
        zIndex={2500}
        withCloseButton
        closeButtonProps={{ 'aria-label': 'Đóng giỏ hàng', size: 'lg' }}
        title={
          <Group gap="xs">
            <IconShoppingCart size={22} color="#226135" />
            <Text fw={700} c="#14281b" size="lg" style={{ fontFamily: 'var(--font-heading)' }}>
              {`Giỏ hàng (${totalItemCount} món)`}
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
        {reorderMessage && !activeOrderId && <Alert color="bamboo" role="status" m="xs" py="xs">{reorderMessage}</Alert>}
        {attempt && !editingAttempt ? (
          <Stack p="md" aria-live="polite">
            <Text>{checkoutError || 'Đang kiểm tra đơn đã gửi. Giỏ hàng vẫn được lưu cho đến khi hệ thống xác nhận.'}</Text>
            <Button loading={submittingOrder} onClick={handleCreateOrder}>Thử xác nhận lại đơn</Button>
            <Button variant="default" disabled={submittingOrder} onClick={() => {
              setEditingAttempt(true);
              setCheckoutError('');
            }}>Quay lại chỉnh giỏ</Button>
            <Button component="a" href={`tel:${siteConfig.hotline}`} variant="light">Gọi quán để kiểm tra</Button>
          </Stack>
        ) : (
          items.length === 0 ? (
            <Stack p="md" className="cart-drawer-scrollable" style={{ overflowY: 'auto' }}>
              <Stack align="center" py="lg">
                <IconShoppingCart size={48} color="#badcc3" stroke={1.2} />
                <Text fw={600}>Giỏ hàng đang trống</Text>
                <Button variant="light" onClick={onClose}>Xem thực đơn</Button>
              </Stack>
              {recentOrderList}
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
                            disabled={cartItem.quantity >= 99}
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

                <NumberInput
                  label="Số người"
                  placeholder="Ví dụ: 5"
                  value={partySize}
                  onChange={setPartySize}
                  min={1}
                  max={99}
                  allowDecimal={false}
                  allowNegative={false}
                  mb="sm"
                />
                <Textarea
                  label="Yêu cầu cho quán (không bắt buộc)"
                  placeholder="Ví dụ: Chuẩn bị 5 ly nước lọc, phục vụ tại bàn 3"
                  value={generalNote}
                  maxLength={500}
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
                {recentOrderList}
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
                  {checkoutError && (
                    <Alert color="red" role="alert">
                      {checkoutError}
                      {cartNeedsRefresh && (
                        <Button mt="xs" variant="light" fullWidth onClick={() => {
                          onRefreshCart();
                          setCartNeedsRefresh(false);
                          setCheckoutError('');
                        }}>
                          Cập nhật món và giá trong giỏ
                        </Button>
                      )}
                    </Alert>
                  )}
                  {activeOrderId ? (
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">
                        {activeOrder?.status === 'completed' || activeOrder?.status === 'cancelled'
                          ? 'Ẩn đơn trước trong mục theo dõi để gửi giỏ này.'
                          : 'Giỏ này được lưu để đặt sau khi đơn hiện tại kết thúc.'}
                      </Text>
                      <Button variant="light" onClick={onShowOrder}>Xem đơn hiện tại</Button>
                    </Stack>
                  ) : (
                  <Button
                    color="bamboo"
                    size="md"
                    fullWidth
                    loading={submittingOrder}
                    leftSection={<IconReceipt size={20} />}
                    onClick={handleCreateOrder}
                    style={{ fontWeight: 800 }}
                  >
                    Gửi đơn cho quán
                  </Button>
                  )}

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
    </>
  );
};
