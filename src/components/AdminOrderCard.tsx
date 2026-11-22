import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { IconBell, IconCheck, IconCup, IconEye, IconQrcode, IconTrash } from '@tabler/icons-react';
import type { CustomerOrder, OrderStatus } from '../types/order';

interface AdminOrderCardProps {
  order: CustomerOrder;
  formatPrice: (value: number) => string;
  formatTime: (timestamp: number) => string;
  handleStatusChange: (orderId: string, status: OrderStatus) => Promise<boolean>;
  setSelectedInvoice: (order: CustomerOrder) => void;
  setQrModalOrder: (order: CustomerOrder) => void;
  handleDeleteOrder: (orderId: string) => Promise<void>;
}

export function AdminOrderCard({
  order, formatPrice, formatTime, handleStatusChange, setSelectedInvoice, setQrModalOrder, handleDeleteOrder,
}: AdminOrderCardProps) {
  return (
    <Card
      withBorder
      radius="md"
      p={{ base: 'xs', sm: 'md' }}
      style={{
        backgroundColor: '#ffffff',
        borderLeft: `5px solid ${
          order.status === 'pending' || order.status === 'preparing'
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
                order.status === 'pending' || order.status === 'preparing'
                  ? 'yellow'
                  : order.status === 'served'
                  ? 'blue'
                  : order.status === 'completed'
                  ? 'teal'
                  : 'red'
              }
            >
              {order.status === 'pending'
                ? '1. Đơn mới'
                : order.status === 'preparing'
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

          {order.partySize && <Text size="sm" fw={600}>Phục vụ {order.partySize} người</Text>}
          {order.note && (
            <Text size="xs" c="#e67700" mt={6} fs="italic">
              Ghi chú khách: "{order.note}"
            </Text>
          )}
        </Paper>

        {/* Total Amount & Action Buttons (Mobile-first Touch targets) */}
        <Group justify="space-between" align="center" mt={4}>
          <Text size="xs" c="#607667" fw={700}>
            {order.priceVerified === false ? 'Tạm tính' : 'Tổng tiền'}
          </Text>
          <Text fw={800} size="lg" c="#226135" style={{ fontFamily: 'var(--font-heading)' }}>
            {formatPrice(order.totalAmount)}
          </Text>
        </Group>

        {(order.status === 'pending' || order.status === 'preparing') && (
          <Group className="admin-order-actions" gap="xs">
            {order.status === 'pending' && (
              <Button size="md" variant="light" onClick={() => handleStatusChange(order.id, 'preparing')}>
                Bắt đầu chuẩn bị món
              </Button>
            )}
            <Button
              size="md"
              variant={order.status === 'pending' ? 'default' : 'filled'}
              leftSection={<IconCup size={18} />}
              onClick={() => handleStatusChange(order.id, 'served')}
            >
              Đã phục vụ
            </Button>
          </Group>
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

        {/* Sub-actions Row (View invoice, VietQR modal, Cancel, Delete) */}
        <Group justify="space-between" align="center" mt={2} wrap="wrap" gap="xs">
          <Group gap={6}>
            <Button
              size="xs"
              variant="light"
              color="gray"
              leftSection={<IconEye size={14} />}
              onClick={() => setSelectedInvoice(order)}
            >
              Xem Hóa Đơn
            </Button>

            <Button
              size="xs"
              variant={order.paymentMethod === 'vietqr' ? 'filled' : 'light'}
              color="teal"
              leftSection={<IconQrcode size={14} />}
              disabled={order.priceVerified === false}
              onClick={() => setQrModalOrder(order)}
              style={{ fontWeight: 700 }}
            >
              Mã VietQR
            </Button>
          </Group>

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
  );
}
