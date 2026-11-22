import type { CartItem, PaymentMethod } from '../types/cart';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { customerAuth, customerDb, ensureOrderSession } from '../lib/firebase';
import { OrderPricingError, priceOrderItems } from './orderPricing';

export function buildCheckout(items: CartItem[], paymentMethod: PaymentMethod, note: string, partySize?: number) {
  return {
    items: items.map(({ item, quantity, unitPrice, ice, sugar, note }) => ({
      id: item.id,
      quantity,
      expectedPrice: unitPrice,
      ice: ice ?? '',
      sugar: sugar ?? '',
      note: note?.trim() ?? '',
    })),
    paymentMethod,
    note: note.trim(),
    ...(partySize === undefined ? {} : { partySize }),
  };
}

type Checkout = ReturnType<typeof buildCheckout>;

export interface CheckoutAttempt {
  requestId: string;
  checkout: Checkout;
}

export class CheckoutNotSent extends Error {}
export { OrderPricingError };

function orderSessionMessage(error: unknown): string {
  const code = error instanceof Error && 'code' in error ? error.code : undefined;
  switch (code) {
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
    case 'auth/configuration-not-found':
    case 'auth/app-not-authorized':
    case 'auth/invalid-api-key':
      console.warn('Firebase checkout: không thể tạo phiên khách', { code });
      return 'Tính năng đặt món online đang tạm ngừng. Giỏ hàng vẫn được lưu. Bạn có thể gọi quán để đặt món.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử gửi nhiều lần. Hãy chờ một chút rồi thử lại hoặc gọi quán.';
    case 'auth/network-request-failed':
      return 'Chưa kết nối được để gửi đơn. Hãy kiểm tra mạng rồi thử lại.';
    default:
      console.warn('Firebase checkout: không thể chuẩn bị gửi đơn', { code });
      return 'Chưa gửi được đơn. Giỏ hàng vẫn được lưu. Hãy thử lại hoặc gọi quán.';
  }
}

async function hash(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function submitCheckout({ requestId, checkout }: CheckoutAttempt) {
  try {
    await ensureOrderSession();
  } catch (error) {
    throw new CheckoutNotSent(orderSessionMessage(error), { cause: error });
  }

  const ownerUid = customerAuth.currentUser?.uid;
  if (!ownerUid) throw new CheckoutNotSent('Chưa tạo được phiên đặt món. Hãy thử lại.');
  const [id, fingerprint] = await Promise.all([hash([ownerUid, requestId]), hash(checkout)]);
  const orderCode = `XP-${id.slice(0, 8).toUpperCase()}`;
  const orderRef = doc(customerDb, 'orders', id);
  const receiptRef = doc(customerDb, 'checkoutReceipts', id);

  return runTransaction(customerDb, async (transaction) => {
    const receipt = await transaction.get(receiptRef);
    if (receipt.exists()) {
      return { id, matchesCheckout: receipt.get('fingerprint') === fingerprint };
    }

    // A previous callable checkout may already have used this request ID.
    const previousOrder = await transaction.get(orderRef);
    if (previousOrder.exists()) return { id, matchesCheckout: false };

    const priced = await priceOrderItems(customerDb, transaction, checkout.items.map((line) => ({
      ...line,
      name: '',
      price: line.expectedPrice,
      totalPrice: line.quantity * line.expectedPrice,
    })));
    if (priced.items.some((line, index) => line.price !== checkout.items[index].expectedPrice)) {
      throw new OrderPricingError('Giá món đã thay đổi. Hãy cập nhật giỏ hàng.');
    }

    transaction.set(orderRef, {
      ...priced,
      ownerUid,
      orderCode,
      paymentMethod: checkout.paymentMethod,
      note: checkout.note,
      ...(checkout.partySize === undefined ? {} : { partySize: checkout.partySize }),
      status: 'pending',
      customerPaid: false,
      priceVerified: false,
      createdAt: Date.now(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(receiptRef, { ownerUid, fingerprint });
    return { id, matchesCheckout: true };
  });
}
