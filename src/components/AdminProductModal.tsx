import React from 'react';
import {
  Group,
  Stack,
  Select,
  Text,
  Button,
  TextInput,
  NumberInput,
  Switch,
  Paper,
  Modal,
} from '@mantine/core';
import type { MenuItem, MenuCategory } from '../data/menuData';
import { CATEGORIES } from '../data/menuData';

interface AdminProductModalProps {
  formOpen: boolean;
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingProduct: MenuItem | null;
  formName: string;
  setFormName: React.Dispatch<React.SetStateAction<string>>;
  formCategory: MenuCategory;
  setFormCategory: React.Dispatch<React.SetStateAction<MenuCategory>>;
  formPrice: number;
  setFormPrice: React.Dispatch<React.SetStateAction<number>>;
  formImage: string;
  setFormImage: React.Dispatch<React.SetStateAction<string>>;
  formBadge: string;
  setFormBadge: React.Dispatch<React.SetStateAction<string>>;
  formAllowIce: boolean;
  setFormAllowIce: React.Dispatch<React.SetStateAction<boolean>>;
  formAllowSugar: boolean;
  setFormAllowSugar: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveProduct: () => Promise<void>;
  savingProduct: boolean;
}

export function AdminProductModal({
  formOpen,
  setFormOpen,
  editingProduct,
  formName,
  setFormName,
  formCategory,
  setFormCategory,
  formPrice,
  setFormPrice,
  formImage,
  setFormImage,
  formBadge,
  setFormBadge,
  formAllowIce,
  setFormAllowIce,
  formAllowSugar,
  setFormAllowSugar,
  handleSaveProduct,
  savingProduct,
}: AdminProductModalProps) {
  return (
    <Modal
      opened={formOpen}
      onClose={() => setFormOpen(false)}
      title={
        <Text fw={800} size="md" c="#174421" style={{ fontFamily: 'var(--font-heading)' }}>
          {editingProduct ? `Chỉnh Sửa Món: ${editingProduct.name}` : 'Thêm Món Nước Mới'}
        </Text>
      }
      closeButtonProps={{ 'aria-label': 'Đóng form món' }}
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
          <Select
            comboboxProps={{ zIndex: 1800 }}
            label="Danh mục món"
            withAsterisk
            value={formCategory}
            onChange={(value) => { if (value !== null) setFormCategory(value as MenuCategory); }}
            allowDeselect={false}
            data={[
              ...CATEGORIES.filter(({ id }) => id !== 'all' && id !== 'best-seller').map(({ id, label }) => ({ value: id, label })),
            ]}
          />
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
          <Select
            comboboxProps={{ zIndex: 1800 }}
            label="Nhãn món"
            value={formBadge}
            onChange={(value) => { if (value !== null) setFormBadge(value); }}
            allowDeselect={false}
            data={[
              { value: 'none', label: 'Không có nhãn' },
              { value: 'Best Seller', label: 'Best Seller (Bán chạy nhất)' },
              { value: 'Mới', label: 'Món Mới' },
              { value: 'Thanh Mát', label: 'Thanh Mát (Giải nhiệt)' },
              { value: 'Đậm Đà', label: 'Đậm Đà' },
              { value: 'Ưu Đãi', label: 'Ưu Đãi (Giá tốt)' },
            ]}
          />
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
  );
}
