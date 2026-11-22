import type { OrderItemDetail } from '../types/order';
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../theme/mantineTheme';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { AboutSection } from './AboutSection';
import { MenuSection } from './MenuSection';
import { PaymentSection } from './PaymentSection';
import { LocationSection } from './LocationSection';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { scrollToOrderStatus } from './OrderStatusPanel';
import { FloatingActions } from './FloatingActions';
import type { CartItem } from '../types/cart';
import { MENU_ITEMS, type MenuItem } from '../data/menuData';
import { subscribeProducts } from '../services/firebaseService';

const OriginalMenuModal = lazy(() => import('./OriginalMenuModal').then((module) => ({ default: module.OriginalMenuModal })));
const WebsiteQrModal = lazy(() => import('./WebsiteQrModal').then((module) => ({ default: module.WebsiteQrModal })));

type CartSelection = Pick<CartItem, 'item' | 'quantity' | 'ice' | 'sugar' | 'note'>;

function mergeCartItems(previous: CartItem[], selections: CartSelection[]): CartItem[] {
  const cart = new Map(previous.map((line) => [line.cartId, line]));
  for (const selection of selections) {
    const { item, ice, sugar, note } = selection;
    const cartId = `${item.id}_${ice || 'default'}_${sugar || 'default'}_${note || ''}`;
    const quantity = Math.min(99, (cart.get(cartId)?.quantity ?? 0) + selection.quantity);
    cart.set(cartId, { ...selection, cartId, quantity, unitPrice: item.price, totalPrice: item.price * quantity });
  }
  return [...cart.values()];
}

export const CoffeeHouseApp: React.FC = () => {
  const [products, setProducts] = useState<MenuItem[]>(MENU_ITEMS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartRestored, setCartRestored] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(false);
  const [showOrderRequested, setShowOrderRequested] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [originalMenuModalOpen, setOriginalMenuModalOpen] = useState(false);
  const [websiteQrModalOpen, setWebsiteQrModalOpen] = useState(false);

  useEffect(() => subscribeProducts(setProducts), []);

  // Load cart from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xuan_pham_coffee_cart');
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed.filter((line) => line && typeof line.cartId === 'string'
            && typeof line.item?.id === 'string' && typeof line.item.name === 'string'
            && Number.isSafeInteger(line.quantity) && line.quantity > 0
            && Number.isSafeInteger(line.unitPrice) && line.unitPrice >= 0)
            .map((line) => ({ ...line, totalPrice: line.unitPrice * line.quantity })));
        }
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    } finally {
      setCartRestored(true);
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (!cartRestored) return;
    try {
      localStorage.setItem('xuan_pham_coffee_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cartItems, cartRestored]);

  const soldOutProductIds = new Set(products.filter(({ available }) => available === false).map(({ id }) => id));

  const handleAddToCart = (item: MenuItem, quantity: number, ice?: string, sugar?: string, note?: string) => {
    if (soldOutProductIds.has(item.id)) return;
    setCartItems((previous) => mergeCartItems(previous, [{ item, quantity, ice, sugar, note }]));
  };

  const handleReorder = (lines: OrderItemDetail[]) => {
    const catalog = new Map(products.map((item) => [item.id, item]));
    const available = lines.flatMap(({ id, quantity, ice, sugar, note }) => {
      const item = catalog.get(id);
      return item && item.available !== false ? [{ item, quantity, ice: item.allowCustomization ? ice : undefined, sugar: item.allowCustomization ? sugar : undefined, note }] : [];
    });

    if (available.length) setCartItems((previous) => mergeCartItems(previous, available));
    return { added: available.length, unavailable: lines.length - available.length };
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = Math.min(99, item.quantity + delta);
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const handleRemoveItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const handleRefreshCart = () => {
    const menu = new Map(products.map((product) => [product.id, product]));
    setCartItems((previous) => previous.flatMap((line) => {
      const item = menu.get(line.item.id);
      if (!item || item.available === false) return [];
      return [{ ...line, item, unitPrice: item.price, totalPrice: item.price * line.quantity }];
    }));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalItemCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalAmount = cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

  const handleToggleCart = () => {
    setCartDrawerOpen((prev) => !prev);
  };

  const openCart = () => setCartDrawerOpen(true);

  const showOrder = useCallback(() => {
    setCartDrawerOpen(false);
    setShowOrderRequested(true);
  }, []);

  useEffect(() => {
    if (!showOrderRequested || !trackingOrder || cartDrawerOpen) return;
    const frame = requestAnimationFrame(() => {
      scrollToOrderStatus();
      setShowOrderRequested(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [showOrderRequested, trackingOrder, cartDrawerOpen]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" zIndex={2600} autoClose={3000} />
      <div className={trackingOrder || totalItemCount > 0 ? 'mobile-bottom-safe' : undefined} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Sticky Header */}
        <Navbar
          trackingOrder={trackingOrder}
          onShowOrder={showOrder}
          cartItemCount={totalItemCount}
          onOpenCart={openCart}
          onToggleCart={handleToggleCart}
          isCartOpen={cartDrawerOpen}
          onOpenOriginalMenu={() => setOriginalMenuModalOpen(true)}
          onOpenWebsiteQr={() => setWebsiteQrModalOpen(true)}
        />

        {/* Main Content Sections */}
        <main style={{ flex: 1 }}>
          <Hero onOpenOriginalMenu={() => setOriginalMenuModalOpen(true)} />
          <CartDrawer
            opened={cartDrawerOpen}
            onClose={() => setCartDrawerOpen(false)}
            items={cartItems}
            soldOutProductIds={soldOutProductIds}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onRefreshCart={handleRefreshCart}
            onReorder={handleReorder}
            onTrackingChange={setTrackingOrder}
            onShowOrder={showOrder}
            onOpenCart={openCart}
          />
          <MenuSection onAddToCart={handleAddToCart} items={products} interactive={cartRestored} />
          <AboutSection />
          <PaymentSection />
          <LocationSection />
        </main>

        {/* Footer */}
        <Footer />

        <Suspense fallback={null}>
          {originalMenuModalOpen && <OriginalMenuModal opened onClose={() => setOriginalMenuModalOpen(false)} />}
          {websiteQrModalOpen && <WebsiteQrModal opened onClose={() => setWebsiteQrModalOpen(false)} />}
        </Suspense>

        {/* Floating Action Buttons */}
        <FloatingActions
          trackingOrder={trackingOrder && totalItemCount === 0}
          cartItemCount={totalItemCount}
          cartTotalAmount={totalAmount}
          onOpenCart={openCart}
          onToggleCart={trackingOrder && totalItemCount === 0 ? showOrder : handleToggleCart}
          isCartOpen={cartDrawerOpen}
        />
      </div>
    </MantineProvider>
  );
};
