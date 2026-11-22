import { doc, type Firestore, type Transaction } from 'firebase/firestore';
import type { OrderItemDetail } from '../types/order';

export class OrderPricingError extends Error {}

export async function priceOrderItems(db: Firestore, transaction: Transaction, input: OrderItemDetail[]) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 40 || input.some((line) =>
    !line || typeof line.id !== 'string' || !/^[\w-]{1,128}$/.test(line.id)
    || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 99)) {
    throw new OrderPricingError('Kiểm tra lại món và số lượng trong đơn.');
  }

  const ids = [...new Set(input.map(({ id }) => id))];
  const snapshots = await Promise.all(ids.map((id) => transaction.get(doc(db, 'products', id))));
  const products = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot.data()]));
  const items = input.map(({ id, quantity, ice, sugar, note }) => {
    const product = products.get(id);
    if (typeof product?.name !== 'string' || !Number.isSafeInteger(product.price) || product.price < 0) {
      throw new OrderPricingError('Có món đã ngừng bán. Vui lòng kiểm tra lại đơn.');
    }

    const option = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
    return {
      id,
      name: product.name,
      quantity,
      price: product.price as number,
      totalPrice: quantity * product.price,
      ice: product.allowCustomization === false ? '' : option(ice, 30),
      sugar: product.allowCustomization === false ? '' : option(sugar, 30),
      note: option(note, 300),
    };
  });
  const totalAmount = items.reduce((total, item) => total + item.totalPrice, 0);
  if (!Number.isSafeInteger(totalAmount)) throw new OrderPricingError('Tổng tiền vượt giới hạn.');
  return { items, totalAmount };
}
