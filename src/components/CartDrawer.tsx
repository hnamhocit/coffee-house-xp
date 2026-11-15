import React, { useState } from 'react';
import {
  Drawer,
  Stack,
  Group,
  Text,
  Title,
  Button,
  ActionIcon,
  Divider,
  Badge,
  SegmentedControl,
  TextInput,
  Textarea,
  Card,
  CopyButton,
  Tooltip,
  Box,
  Image,
} from '@mantine/core';
import {
  IconTrash,
  IconPlus,
  IconMinus,
  IconShoppingCart,
  IconBrandWhatsapp,
  IconPhone,
  IconCopy,
  IconCheck,
  IconQrcode,
  IconReceipt,
  IconBuildingBank,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { CartItem, OrderType, OrderCustomerInfo } from '../types/cart';
import { siteConfig } from '../config/siteConfig';

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
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  const totalAmount = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalItemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  // Generate order text for Zalo or Copy
  const generateOrderMessage = () => {
    let msg = `🎋 [ĐƠN ĐẶT MÓN - XUÂN PHẠM COFFEE]\n`;
    msg += `📍 Địa chỉ quán: ${siteConfig.addressShort}\n`;
    msg += `------------------------------------\n`;
    if (orderType === 'dine-in') {
      msg += `📌 Hình thức: Uống tại quán\n`;
      msg += `🪑 Số bàn: ${tableNumber.trim() || 'Chưa nhập bàn'}\n`;
    } else {
      msg += `📌 Hình thức: Mang về / Giao hàng\n`;
      msg += `👤 Khách hàng: ${customerName.trim() || 'Khách'}\n`;
      msg += `📞 SĐT: ${customerPhone.trim() || 'Chưa có'}\n`;
    }
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
      msg += `📝 Ghi chú chung: ${generalNote.trim()}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `💳 Thanh toán: Techcombank 3657771130 - PHAM THI THANH XUAN`;
    return msg;
  };

  const handleOrderZalo = () => {
    if (items.length === 0) return;
    const msg = generateOrderMessage();
    // Copy to clipboard for convenience
    navigator.clipboard.writeText(msg);

    notifications.show({
      title: 'Đã sao chép nội dung đơn hàng!',
      message: 'Đang mở Zalo của quán (0365 777 113). Bạn chỉ cần dán tin nhắn để gửi cho quán.',
      color: 'bamboo',
      autoClose: 4000,
    });

    // Open Zalo
    window.open(`https://zalo.me/${siteConfig.zalo}`, '_blank');
  };

  // QR Code URL via VietQR
  const qrTransferMemo = `XP ${orderType === 'dine-in' ? (tableNumber ? `Ban ${tableNumber}` : 'Tai quan') : (customerName || 'Mang ve')}`;
  const vietQrUrl = `https://img.vietqr.io/image/${siteConfig.bankInfo.bankShortCode}-${siteConfig.bankInfo.accountNumber}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(qrTransferMemo)}&accountName=${encodeURIComponent(siteConfig.bankInfo.accountHolder)}`;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={
        <Group gap="xs">
          <IconShoppingCart size={22} color="#256232" />
          <Text fw={700} c="#174421" size="lg" style={{ fontFamily: 'var(--font-heading)' }}>
            Giỏ Hàng Của Bạn ({totalItemCount} món)
          </Text>
        </Group>
      }
      padding="md"
    >
      {items.length === 0 ? (
        <Stack align="center" justify="center" py="4rem">
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
        <Stack gap="md" justify="space-between" style={{ minHeight: 'calc(100vh - 120px)' }}>
          {/* Scrollable Items List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
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
                      >
                        <IconPlus size={12} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => onRemoveItem(cartItem.cartId)}
                        title="Xoá món"
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

            {/* Order details options */}
            <Stack gap="xs">
              <Text fw={700} size="sm" c="#174421">
                Hình thức phục vụ:
              </Text>
              <SegmentedControl
                value={orderType}
                onChange={(val) => setOrderType(val as OrderType)}
                data={[
                  { label: '🪑 Uống Tại Quán', value: 'dine-in' },
                  { label: '🥤 Mang Về / Giao Gần', value: 'takeaway' },
                ]}
                color="bamboo"
                fullWidth
              />

              {orderType === 'dine-in' ? (
                <TextInput
                  label="Số bàn của bạn:"
                  placeholder="Ví dụ: Bàn 5, Bàn Vườn Tre 2..."
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.currentTarget.value)}
                  size="sm"
                  radius="md"
                />
              ) : (
                <Group grow>
                  <TextInput
                    label="Tên người nhận:"
                    placeholder="Tên của bạn"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.currentTarget.value)}
                    size="sm"
                    radius="md"
                  />
                  <TextInput
                    label="Số điện thoại:"
                    placeholder="SĐT liên hệ"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.currentTarget.value)}
                    size="sm"
                    radius="md"
                  />
                </Group>
              )}

              <Textarea
                label="Ghi chú đơn hàng:"
                placeholder="Ghi chú thêm về thời gian, tách đá riêng, thanh toán..."
                value={generalNote}
                onChange={(e) => setGeneralNote(e.currentTarget.value)}
                minRows={2}
                size="sm"
                radius="md"
              />
            </Stack>

            <Divider my="md" />

            {/* Bank Transfer Box */}
            <Card
              withBorder
              radius="md"
              padding="sm"
              style={{
                backgroundColor: '#f0f7f2',
                border: '1.5px dashed #badcc3',
              }}
            >
              <Group justify="space-between" align="center" mb="xs">
                <img
                  src="/images/techcombank-logo.png"
                  alt="Techcombank"
                  style={{ height: '24px', objectFit: 'contain', display: 'block' }}
                />
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="bamboo"
                  leftSection={<IconQrcode size={14} />}
                  onClick={() => setShowQrCode(!showQrCode)}
                >
                  {showQrCode ? 'Ẩn QR' : 'Mở VietQR'}
                </Button>
              </Group>

              <Group justify="space-between" align="center">
                <div>
                  <Text size="xs" c="#455b4e">
                    STK: <b>{siteConfig.bankInfo.accountNumber}</b>
                  </Text>
                  <Text size="xs" c="#455b4e">
                    Chủ TK: <b>{siteConfig.bankInfo.accountHolder}</b>
                  </Text>
                </div>

                <CopyButton value={siteConfig.bankInfo.accountNumber} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Đã chép!' : 'Chép STK'} withArrow>
                      <Button
                        size="xs"
                        variant={copied ? 'filled' : 'light'}
                        color={copied ? 'teal' : 'bamboo'}
                        onClick={copy}
                        leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      >
                        {copied ? 'Đã Chép' : 'Sao Chép'}
                      </Button>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>

              {showQrCode && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <img
                    src={vietQrUrl}
                    alt="VietQR Chuyển khoản"
                    style={{
                      width: '180px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'inline-block',
                      backgroundColor: '#ffffff',
                      padding: '4px',
                    }}
                  />
                  <Text size="xs" c="#455b4e" mt={4}>
                    Quét bằng app ngân hàng bất kỳ để chuyển nhanh {formatPrice(totalAmount)}
                  </Text>
                </div>
              )}
            </Card>
          </div>

          {/* Bottom Fixed Checkout Summary */}
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #e1ece2',
              backgroundColor: '#ffffff',
            }}
          >
            <Group justify="space-between" align="center" mb="xs">
              <Text fw={600} size="md" c="#344b3c">
                Tổng Tiền ({totalItemCount} món):
              </Text>
              <Text
                fw={800}
                size="xl"
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
                leftSection={<IconReceipt size={20} />}
                onClick={handleOrderZalo}
                style={{ fontWeight: 700 }}
              >
                Gửi Đơn Cho Quán Qua Zalo
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
        </Stack>
      )}
    </Drawer>
  );
};
