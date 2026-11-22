import React, { useState } from 'react';
import {
  Group,
  Stack,
  Select,
  Switch,
  Text,
  Button,
  Badge,
  TextInput,
  ActionIcon,
  Table,
  Paper,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconSearch } from '@tabler/icons-react';
import type { MenuItem } from '../data/menuData';
import { notifications } from '@mantine/notifications';
import { updateProduct } from '../services/firebaseService';
import { CATEGORIES } from '../data/menuData';

interface AdminProductsPanelProps {
  productSearch: string;
  setProductSearch: React.Dispatch<React.SetStateAction<string>>;
  productCategoryFilter: string;
  setProductCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  products: MenuItem[];
  handleOpenCreateProduct: () => void;
  handleResetProducts: () => Promise<void>;
  filteredProducts: MenuItem[];
  formatPrice: (val: number) => string;
  handleOpenEditProduct: (item: MenuItem) => void;
  handleDeleteProduct: (item: MenuItem) => Promise<void>;
}

export function AdminProductsPanel({
  productSearch,
  setProductSearch,
  productCategoryFilter,
  setProductCategoryFilter,
  products,
  handleOpenCreateProduct,
  handleResetProducts,
  filteredProducts,
  formatPrice,
  handleOpenEditProduct,
  handleDeleteProduct,
}: AdminProductsPanelProps) {
  const [updatingStock, setUpdatingStock] = useState<Set<string>>(new Set());

  const setAvailability = async (product: MenuItem, available: boolean) => {
    setUpdatingStock((previous) => new Set(previous).add(product.id));
    try {
      await updateProduct(product.id, { available });
    } catch {
      notifications.show({ color: 'red', message: `Chưa đổi được tình trạng của ${product.name}. Hãy thử lại.` });
    } finally {
      setUpdatingStock((previous) => {
        const next = new Set(previous);
        next.delete(product.id);
        return next;
      });
    }
  };

  return (
    <Stack gap="md">
      {/* Controls Bar - Responsive Mobile Layout */}
      <Paper withBorder p={{ base: 'xs', sm: 'md' }} radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#dceee1' }}>
        <div className="admin-product-toolbar">
          <div className="admin-product-filters">
            <TextInput
              aria-label="Tìm món"
              placeholder="Tìm theo tên món"
              leftSection={<IconSearch size={16} />}
              value={productSearch}
              onChange={(e) => setProductSearch(e.currentTarget.value)}
              size="sm"
              style={{ width: '100%' }}
            />

            {/* Category Filter Select */}
            <Select
              aria-label="Danh mục thực đơn"
              value={productCategoryFilter}
              onChange={(value) => { if (value !== null) setProductCategoryFilter(value); }}
              allowDeselect={false}
              data={[
                { value: 'all', label: `Tất Cả Danh Mục (${products.length})` },
                ...CATEGORIES.filter(({ id }) => id !== 'all' && id !== 'best-seller').map(({ id, label }) => ({ value: id, label })),
              ]}
            />
          </div>

          <Group gap="xs" wrap="wrap">
            <Button
              size="sm"
              color="bamboo"
              variant="filled"
              leftSection={<IconPlus size={16} />}
              onClick={handleOpenCreateProduct}
              style={{ fontWeight: 700 }}
            >
              Thêm món
            </Button>

            <Button
              size="sm"
              variant="outline"
              color="gray"
              leftSection={<IconRefresh size={15} />}
              onClick={handleResetProducts}
            >
              Khôi phục món mặc định
            </Button>
          </Group>
        </div>
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
              <Table.Th>Tình trạng</Table.Th>
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
                  <Switch
                    aria-label={`Còn hàng: ${p.name}`}
                    label={p.available === false ? 'Hết hàng' : 'Còn hàng'}
                    checked={p.available !== false}
                    disabled={updatingStock.has(p.id)}
                    onChange={(event) => void setAvailability(p, event.currentTarget.checked)}
                  />
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
  );
}
