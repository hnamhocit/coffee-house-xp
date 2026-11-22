import { useState } from 'react';
import { Alert, Anchor, Badge, Button, Container, CopyButton, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconCheck, IconClock, IconDownload, IconReceipt } from '@tabler/icons-react';
import { siteConfig } from '../config/siteConfig';
import type { CustomerOrder, OrderStatus } from '../types/order';

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Đã gửi đơn',
  preparing: 'Quán đang chuẩn bị món',
  served: 'Đã phục vụ · Chờ thanh toán',
  completed: 'Đã thanh toán & hoàn tất',
  cancelled: 'Đã hủy đơn',
};

const statusColors: Record<OrderStatus, string> = {
  pending: 'yellow',
  preparing: 'orange',
  served: 'blue',
  completed: 'teal',
  cancelled: 'red',
};

const progressSteps = [
  { status: 'pending', label: 'Đã gửi' },
  { status: 'preparing', label: 'Đang chuẩn bị' },
  { status: 'served', label: 'Đã phục vụ' },
  { status: 'completed', label: 'Hoàn tất' },
] as const;

interface OrderStatusPanelProps {
  order: CustomerOrder | null;
  trackingError: string;
  feedback: string;
  markingPaid: boolean;
  paymentError: string;
  canRetry: boolean;
  onRetry: () => void;
  onMarkPaid: () => Promise<void>;
  onReorder: () => void;
  onOpenCart: () => void;
  onDismiss: () => void;
}

export const orderStatusSectionId = 'trang-thai-don';

export function scrollToOrderStatus() {
  const section = document.getElementById(orderStatusSectionId);
  section?.focus({ preventScroll: true });
  section?.scrollIntoView({ block: 'start' });
}

const formatPrice = (price: number) => `${price.toLocaleString('vi-VN')} đ`;

function OrderPayment({ order, trackingError, paymentError, markingPaid, onMarkPaid }: {
  order: CustomerOrder;
  trackingError: string;
  paymentError: string;
  markingPaid: boolean;
  onMarkPaid: () => Promise<void>;
}) {
  const [qrUnavailable, setQrUnavailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const { bankInfo } = siteConfig;
  const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankShortCode}-${bankInfo.accountNumber}-compact2.png?amount=${order.totalAmount}&addInfo=${encodeURIComponent(order.orderCode)}&accountName=${encodeURIComponent(bankInfo.accountHolder)}`;

  const downloadQr = async () => {
    setDownloading(true);
    setDownloadError(false);
    try {
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('VietQR unavailable');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `VietQR-${order.orderCode}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Stack gap="sm">
      <Title order={3} size="h4">Thanh toán</Title>
      {order.paymentMethod === 'vietqr' ? (
        <Stack gap="xs">
          {qrUnavailable ? (
            <Text size="sm">Chưa tải được ảnh QR. Bạn có thể chuyển khoản bằng thông tin bên dưới.</Text>
          ) : (
            <img className="order-status-qr" src={qrUrl} alt={`Mã VietQR cho đơn ${order.orderCode}`} onError={() => setQrUnavailable(true)} />
          )}
          <Text size="sm">{bankInfo.bankName} · {bankInfo.accountHolder}</Text>
          <Text size="sm">Số tài khoản <strong>{bankInfo.accountNumber}</strong></Text>
          <Text size="sm">Nội dung chuyển khoản <strong>{order.orderCode}</strong></Text>
          <Group gap="xs">
            <CopyButton value={bankInfo.accountNumber}>{({ copy, copied }) => (
              <Button size="xs" variant="light" onClick={copy}>{copied ? 'Đã chép' : 'Chép số tài khoản'}</Button>
            )}</CopyButton>
            <CopyButton value={order.orderCode}>{({ copy, copied }) => (
              <Button size="xs" variant="light" onClick={copy}>{copied ? 'Đã chép' : 'Chép mã đơn'}</Button>
            )}</CopyButton>
            <Button size="xs" variant="default" onClick={downloadQr} loading={downloading} leftSection={<IconDownload size={14} />}>Tải QR</Button>
          </Group>
          {downloadError && (
            <Anchor href={qrUrl} target="_blank" rel="noopener noreferrer" size="sm">
              Mở ảnh QR trong tab mới
            </Anchor>
          )}
        </Stack>
      ) : (
        <Text size="sm">Gửi <strong>{formatPrice(order.totalAmount)}</strong> tiền mặt cho nhân viên.</Text>
      )}
      {paymentError && <Alert color="red" role="alert">{paymentError}</Alert>}
      {order.customerPaid ? (
        <Alert color="teal" icon={<IconCheck size={18} />} role="status">Bạn đã báo thanh toán. Đang chờ quán xác nhận.</Alert>
      ) : (
        <Button onClick={onMarkPaid} loading={markingPaid} disabled={Boolean(trackingError)}>
          {order.paymentMethod === 'vietqr' ? 'Tôi đã chuyển khoản' : 'Tôi đã gửi tiền mặt'}
        </Button>
      )}
    </Stack>
  );
}

export function OrderStatusPanel({
  order, trackingError, feedback, markingPaid, paymentError, canRetry,
  onRetry, onMarkPaid, onReorder, onOpenCart, onDismiss,
}: OrderStatusPanelProps) {
  const step = progressSteps.findIndex(({ status }) => status === order?.status);
  const closed = order?.status === 'completed' || order?.status === 'cancelled';

  return (
    <section id={orderStatusSectionId} className="order-status-section" tabIndex={-1} aria-labelledby="order-status-title">
      <Container size="lg">
        <Paper withBorder radius="lg" className="order-status-panel">
          <Stack gap="md">
            <Group justify="space-between" gap="xs">
              <Group gap="xs">
                <IconReceipt size={22} />
                <Title order={2} size="h3" id="order-status-title">Đơn của bạn</Title>
                {order && <Text c="dimmed" size="sm" fw={600}>#{order.orderCode}</Text>}
              </Group>
              {order && <Badge color={statusColors[order.status]} variant="light" size="lg">{orderStatusLabels[order.status]}</Badge>}
            </Group>

            {feedback && <Alert color="bamboo" role="status">{feedback}</Alert>}
            {trackingError && (
              <Alert color="orange" role="status">
                <Stack gap="xs">
                  <Text size="sm">{trackingError}</Text>
                  <Group gap="xs">
                    {canRetry && <Button variant="light" size="xs" onClick={onRetry}>Tải lại trạng thái</Button>}
                    <Anchor href={`tel:${siteConfig.hotline}`} size="sm">Gọi quán</Anchor>
                    {!order && <Button variant="default" size="xs" onClick={onDismiss}>Ẩn theo dõi</Button>}
                  </Group>
                </Stack>
              </Alert>
            )}
            {!order && !trackingError && <Text c="dimmed" role="status">Đang tải trạng thái đơn…</Text>}
            {order && (
              <>
                {step >= 0 && (
                  <ol className="order-status-steps" aria-label="Tiến độ đơn">
                    {progressSteps.map(({ status, label }, index) => (
                      <li key={status} data-reached={index <= step} aria-current={index === step ? 'step' : undefined}>
                        {label}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="order-status-details">
                  <Stack gap="sm">
                    <Title order={3} size="h4">Các món đã đặt</Title>
                    {order.items.map((item, index) => (
                      <Group key={`${item.id}-${index}`} justify="space-between" align="start" wrap="nowrap">
                        <div>
                          <Text size="sm" fw={600}>{item.quantity} × {item.name}</Text>
                          {[item.ice, item.sugar, item.note].some(Boolean) && (
                            <Text size="xs" c="dimmed">{[item.ice, item.sugar, item.note].filter(Boolean).join(' · ')}</Text>
                          )}
                        </div>
                        <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>{formatPrice(item.totalPrice)}</Text>
                      </Group>
                    ))}
                    {order.partySize && <Text size="sm">Phục vụ {order.partySize} người</Text>}
                    {order.note && <Text size="sm">Yêu cầu: {order.note}</Text>}
                    <Group className="order-status-total" justify="space-between">
                      <Text fw={700}>{order.priceVerified === false ? 'Tạm tính' : 'Tổng tiền'}</Text>
                      <Text fw={800} c="bamboo.9">{formatPrice(order.totalAmount)}</Text>
                    </Group>
                  </Stack>

                  <Stack gap="sm">
                    {order.status === 'served' ? (
                      <OrderPayment key={order.id} {...{ order, trackingError, paymentError, markingPaid, onMarkPaid }} />
                    ) : closed ? (
                      <Group gap="xs">
                        {order.status === 'completed' && <Button onClick={onReorder}>Đặt lại combo</Button>}
                        <Button variant="default" onClick={onDismiss}>Ẩn đơn</Button>
                      </Group>
                    ) : (
                      <Alert color="bamboo" icon={<IconClock size={18} />}>
                        {order.status === 'pending' ? 'Quán sẽ cập nhật tiến độ khi bắt đầu làm món.' : 'Mục thanh toán sẽ hiện khi quán đã phục vụ.'}
                      </Alert>
                    )}
                    <Group gap="md">
                      <Anchor href="#thuc-don" size="sm">Xem thực đơn</Anchor>
                      <Anchor href={`tel:${siteConfig.hotline}`} size="sm">Liên hệ quán</Anchor>
                      {closed && <Anchor component="button" type="button" onClick={onOpenCart} size="sm">Mở giỏ hàng</Anchor>}
                    </Group>
                  </Stack>
                </div>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </section>
  );
}
