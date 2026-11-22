export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';

export interface OrderItemDetail {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  ice?: string;
  sugar?: string;
  note?: string;
}

export interface CustomerOrder {
  id: string;
  orderCode: string;
  items: OrderItemDetail[];
  totalAmount: number;
  paymentMethod: 'vietqr' | 'cash';
  status: OrderStatus;
  note?: string;
  partySize?: number;
  priceVerified?: boolean;
  customerPaid?: boolean;
  createdAt: number;
  updatedAt?: number;
}
