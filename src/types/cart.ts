import type { MenuItem } from '../data/menuData';

export interface CartItem {
  cartId: string;
  item: MenuItem;
  quantity: number;
  ice?: string;
  sugar?: string;
  note?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderType = 'dine-in' | 'takeaway';

export interface OrderCustomerInfo {
  customerName: string;
  phone: string;
  tableNumber: string;
  orderType: OrderType;
  generalNote: string;
}
