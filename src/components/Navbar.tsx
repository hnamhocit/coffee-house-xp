import React, { useState } from 'react';
import {
  Container,
  Group,
  Button,
  Badge,
  Text,
  ActionIcon,
  Drawer,
  Stack,
  Divider,
  Indicator,
  Tooltip,
} from '@mantine/core';
import {
  IconShoppingCart,
  IconMenu2,
  IconX,
  IconPlant,
  IconSettings,
  IconQrcode,
} from '@tabler/icons-react';
import { siteConfig } from '../config/siteConfig';

interface NavbarProps {
  cartItemCount: number;
  onOpenCart?: () => void;
  onToggleCart: () => void;
  isCartOpen?: boolean;
  onOpenOriginalMenu: () => void;
  onOpenAdmin?: () => void;
  onOpenWebsiteQr?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItemCount,
  onOpenCart,
  onToggleCart,
  isCartOpen = false,
  onOpenOriginalMenu,
  onOpenAdmin,
  onOpenWebsiteQr,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCartClick = () => {
    if (onToggleCart) {
      onToggleCart();
    } else if (onOpenCart) {
      onOpenCart();
    }
  };

  const navLinks = [
    { label: 'Thực Đơn', href: '#thuc-don' },
    { label: 'Không Gian Quán', href: '#khong-gian' },
    { label: 'Thanh Toán VietQR', href: '#thanh-toan' },
    { label: 'Vị Trí & Chỉ Đường', href: '#dia-chi' },
  ];

  return (
    <header
      className="app-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e4eee5',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Container size="lg" style={{ width: '100%' }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          {/* Clean Logo without redundant badges, no border, no shadow */}
          <a
            href="#top"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'inherit',
              flexShrink: 0,
              maxWidth: 'calc(100% - 100px)',
            }}
          >
            <img
              src="/images/logo.png"
              alt="Logo Cà Phê Vườn Tre Xuân Phạm"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: 'none',
                boxShadow: 'none',
              }}
            />

            <div style={{ overflow: 'hidden' }}>
              <Text
                fw={800}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#14281b',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(0.92rem, 3.6vw, 1.05rem)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                Xuân Phạm <span style={{ color: '#226135', fontWeight: 700 }}>Coffee House</span>
              </Text>
              <Text size="11px" c="#536b5a" fw={500} style={{ whiteSpace: 'nowrap' }}>
                905 Hùng Vương, Phú Mỹ
              </Text>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <Group gap="sm" visibleFrom="md" wrap="nowrap">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  textDecoration: 'none',
                  color: '#2c3f33',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#226135';
                  e.currentTarget.style.backgroundColor = '#eff7f1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#2c3f33';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {link.label}
              </a>
            ))}
          </Group>

          {/* Right Action: Cart (Adaptive Mobile/Desktop) & Menu toggle */}
          <Group gap="xs" wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
            {/* Mobile Cart ActionIcon with clean Indicator Badge (Never clipped) */}
            <Indicator
              label={cartItemCount}
              disabled={cartItemCount === 0}
              color="red"
              size={18}
              offset={4}
              withBorder
              hiddenFrom="sm"
            >
              <ActionIcon
                onClick={handleCartClick}
                color="bamboo"
                variant="filled"
                size={36}
                radius="md"
                aria-label={isCartOpen ? 'Đóng giỏ hàng' : 'Mở giỏ hàng'}
                style={{
                  backgroundColor: '#226135',
                  boxShadow: '0 2px 6px rgba(34, 97, 53, 0.25)',
                }}
              >
                <IconShoppingCart size={19} />
              </ActionIcon>
            </Indicator>

            {/* Desktop Cart Button with clean Indicator Badge (Never clipped) */}
            <Indicator
              label={cartItemCount}
              disabled={cartItemCount === 0}
              color="red"
              size={20}
              offset={4}
              withBorder
              visibleFrom="sm"
            >
              <Button
                onClick={handleCartClick}
                leftSection={<IconShoppingCart size={17} />}
                color="bamboo"
                variant="filled"
                size="sm"
                style={{
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(34, 97, 53, 0.22)',
                  whiteSpace: 'nowrap',
                }}
              >
                Giỏ Hàng
              </Button>
            </Indicator>

            {/* Desktop QR Standee Button */}
            {onOpenWebsiteQr && (
              <Tooltip label="Mã QR Quán (Cho Khách Quét Vào Web)" position="bottom" withArrow>
                <ActionIcon
                  onClick={onOpenWebsiteQr}
                  variant="light"
                  color="bamboo"
                  size="lg"
                  radius="md"
                  visibleFrom="sm"
                  aria-label="Mã QR quán"
                >
                  <IconQrcode size={19} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Desktop Admin Management Button */}
            <Tooltip label="Trang Quản Trị Quán (Chủ Quán / Admin)" position="bottom" withArrow>
              <ActionIcon
                component="a"
                href="/admin"
                variant="light"
                color="bamboo"
                size="lg"
                radius="md"
                visibleFrom="sm"
                aria-label="Quản trị quán"
              >
                <IconSettings size={19} />
              </ActionIcon>
            </Tooltip>

            {/* Mobile/Tablet menu toggle - Toggle open/close on repeated clicks */}
            <ActionIcon
              variant="subtle"
              color="bamboo"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              hiddenFrom="md"
              size={36}
              radius="md"
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {mobileMenuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
            </ActionIcon>
          </Group>
        </Group>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        withCloseButton
        closeButtonProps={{ 'aria-label': 'Đóng menu' }}
        title={
          <Group gap="xs">
            <img
              src="/images/logo.png"
              alt="Logo"
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
            <Text fw={700} c="#14281b">
              Xuân Phạm Coffee House
            </Text>
          </Group>
        }
        padding="md"
        position="right"
      >
        <Stack gap="sm" mt="sm">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: '#2c3f33',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#f8faf8',
              }}
            >
              {link.label}
            </a>
          ))}

          {onOpenWebsiteQr && (
            <Button
              variant="outline"
              color="bamboo"
              fullWidth
              leftSection={<IconQrcode size={18} />}
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWebsiteQr();
              }}
            >
              Mã QR Quán (Cho Khách Quét Vào Web)
            </Button>
          )}

          <Button
            variant="light"
            color="bamboo"
            fullWidth
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenOriginalMenu();
            }}
          >
            Xem Ảnh Menu Thực Tế Quán
          </Button>

          <Button
            component="a"
            href={siteConfig.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            color="blue"
            fullWidth
            leftSection={<img src="/images/facebook-logo.png" alt="FB" style={{ width: 18, height: 18, borderRadius: '50%' }} />}
          >
            Fanpage Facebook Quán
          </Button>

          <Button
            component="a"
            href="/admin"
            variant="filled"
            color="bamboo"
            fullWidth
            leftSection={<IconSettings size={18} />}
          >
            Trang Quản Trị Quán & Đơn Hàng
          </Button>

          <Divider my="xs" />

          <div
            style={{
              padding: '12px',
              backgroundColor: '#eff7f1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#2c3f33',
            }}
          >
            <Text fw={700} size="xs" c="#14281b" mb={2}>
              ĐỊA CHỈ:
            </Text>
            <Text size="xs" c="#536b5a">
              {siteConfig.address}
            </Text>
            <Text size="xs" c="#536b5a" mt={4}>
              Giờ mở cửa: 06:00 - 22:00 hàng ngày
            </Text>
          </div>
        </Stack>
      </Drawer>
    </header>
  );
};
