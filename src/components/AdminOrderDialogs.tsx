import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconQrcode } from '@tabler/icons-react';
import type { CustomerOrder, OrderStatus } from '../types/order';
import { siteConfig } from '../config/siteConfig';

interface AdminOrderDialogsProps {
  selectedInvoice: CustomerOrder | null;
  qrModalOrder: CustomerOrder | null;
  onCloseInvoice: () => void;
  onClosePayment: () => void;
  formatPrice: (value: number) => string;
  formatTime: (timestamp: number) => string;
  handleStatusChange: (orderId: string, status: OrderStatus) => Promise<boolean>;
}

export function AdminOrderDialogs({
  selectedInvoice, qrModalOrder, onCloseInvoice, onClosePayment, formatPrice, formatTime, handleStatusChange,
}: AdminOrderDialogsProps) {
  return (
    <>
    <Modal
      opened={!!selectedInvoice}
      onClose={() => onCloseInvoice()}
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
            {selectedInvoice.partySize && <Text size="xs" c="#607667">Số người: <b>{selectedInvoice.partySize}</b></Text>}
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

          <Button color="bamboo" variant="light" fullWidth mt="sm" onClick={() => onCloseInvoice()}>
            Đóng Hóa Đơn
          </Button>
        </Stack>
      )}
    </Modal>

    {/* MODAL: MÃ VIETQR THANH TOÁN CHO KHÁCH QUÉT TẠI QUẦY */}
    <Modal
      opened={!!qrModalOrder}
      onClose={() => onClosePayment()}
      title={
        <Group gap={8} align="center">
          <ThemeIcon size="md" color="teal" radius="md" variant="light">
            <IconQrcode size={20} />
          </ThemeIcon>
          <div>
            <Text fw={800} size="md" c="#174421" style={{ fontFamily: 'var(--font-heading)' }}>
              Mã QR Thanh Toán #{qrModalOrder?.orderCode}
            </Text>
            <Text size="11px" c="#546c5c">
              Đưa màn hình cho khách quét bằng ứng dụng ngân hàng
            </Text>
          </div>
        </Group>
      }
      size="md"
      radius="md"
      zIndex={1700}
    >
      {qrModalOrder && (() => {
        const qrUrl = `https://img.vietqr.io/image/${siteConfig.bankInfo.bankShortCode}-${siteConfig.bankInfo.accountNumber}-compact2.png?amount=${qrModalOrder.totalAmount}&addInfo=${encodeURIComponent(qrModalOrder.orderCode)}&accountName=${encodeURIComponent(siteConfig.bankInfo.accountHolder)}`;

        return (
          <Stack gap="sm" align="center" ta="center">
            {/* Big Crisp QR Image for Easy Scanning */}
            <div
              style={{
                padding: '8px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '2.5px solid #226135',
                boxShadow: '0 6px 20px rgba(34, 97, 53, 0.12)',
                display: 'inline-block',
              }}
            >
              <img
                src={qrUrl}
                alt={`VietQR đơn #${qrModalOrder.orderCode}`}
                style={{
                  width: '100%',
                  maxWidth: '260px',
                  height: 'auto',
                  aspectRatio: '1',
                  display: 'block',
                  borderRadius: '6px',
                }}
              />
            </div>

            {/* Amount & Bank Info Details */}
            <Paper p="xs" radius="md" withBorder style={{ width: '100%', backgroundColor: '#f8faf9', borderColor: '#dceee1', textAlign: 'left' }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="#546c5c" fw={600}>Số tiền thanh toán:</Text>
                <Text fw={800} size="lg" c="#226135" style={{ fontFamily: 'var(--font-heading)' }}>
                  {formatPrice(qrModalOrder.totalAmount)}
                </Text>
              </Group>

              <Divider my={4} color="#e5f0e8" />

              <Group justify="space-between" mb={2}>
                <Text size="xs" c="#546c5c">Ngân hàng:</Text>
                <Text size="xs" fw={700} c="#174421">
                  {siteConfig.bankInfo.bankName} ({siteConfig.bankInfo.bankShortCode})
                </Text>
              </Group>

              <Group justify="space-between" mb={2}>
                <Text size="xs" c="#546c5c">Số tài khoản:</Text>
                <Text size="xs" fw={700} ff="monospace" c="#174421">
                  {siteConfig.bankInfo.accountNumber}
                </Text>
              </Group>

              <Group justify="space-between" mb={2}>
                <Text size="xs" c="#546c5c">Chủ tài khoản:</Text>
                <Text size="xs" fw={700} c="#174421">
                  {siteConfig.bankInfo.accountHolder}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="xs" c="#546c5c">Nội dung CK:</Text>
                <Badge size="sm" color="teal" variant="light">
                  {qrModalOrder.orderCode}
                </Badge>
              </Group>
            </Paper>

            {/* Quick Actions for Owner */}
            <Stack gap="xs" style={{ width: '100%' }} mt="xs">
              {qrModalOrder.status !== 'completed' ? (
                <Button
                  color="teal"
                  size="md"
                  fullWidth
                  leftSection={<IconCheck size={20} />}
                  onClick={async () => {
                    if (await handleStatusChange(qrModalOrder.id, 'completed')) onClosePayment();
                  }}
                  style={{ fontWeight: 800, minHeight: '44px' }}
                >
                  ✓ Khách Đã Chuyển Tiền (Xác Nhận Đã Thu)
                </Button>
              ) : (
                <Badge size="lg" color="green" variant="filled" fullWidth py="sm">
                  ĐƠN HÀNG ĐÃ HOÀN TẤT & THU TIỀN
                </Badge>
              )}

              <Group grow>
                <Button
                  component="a"
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="light"
                  color="bamboo"
                  size="xs"
                >
                  Mở Ảnh QR Lớn
                </Button>
                <Button
                  variant="default"
                  size="xs"
                  onClick={() => onClosePayment()}
                >
                  Đóng Cửa Sổ
                </Button>
              </Group>
            </Stack>
          </Stack>
        );
      })()}
    </Modal>
    </>
  );
}
