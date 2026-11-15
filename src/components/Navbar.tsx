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
} from '@mantine/core';
import {
  IconShoppingCart,
  IconMenu2,
  IconPlant,
} from '@tabler/icons-react';
import { siteConfig } from '../config/siteConfig';

interface NavbarProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenOriginalMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItemCount,
  onOpenCart,
  onOpenOriginalMenu,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            {/* Mobile Cart ActionIcon */}
            <div style={{ position: 'relative' }}>
              <ActionIcon
                onClick={onOpenCart}
                color="bamboo"
                variant="filled"
                size={36}
                radius="md"
                aria-label="Giỏ hàng"
                hiddenFrom="sm"
                style={{
                  backgroundColor: '#226135',
                  boxShadow: '0 2px 6px rgba(34, 97, 53, 0.25)',
                }}
              >
                <IconShoppingCart size={19} />
              </ActionIcon>
              {cartItemCount > 0 && (
                <Badge
                  circle
                  size="xs"
                  color="red"
                  hiddenFrom="sm"
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    border: '2px solid white',
                    pointerEvents: 'none',
                  }}
                >
                  {cartItemCount}
                </Badge>
              )}
            </div>

            {/* Desktop Cart Button */}
            <Button
              onClick={onOpenCart}
              leftSection={<IconShoppingCart size={17} />}
              color="bamboo"
              variant="filled"
              size="sm"
              visibleFrom="sm"
              style={{
                position: 'relative',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(34, 97, 53, 0.22)',
                whiteSpace: 'nowrap',
              }}
            >
              <span>Giỏ Hàng</span>
              {cartItemCount > 0 && (
                <Badge
                  circle
                  size="sm"
                  color="red"
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    border: '2px solid white',
                  }}
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile/Tablet menu toggle */}
            <ActionIcon
              variant="subtle"
              color="bamboo"
              onClick={() => setMobileMenuOpen(true)}
              hiddenFrom="md"
              size={36}
              radius="md"
              aria-label="Mở menu"
            >
              <IconMenu2 size={22} />
            </ActionIcon>
          </Group>
        </Group>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
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
