import React from 'react';
import {
  Group,
  Stack,
  Select,
  Text,
  Button,
  Badge,
  SimpleGrid,
  Divider,
  Paper,
  Tooltip,
  Skeleton,
  Pagination,
} from '@mantine/core';
import { IconReceipt, IconPlus, IconRefresh, IconCalendar, IconX } from '@tabler/icons-react';
import { type OrderHistoryCursor } from '../services/firebaseService';
import type { CustomerOrder, OrderStatus } from '../types/order';
import type { DateFilterPreset } from './AdminApp';
import { AdminOrderCard } from './AdminOrderCard';

interface AdminOrdersPanelProps {
  dateFilterLabel: string;
  ordersLoading: boolean;
  formatPrice: (val: number) => string;
  totalRevenueInPeriod: number;
  allPendingOrders: CustomerOrder[];
  pendingInPeriod: CustomerOrder[];
  allServedOrders: CustomerOrder[];
  servedInPeriod: CustomerOrder[];
  dateFilteredOrders: CustomerOrder[];
  completedInPeriod: CustomerOrder[];
  dateFilter: DateFilterPreset;
  setDateFilter: React.Dispatch<React.SetStateAction<DateFilterPreset>>;
  setCustomDate: React.Dispatch<React.SetStateAction<string>>;
  orderFilter: OrderStatus | 'all';
  setOrderFilter: React.Dispatch<React.SetStateAction<OrderStatus | "all">>;
  handleOpenManualOrder: () => void;
  refreshingOrders: boolean;
  handleManualRefreshOrders: () => void;
  liveUnavailable: boolean;
  historyError: boolean;
  historyCursor: OrderHistoryCursor | undefined;
  handleLoadOlderOrders: () => Promise<void>;
  customDate: string;
  totalOrdersInView: number;
  safePage: number;
  pageSize: number;
  totalPages: number;
  setOrderPage: React.Dispatch<React.SetStateAction<number>>;
  groupedOrders: { dateKey: string; dayLabel: string; formattedDate: string; isToday: boolean; isYesterday: boolean; orders: CustomerOrder[]; dayTotalRevenue: number; dayPendingCount: number; dayServedCount: number; dayCompletedCount: number; }[];
  formatTime: (ts: number) => string;
  handleStatusChange: (orderId: string, status: OrderStatus) => Promise<boolean>;
  setSelectedInvoice: React.Dispatch<React.SetStateAction<CustomerOrder | null>>;
  setQrModalOrder: React.Dispatch<React.SetStateAction<CustomerOrder | null>>;
  handleDeleteOrder: (orderId: string) => Promise<void>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
}

export function AdminOrdersPanel({
  dateFilterLabel,
  ordersLoading,
  formatPrice,
  totalRevenueInPeriod,
  allPendingOrders,
  pendingInPeriod,
  allServedOrders,
  servedInPeriod,
  dateFilteredOrders,
  completedInPeriod,
  dateFilter,
  setDateFilter,
  setCustomDate,
  orderFilter,
  setOrderFilter,
  handleOpenManualOrder,
  refreshingOrders,
  handleManualRefreshOrders,
  liveUnavailable,
  historyError,
  historyCursor,
  handleLoadOlderOrders,
  customDate,
  totalOrdersInView,
  safePage,
  pageSize,
  totalPages,
  setOrderPage,
  groupedOrders,
  formatTime,
  handleStatusChange,
  setSelectedInvoice,
  setQrModalOrder,
  handleDeleteOrder,
  setPageSize,
}: AdminOrdersPanelProps) {
  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
        {[
          { label: 'Doanh thu', value: formatPrice(totalRevenueInPeriod), detail: dateFilterLabel, tone: 'green' },
          { label: 'Chờ / đang soạn', value: pendingInPeriod.length, older: allPendingOrders.length - pendingInPeriod.length, tone: 'amber' },
          { label: 'Chờ thu tiền', value: servedInPeriod.length, older: allServedOrders.length - servedInPeriod.length, tone: 'blue' },
          { label: 'Đã thu tiền', value: completedInPeriod.length, tone: 'green' },
        ].map(({ label, value, detail, older = 0, tone }) => (
          <Paper key={label} className="admin-stat" data-tone={tone} p="md" withBorder>
            <Text size="sm" c="dimmed" fw={600}>{label}</Text>
            {ordersLoading ? <Skeleton height={28} width="55%" mt={4} /> : <Text className="admin-stat-value">{value}</Text>}
            {detail && <Text size="xs" c="dimmed">{detail}</Text>}
            {older > 0 && <Text size="xs" c="dimmed">+{older} đơn từ kỳ khác</Text>}
          </Paper>
        ))}
      </SimpleGrid>

      {/* Filter Controls: 2 Clean Dropdowns Tạo đơn tại quán + Làm mới */}
      <Paper withBorder p="xs" radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#dceee1' }}>
        <div className="admin-order-toolbar">
          {/* Dropdown 1: Lọc Theo Ngày */}
          <div>
            <Select
              aria-label="Phân loại theo ngày"
              value={dateFilter}
              onChange={(value) => {
                if (value === null) return;
                setDateFilter(value as DateFilterPreset);
                if (value !== 'custom') setCustomDate('');
              }}
              allowDeselect={false}
              data={[
                { value: 'today', label: 'Hôm Nay' },
                { value: 'yesterday', label: 'Hôm Qua' },
                { value: '7days', label: '7 Ngày Qua' },
                { value: 'month', label: 'Tháng Này' },
                { value: 'all', label: 'Tất Cả Lịch Sử' },
                { value: 'custom', label: 'Chọn Ngày Cụ Thể...' },
              ]}
            />
          </div>

          {/* Dropdown 2: Lọc Trạng Thái Đơn */}
          <div>
            <Select
              aria-label="Phân loại theo trạng thái"
              value={orderFilter}
              onChange={(value) => { if (value !== null) setOrderFilter(value as OrderStatus | 'all'); }}
              allowDeselect={false}
              data={[
                { value: 'all', label: `Tất Cả Trạng Thái (${dateFilteredOrders.length})` },
                { value: 'pending', label: `Chờ / Đang Soạn (${pendingInPeriod.length})` },
                { value: 'served', label: `Chờ Thu Tiền (${servedInPeriod.length})` },
                { value: 'completed', label: `Đã Thu Tiền (${completedInPeriod.length})` },
              ]}
            />
          </div>

          {/* Action Buttons: Tạo Đơn Tại Quán & Làm mới */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              color="bamboo"
              size="sm"
              leftSection={<IconPlus size={16} />}
              onClick={handleOpenManualOrder}
              style={{ flex: 1, height: '38px', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Tạo đơn tại quán
            </Button>

            <Tooltip label="Tải lại danh sách đơn hàng từ Firestore">
              <Button
                size="sm"
                variant="light"
                color="bamboo"
                leftSection={<IconRefresh size={15} />}
                loading={refreshingOrders}
                onClick={handleManualRefreshOrders}
                style={{ height: '38px', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Làm mới
              </Button>
            </Tooltip>
          </div>
        </div>

        {liveUnavailable && <Text role="status" size="sm" c="orange.9">Đang kết nối lại danh sách đơn đang xử lý.</Text>}
        {historyError && <Text role="alert" size="sm" c="red.8">Chưa tải được lịch sử đơn. Hãy tải lại.</Text>}
        {historyCursor && (
          <Group mt="xs" justify="space-between">
            <Text size="xs" c="dimmed">Báo cáo đang tính trên các đơn đã tải.</Text>
            <Button size="xs" variant="light" loading={refreshingOrders} onClick={handleLoadOlderOrders}>
              Tải thêm lịch sử
            </Button>
          </Group>
        )}

        {/* Custom Date Picker (when custom is selected) */}
        {dateFilter === 'custom' && (
          <Group gap="xs" mt="xs" align="center">
            <Text size="xs" fw={700} c="#174421">
              Chọn Ngày:
            </Text>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1.5px solid #226135',
                backgroundColor: '#eef7f1',
                color: '#174421',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                height: '34px',
              }}
            />
            <Button
              size="xs"
              variant="subtle"
              color="red"
              leftSection={<IconX size={14} />}
              onClick={() => {
                setDateFilter('today');
                setCustomDate('');
              }}
            >
              Hủy chọn ngày
            </Button>
          </Group>
        )}
      </Paper>

      {/* Grouped Orders List By Date */}
      {ordersLoading || (refreshingOrders && groupedOrders.length === 0) ? (
        <Stack gap="sm">
          {[1, 2, 3].map((i) => (
            <Paper key={i} withBorder p="md" radius="md" style={{ backgroundColor: '#ffffff', borderColor: '#dceee1' }}>
              <Group justify="space-between" mb="sm">
                <Skeleton height={20} width={110} radius="sm" />
                <Skeleton height={16} width={80} radius="sm" />
              </Group>
              <Skeleton height={14} width="70%" radius="sm" mb={8} />
              <Skeleton height={14} width="45%" radius="sm" mb="md" />
              <Skeleton height={42} radius="md" />
            </Paper>
          ))}
        </Stack>
      ) : groupedOrders.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center" style={{ backgroundColor: '#ffffff', borderColor: '#dceee1' }}>
          <IconReceipt size={48} color="#badcc3" stroke={1.2} style={{ margin: '0 auto 8px auto', display: 'block' }} />
          <Text fw={700} size="sm" c="#174421" mb={4}>
            Chưa có đơn trong khoảng này
          </Text>
          <Text size="xs" c="#607667" mb="md">
            Đổi ngày hoặc trạng thái để xem các đơn khác.
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
            Xem lịch sử đơn
          </Button>
        </Paper>
      ) : (
        <Stack gap="lg">
          {groupedOrders.map((group) => (
            <div key={group.dateKey}>
              {/* Slim Date Separator ONLY when viewing all history */}
              {dateFilter === 'all' && (
                <Divider
                  my="sm"
                  label={
                    <Group gap={6} align="center">
                      <IconCalendar size={13} color="#226135" />
                      <Text size="xs" fw={700} c="#174421">
                        {group.dayLabel} ({group.formattedDate})
                      </Text>
                      <Badge size="xs" variant="light" color="teal">
                        {group.orders.length} đơn
                      </Badge>
                      {group.dayTotalRevenue > 0 && (
                        <Badge size="xs" variant="outline" color="green">
                          {formatPrice(group.dayTotalRevenue)}
                        </Badge>
                      )}
                    </Group>
                  }
                  labelPosition="left"
                />
              )}

              {/* List of Orders in this Day Group */}
              <Stack gap="sm">
                {group.orders.map((order) => (
                  <AdminOrderCard
                    key={order.id}
                    order={order}
                    formatPrice={formatPrice}
                    formatTime={formatTime}
                    handleStatusChange={handleStatusChange}
                    setSelectedInvoice={setSelectedInvoice}
                    setQrModalOrder={setQrModalOrder}
                    handleDeleteOrder={handleDeleteOrder}
                  />
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
      )}

      {/* Bottom Full Pagination Controls */}
      {!ordersLoading && totalOrdersInView > 0 && (
        <Paper
          withBorder
          p="xs"
          radius="md"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#dceee1',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Group gap="xs" align="center">
              <Text size="xs" c="#546c5c">
                Hiển thị <b>{(safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, totalOrdersInView)}</b> / <b>{totalOrdersInView}</b> đơn
              </Text>
              <Select
                aria-label="Số đơn mỗi trang"
                value={String(pageSize)}
                onChange={(value) => {
                  if (value === null) return;
                  setPageSize(Number(value));
                  setOrderPage(1);
                }}
                allowDeselect={false}
                data={[
                  { value: '10', label: '10 đơn / trang' },
                  { value: '20', label: '20 đơn / trang' },
                  { value: '50', label: '50 đơn / trang' },
                ]}
              />
            </Group>

            {totalPages > 1 && (
              <Pagination
                total={totalPages}
                value={safePage}
                onChange={setOrderPage}
                color="bamboo"
                size="sm"
                radius="md"
              />
            )}
          </Group>
        </Paper>
      )}
    </Stack>
  );
}
