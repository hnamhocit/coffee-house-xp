import React, { useState, useEffect } from 'react';
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
import { OriginalMenuModal } from './OriginalMenuModal';
import { FloatingActions } from './FloatingActions';
import { WebsiteQrModal } from './WebsiteQrModal';
import type { CartItem } from '../types/cart';
import { MENU_ITEMS, type MenuItem } from '../data/menuData';
import { subscribeProducts } from '../services/firebaseService';

export const CoffeeHouseApp: React.FC = () => {
  const [products, setProducts] = useState<MenuItem[]>(MENU_ITEMS);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [originalMenuModalOpen, setOriginalMenuModalOpen] = useState(false);
  const [websiteQrModalOpen, setWebsiteQrModalOpen] = useState(false);

  // Subscribe to real-time products from Firestore (or fallback to MENU_ITEMS)
  useEffect(() => {
    const unsubscribe = subscribeProducts((realtimeProducts) => {
      setProducts(realtimeProducts);
      setProductsLoading(false);
    });
    const timer = setTimeout(() => setProductsLoading(false), 600);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Load cart from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xuan_pham_coffee_cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('xuan_pham_coffee_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cartItems]);

  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    ice?: string,
    sugar?: string,
    note?: string
  ) => {
    setCartItems((prev) => {
      // Create a unique key based on item id and customizations
      const optionsKey = `${item.id}_${ice || 'default'}_${sugar || 'default'}_${note || ''}`;
      const existingIndex = prev.findIndex((c) => c.cartId === optionsKey);

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * item.price,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          cartId: optionsKey,
          item,
          quantity,
          ice,
          sugar,
          note,
          unitPrice: item.price,
          totalPrice: item.price * quantity,
        };
        return [...prev, newItem];
      }
    });
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
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

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalItemCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalAmount = cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

  const handleToggleCart = () => {
    setCartDrawerOpen((prev) => !prev);
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" zIndex={2000} autoClose={3000} />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Sticky Header */}
        <Navbar
          cartItemCount={totalItemCount}
          onOpenCart={() => setCartDrawerOpen(true)}
          onToggleCart={handleToggleCart}
          isCartOpen={cartDrawerOpen}
          onOpenOriginalMenu={() => setOriginalMenuModalOpen(true)}
          onOpenWebsiteQr={() => setWebsiteQrModalOpen(true)}
        />

        {/* Main Content Sections */}
        <main style={{ flex: 1 }}>
          <Hero onOpenOriginalMenu={() => setOriginalMenuModalOpen(true)} />
          <MenuSection onAddToCart={handleAddToCart} items={products} loading={productsLoading} />
          <AboutSection />
          <PaymentSection />
          <LocationSection />
        </main>

        {/* Footer */}
        <Footer />

        {/* Cart Drawer */}
        <CartDrawer
          opened={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
        />

        {/* Original Printed Menu Modal */}
        <OriginalMenuModal
          opened={originalMenuModalOpen}
          onClose={() => setOriginalMenuModalOpen(false)}
        />

        {/* Website Standee QR Modal */}
        <WebsiteQrModal
          opened={websiteQrModalOpen}
          onClose={() => setWebsiteQrModalOpen(false)}
        />

        {/* Floating Action Buttons */}
        <FloatingActions
          cartItemCount={totalItemCount}
          cartTotalAmount={totalAmount}
          onOpenCart={() => setCartDrawerOpen(true)}
          onToggleCart={handleToggleCart}
          isCartOpen={cartDrawerOpen}
        />
      </div>
    </MantineProvider>
  );
};
