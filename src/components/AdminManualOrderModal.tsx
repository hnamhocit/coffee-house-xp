import React from 'react';
import {
  Group,
  Stack,
  Select,
  Text,
  Button,
  Badge,
  TextInput,
  SimpleGrid,
  ActionIcon,
  Divider,
  Paper,
  Modal,
  ThemeIcon,
} from '@mantine/core';
import { IconPlus, IconTrash, IconCheck, IconSearch } from '@tabler/icons-react';
import type { MenuItem } from '../data/menuData';
import type { OrderStatus } from '../types/order';
import { fuzzyMatchVietnamese, getSearchRelevanceScore } from '../utils/vietnameseSearch';

interface AdminManualOrderModalProps {
  manualOrderOpen: boolean;
  setManualOrderOpen: React.Dispatch<React.SetStateAction<boolean>>;
  manualCustomerNote: string;
  setManualCustomerNote: React.Dispatch<React.SetStateAction<string>>;
  manualPaymentMethod: "cash" | "vietqr";
  setManualPaymentMethod: React.Dispatch<React.SetStateAction<"cash" | "vietqr">>;
  manualInitialStatus: OrderStatus;
  setManualInitialStatus: React.Dispatch<React.SetStateAction<OrderStatus>>;
  products: MenuItem[];
  manualSearchQuery: string;
  setManualSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  formatPrice: (val: number) => string;
  handleAddManualItem: (product: MenuItem) => void;
  manualCart: { item: MenuItem; quantity: number; ice: string; sugar: string; note: string; }[];
  setManualCart: React.Dispatch<React.SetStateAction<{ item: MenuItem; quantity: number; ice: string; sugar: string; note: string; }[]>>;
  handleUpdateManualQty: (idx: number, delta: number) => void;
  handleUpdateManualOption: (idx: number, field: "ice" | "sugar" | "note", val: string) => void;
  handleSaveManualOrder: () => Promise<void>;
  savingManualOrder: boolean;
}

export function AdminManualOrderModal({
  manualOrderOpen,
  setManualOrderOpen,
  manualCustomerNote,
  setManualCustomerNote,
  manualPaymentMethod,
  setManualPaymentMethod,
  manualInitialStatus,
  setManualInitialStatus,
  products,
  manualSearchQuery,
  setManualSearchQuery,
  formatPrice,
  handleAddManualItem,
  manualCart,
  setManualCart,
  handleUpdateManualQty,
  handleUpdateManualOption,
  handleSaveManualOrder,
  savingManualOrder,
}: AdminManualOrderModalProps) {
  return (
    <Modal
      opened={manualOrderOpen}
      onClose={() => setManualOrderOpen(false)}
      title={
        <Group gap={8} align="center">
          <ThemeIcon size="md" color="bamboo" radius="md" variant="light">
            <IconPlus size={18} />
          </ThemeIcon>
          <div>
            <Text fw={800} size="md" c="#174421" style={{ fontFamily: 'var(--font-heading)' }}>
              Tạo Đơn Hàng Tại Quán
            </Text>
            <Text size="11px" c="#546c5c">
              Dành cho khách gọi trực tiếp tại quầy hoặc mua mang về
            </Text>
          </div>
        </Group>
      }
      closeButtonProps={{ 'aria-label': 'Đóng đơn tại quán' }}
      size="lg"
      radius="md"
      zIndex={1600}
    >
      <Stack gap="md">
        {/* Top Order Information */}
        <Paper p="sm" withBorder radius="md" style={{ backgroundColor: '#f8faf9', borderColor: '#dceee1' }}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
            <div>
              <Text size="xs" fw={700} c="#174421" mb={4}>
                Bàn / Tên Khách:
              </Text>
              <TextInput
                placeholder="VD: Bàn 3, Mang về..."
                value={manualCustomerNote}
                onChange={(e) => setManualCustomerNote(e.target.value)}
                size="sm"
              />
            </div>

            <div>
              <Select
                comboboxProps={{ zIndex: 1800 }}
                label="Hình thức thanh toán"
                value={manualPaymentMethod}
                onChange={(value) => { if (value !== null) setManualPaymentMethod(value as 'cash' | 'vietqr'); }}
                allowDeselect={false}
                data={[
                  { value: 'cash', label: 'Tiền mặt tại quầy' },
                  { value: 'vietqr', label: 'Chuyển khoản VietQR' },
                ]}
              />
              {manualPaymentMethod === 'vietqr' && (
                <Text size="10px" c="#226135" mt={4} fw={600}>
                  💡 Tự động bật mã QR cho khách quét ngay sau khi tạo đơn
                </Text>
              )}
            </div>

            <div>
              <Select
                comboboxProps={{ zIndex: 1800 }}
                label="Trạng thái khởi tạo"
                value={manualInitialStatus}
                onChange={(value) => { if (value !== null) setManualInitialStatus(value as OrderStatus); }}
                allowDeselect={false}
                data={[
                  { value: 'pending', label: 'Đơn mới (chờ pha chế)' },
                  { value: 'preparing', label: 'Đang soạn món' },
                  { value: 'completed', label: 'Đã thu tiền ngay (khách đã trả)' },
                ]}
              />
            </div>
          </SimpleGrid>
        </Paper>

        {/* Product Selector with Search */}
        <div>
          <Group justify="space-between" align="center" mb={6}>
            <Text size="xs" fw={800} c="#174421" tt="uppercase">
              1. Chọn Món Nước Vào Đơn:
            </Text>
            <Badge size="xs" variant="light" color="teal">
              {products.length} món sẵn có
            </Badge>
          </Group>

          <TextInput
            placeholder="Tìm nhanh tên món (trà sữa, cà phê, sinh tố...)"
            leftSection={<IconSearch size={14} color="#789080" />}
            value={manualSearchQuery}
            onChange={(e) => setManualSearchQuery(e.target.value)}
            size="xs"
            mb="xs"
          />

          <div
            style={{
              maxHeight: '190px',
              overflowY: 'auto',
              border: '1px solid #e5f0e8',
              borderRadius: '8px',
              padding: '6px',
              backgroundColor: '#ffffff',
            }}
          >
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={6}>
              {products
                .filter((p) =>
                  manualSearchQuery.trim() === ''
                    ? true
                    : fuzzyMatchVietnamese(
                        manualSearchQuery,
                        p.name,
                        `${p.category} ${p.badge || ''}`
                      )
                )
                .sort((a, b) => {
                  if (!manualSearchQuery.trim()) return 0;
                  return (
                    getSearchRelevanceScore(manualSearchQuery, b.name, b.category) -
                    getSearchRelevanceScore(manualSearchQuery, a.name, a.category)
                  );
                })
                .map((prod) => (
                  <Paper
                    key={prod.id}
                    withBorder
                    p="xs"
                    radius="sm"
                    style={{
                      backgroundColor: '#fafcfb',
                      borderColor: '#e8f3ec',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <Group gap={8} align="center" style={{ minWidth: 0, flex: 1 }}>
                      <img
                        src={prod.image}
                        alt={prod.name}
                        style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text size="xs" fw={700} truncate c="#174421">
                          {prod.name}
                        </Text>
                        <Text size="11px" fw={700} c="#226135">
                          {formatPrice(prod.price)}
                        </Text>
                      </div>
                    </Group>

                    <Button
                      size="compact-xs"
                      color="bamboo"
                      leftSection={<IconPlus size={12} />}
                      onClick={() => handleAddManualItem(prod)}
                      style={{ fontWeight: 700, flexShrink: 0 }}
                    >
                      Thêm
                    </Button>
                  </Paper>
                ))}
            </SimpleGrid>
          </div>
        </div>

        {/* Selected Items in Manual Order */}
        <div>
          <Group justify="space-between" align="center" mb={6}>
            <Text size="xs" fw={800} c="#174421" tt="uppercase">
              2. Món Đã Chọn Trong Đơn ({manualCart.reduce((s, it) => s + it.quantity, 0)} ly):
            </Text>
            {manualCart.length > 0 && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="red"
                onClick={() => setManualCart([])}
              >
                Xóa tất cả
              </Button>
            )}
          </Group>

          {manualCart.length === 0 ? (
            <Paper p="md" withBorder radius="md" ta="center" style={{ backgroundColor: '#fcfdfd', borderColor: '#e8f3ec' }}>
              <Text size="xs" c="#607667">
                Chưa có món nào trong đơn. Vui lòng nhấn nút <b>[Thêm]</b> ở danh sách trên.
              </Text>
            </Paper>
          ) : (
            <Stack gap={6} style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
              {manualCart.map((item, idx) => (
                <Paper
                  key={idx}
                  withBorder
                  p="xs"
                  radius="md"
                  style={{ backgroundColor: '#ffffff', borderColor: '#dceee1' }}
                >
                  <Group justify="space-between" align="center" mb={4}>
                    <div>
                      <Text size="xs" fw={700} c="#174421">
                        {item.item.name}
                      </Text>
                      <Text size="11px" fw={600} c="#226135">
                        {formatPrice(item.item.price * item.quantity)} ({formatPrice(item.item.price)}/ly)
                      </Text>
                    </div>

                    {/* Quantity Controls */}
                    <Group gap={4} align="center">
                      <ActionIcon
                        size="sm"
                        variant="default"
                        onClick={() => handleUpdateManualQty(idx, -1)}
                      >
                        -
                      </ActionIcon>
                      <Text size="xs" fw={800} style={{ minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </Text>
                      <ActionIcon
                        size="sm"
                        variant="default"
                        onClick={() => handleUpdateManualQty(idx, 1)}
                      >
                        +
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="subtle"
                        onClick={() => handleUpdateManualQty(idx, -item.quantity)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  {/* Options: Ice & Sugar & Note */}
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={4} mt={4}>
                    <Select
                      comboboxProps={{ zIndex: 1800 }}
                      aria-label="Mức đá"
                      value={item.ice}
                      onChange={(value) => { if (value !== null) handleUpdateManualOption(idx, 'ice', value); }}
                      allowDeselect={false}
                      data={[
                        { value: '100% Đá', label: '100% Đá' },
                        { value: '50% Đá', label: '50% Đá' },
                        { value: 'Không Đá', label: 'Không Đá' },
                      ]}
                    />

                    <Select
                      comboboxProps={{ zIndex: 1800 }}
                      aria-label="Mức đường"
                      value={item.sugar}
                      onChange={(value) => { if (value !== null) handleUpdateManualOption(idx, 'sugar', value); }}
                      allowDeselect={false}
                      data={[
                        { value: '100% Đường', label: '100% Đường' },
                        { value: '70% Đường', label: '70% Đường' },
                        { value: '50% Đường', label: '50% Đường' },
                        { value: 'Không Đường', label: 'Không Đường' },
                      ]}
                    />

                    <input
                      type="text"
                      placeholder="Ghi chú (ít béo, nhiều kem...)"
                      value={item.note}
                      onChange={(e) => handleUpdateManualOption(idx, 'note', e.target.value)}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px solid #dceee1',
                        fontSize: '11px',
                        backgroundColor: '#fafcfb',
                        color: '#174421',
                        outline: 'none',
                      }}
                    />
                  </SimpleGrid>
                </Paper>
              ))}
            </Stack>
          )}
        </div>

        <Divider />

        {/* Total Amount & Submit Buttons */}
        <Group justify="space-between" align="center" wrap="wrap">
          <div>
            <Text size="xs" c="#546c5c">
              Tổng thanh toán:
            </Text>
            <Text fw={800} size="xl" c="#226135" style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
              {formatPrice(manualCart.reduce((s, it) => s + it.quantity * it.item.price, 0))}
            </Text>
          </div>

          <Group gap="xs">
            <Button variant="default" onClick={() => setManualOrderOpen(false)}>
              Hủy
            </Button>
            <Button
              color="bamboo"
              onClick={handleSaveManualOrder}
              loading={savingManualOrder}
              leftSection={<IconCheck size={18} />}
              style={{ fontWeight: 700 }}
            >
              Xác Nhận Tạo Đơn
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
