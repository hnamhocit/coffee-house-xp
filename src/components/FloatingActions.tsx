import React, { useState, useEffect } from 'react';
import { Button, Badge, ActionIcon, Tooltip, Stack, Group, Text } from '@mantine/core';
import { IconShoppingCart, IconPhone, IconArrowUp, IconArrowRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { siteConfig } from '../config/siteConfig';

interface FloatingActionsProps {
  cartItemCount: number;
  cartTotalAmount: number;
  onOpenCart: () => void;
  onToggleCart?: () => void;
  isCartOpen?: boolean;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  cartItemCount,
  cartTotalAmount,
  onOpenCart,
  onToggleCart,
  isCartOpen = false,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // When cart drawer is open on mobile/desktop, hide all floating buttons so they don't cover the drawer
  if (isCartOpen) {
    return null;
  }

  const handleCartClick = () => {
    if (onToggleCart) {
      onToggleCart();
    } else {
      onOpenCart();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatShortPrice = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const handleFacebookClick = (e: React.MouseEvent) => {
    if (!siteConfig.facebookUrl || siteConfig.facebookUrl === '#' || siteConfig.facebookUrl.trim() === '') {
      e.preventDefault();
      notifications.show({
        title: 'Facebook Quán',
        message: 'Trang Facebook đang được cập nhật. Bạn có thể liên hệ trực tiếp qua Zalo hoặc Hotline: ' + siteConfig.hotlineDisplay,
        color: 'bamboo',
      });
    }
  };

  return (
    <>
      {/* 1. MOBILE BOTTOM FLOATING CART BAR (HIGH-CONVERSION APP-LIKE EXPERIENCE) - ONLY ON MOBILE */}
      {cartItemCount > 0 && (
        <div
          onClick={handleCartClick}
          className="mobile-cart-bar"
          style={{
            position: 'fixed',
            bottom: '14px',
            left: '12px',
            right: '12px',
            zIndex: 1000,
            backgroundColor: '#226135',
            borderRadius: '50px',
            padding: '10px 18px',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff',
            boxShadow: '0 8px 28px rgba(20, 60, 32, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <div style={{ position: 'relative' }}>
              <IconShoppingCart size={22} />
              <Badge
                size="xs"
                color="red"
                circle
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  fontWeight: 800,
                  border: '1.5px solid white',
                }}
              >
                {cartItemCount}
              </Badge>
            </div>
            <div>
              <Text fw={800} size="sm" style={{ lineHeight: 1.1 }}>
                {formatShortPrice(cartTotalAmount)}
              </Text>
              <Text size="11px" c="#c6e8cc">
                {cartItemCount} món trong giỏ
              </Text>
            </div>
          </Group>

          <Group gap={6} wrap="nowrap">
            <Text fw={700} size="sm">
              Xem & Đặt Món
            </Text>
            <IconArrowRight size={18} />
          </Group>
        </div>
      )}

      {/* 2. FLOATING CONTACT ACTIONS (ADAPTIVE DESKTOP & MOBILE) */}
      <div
        className={`floating-contact-actions ${cartItemCount > 0 ? 'has-cart-items' : ''}`}
        style={{
          position: 'fixed',
          right: '16px',
          zIndex: 998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          transition: 'bottom 0.2s ease',
        }}
      >
        {/* Desktop-only floating cart pill (When cart has items) */}
        {cartItemCount > 0 && (
          <Button
            onClick={handleCartClick}
            size="md"
            radius="xl"
            color="bamboo"
            variant="filled"
            visibleFrom="sm"
            leftSection={<IconShoppingCart size={20} />}
            style={{
              backgroundColor: '#226135',
              boxShadow: '0 6px 20px rgba(34, 97, 53, 0.45)',
              border: '2px solid #ffffff',
              fontWeight: 700,
              padding: '0 16px',
            }}
          >
            <span>Giỏ Hàng</span>
            <Badge size="sm" color="red" variant="filled" ml="xs" style={{ fontWeight: 800 }}>
              {cartItemCount}
            </Badge>
            <span style={{ marginLeft: 6, opacity: 0.9 }}>
              • {formatShortPrice(cartTotalAmount)}
            </span>
          </Button>
        )}

        {/* Scroll To Top Button */}
        {showScrollTop && (
          <Tooltip label="Cuộn lên đầu trang" position="left" withArrow>
            <ActionIcon
              onClick={scrollToTop}
              size={40}
              radius="xl"
              aria-label="Lên đầu trang"
              style={{
                backgroundColor: '#ffffff',
                color: '#226135',
                border: '1.5px solid #b8d7be',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#226135';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#226135';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <IconArrowUp size={20} stroke={2.5} />
            </ActionIcon>
          </Tooltip>
        )}

        {/* Desktop-only Facebook Button */}
        <Tooltip label="Ghé Fanpage Facebook Quán" position="left" withArrow>
          <a
            href={siteConfig.facebookUrl || '#'}
            target={siteConfig.facebookUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={handleFacebookClick}
            aria-label="Facebook quán"
            className="floating-fb-btn"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              overflow: 'hidden',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src="/images/facebook-logo.png"
              alt="Facebook chính thức"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </a>
        </Tooltip>

        {/* Official Zalo Logo Button */}
        <Tooltip label={`Nhắn Zalo Quán: ${siteConfig.hotlineDisplay}`} position="left" withArrow>
          <a
            href={`https://zalo.me/${siteConfig.zalo}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nhắn Zalo quán"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#0068ff',
              boxShadow: '0 4px 14px rgba(0, 104, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              overflow: 'hidden',
              padding: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src="/images/zalo-logo.svg"
              alt="Zalo chính thức"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </a>
        </Tooltip>

        {/* Phone Call Button */}
        <Tooltip label={`Gọi Hotline: ${siteConfig.hotlineDisplay}`} position="left" withArrow>
          <a
            href={`tel:${siteConfig.hotline}`}
            aria-label="Gọi hotline quán"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#226135',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(34, 97, 53, 0.45)',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <IconPhone size={21} />
          </a>
        </Tooltip>
      </div>
    </>
  );
};
