import React from 'react';
import {
  Container,
  Group,
  Stack,
  Text,
  Title,
  SimpleGrid,
  Divider,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
} from '@mantine/core';
import {
  IconPlant,
  IconMapPin,
  IconPhone,
  IconClock,
  IconBrandFacebook,
  IconHeart,
  IconArrowUp,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { siteConfig } from '../config/siteConfig';

export const Footer: React.FC = () => {
  const handleFacebookClick = (e: React.MouseEvent) => {
    if (!siteConfig.facebookUrl || siteConfig.facebookUrl === '#' || siteConfig.facebookUrl.trim() === '') {
      e.preventDefault();
      notifications.show({
        title: 'Facebook Quán',
        message: 'Link Facebook đang được để trống và sẽ được chủ quán cập nhật sau. Hotline liên hệ: ' + siteConfig.hotlineDisplay,
        color: 'bamboo',
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        backgroundColor: '#15331e',
        color: '#dceedf',
        paddingTop: '2.5rem',
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
        borderTop: '4px solid #2f7a3f',
      }}
    >
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 'lg', md: 'xl' }} mb="2rem">
          {/* Col 1: Brand Info */}
          <Stack gap="sm">
            <Group gap="xs" align="center">
              <img
                src="/images/logo.png"
                alt="Logo Xuân Phạm"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: 'none',
                  boxShadow: 'none',
                }}
              />
              <div>
                <Text
                  fw={800}
                  size="lg"
                  style={{
                    color: '#ffffff',
                    fontFamily: 'var(--font-heading)',
                    lineHeight: 1.1,
                  }}
                >
                  Xuân Phạm <span style={{ color: '#a3e4b2' }}>Coffee House</span>
                </Text>
                <Text size="xs" c="#a9cfb0">
                  Vườn Tre Xanh • 905 Hùng Vương
                </Text>
              </div>
            </Group>

            <Text size="xs" c="#badcc3" style={{ lineHeight: 1.6, fontStyle: 'italic' }}>
              “Chậm lại một nhịp giữa bộn bề phố thị, tìm chút an yên dưới bóng tre xanh.”
            </Text>

            <Group gap="xs" mt="xs">
              <Tooltip
                label={
                  siteConfig.facebookUrl
                    ? 'Facebook Quán'
                    : 'Facebook Chủ Quán (Đang cập nhật link)'
                }
              >
                <a
                  href={siteConfig.facebookUrl || '#'}
                  target={siteConfig.facebookUrl ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  onClick={handleFacebookClick}
                  style={{ display: 'inline-block', width: 34, height: 34, borderRadius: '50%', overflow: 'hidden' }}
                >
                  <img src="/images/facebook-logo.png" alt="Facebook" style={{ width: '100%', height: '100%' }} />
                </a>
              </Tooltip>

              <ActionIcon
                component="a"
                href={`tel:${siteConfig.hotline}`}
                variant="filled"
                color="bamboo"
                size="lg"
                radius="md"
                aria-label="Gọi hotline"
              >
                <IconPhone size={20} />
              </ActionIcon>
            </Group>
          </Stack>

          {/* Col 2: Navigation Links */}
          <Stack gap="xs">
            <Text fw={700} size="sm" c="#ffffff" mb={4} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Khám Phá
            </Text>
            <a href="#top" style={{ color: '#badcc3', textDecoration: 'none', fontSize: '0.88rem' }}>
              Trang Chủ
            </a>
            <a href="#thuc-don" style={{ color: '#badcc3', textDecoration: 'none', fontSize: '0.88rem' }}>
              Thực Đơn Đồ Uống
            </a>
            <a href="#khong-gian" style={{ color: '#badcc3', textDecoration: 'none', fontSize: '0.88rem' }}>
              Không Gian Vườn Tre
            </a>
            <a href="#thanh-toan" style={{ color: '#badcc3', textDecoration: 'none', fontSize: '0.88rem' }}>
              Thông Tin Chuyển Khoản & QR
            </a>
            <a href="#dia-chi" style={{ color: '#badcc3', textDecoration: 'none', fontSize: '0.88rem' }}>
              Địa Chỉ & Bản Đồ
            </a>
          </Stack>

          {/* Col 3: Address & Store Hours */}
          <Stack gap="xs">
            <Text fw={700} size="sm" c="#ffffff" mb={4} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Địa Chỉ & Giờ Mở Cửa
            </Text>

            <Group gap="xs" align="flex-start" wrap="nowrap">
              <IconMapPin size={16} color="#8ec999" style={{ flexShrink: 0, marginTop: 3 }} />
              <Text size="xs" c="#badcc3" style={{ lineHeight: 1.5 }}>
                {siteConfig.address}
              </Text>
            </Group>

            <Group gap="xs" align="center">
              <IconClock size={16} color="#8ec999" />
              <Text size="xs" c="#badcc3">
                {siteConfig.openingHours} hàng ngày
              </Text>
            </Group>

            <Group gap="xs" align="center">
              <IconPhone size={16} color="#8ec999" />
              <Text size="xs" c="#badcc3">
                Hotline: <b>{siteConfig.hotlineDisplay}</b>
              </Text>
            </Group>
          </Stack>

          {/* Col 4: Bank Transfer Quick info */}
          <Stack gap="xs">
            <Text fw={700} size="sm" c="#ffffff" mb={4} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Thanh Toán Quán
            </Text>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(185, 222, 192, 0.2)',
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                <img
                  src="/images/techcombank-logo.png"
                  alt="Techcombank"
                  style={{
                    height: '24px',
                    objectFit: 'contain',
                    backgroundColor: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'block',
                  }}
                />
              </div>
              <Text size="sm" fw={800} c="#badcc3" style={{ letterSpacing: '0.04em' }}>
                {siteConfig.bankInfo.accountNumber}
              </Text>
              <Text size="xs" c="#dceedf" style={{ textTransform: 'uppercase' }}>
                {siteConfig.bankInfo.accountHolder}
              </Text>
            </div>
            <Text size="xs" c="#8ec999">
              Miễn phí bình thứ 2 cho ấm trà nóng!
            </Text>
          </Stack>
        </SimpleGrid>

        <Divider color="rgba(185, 222, 192, 0.2)" mb="lg" />

        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text size="xs" c="#8ec999">
            © {new Date().getFullYear()} <b>Cà Phê Vườn Tre Xuân Phạm</b> – 905 Hùng Vương, Phú Mỹ, Thủ Dầu Một, Bình Dương.
          </Text>

          <Button
            size="compact-xs"
            variant="subtle"
            color="bamboo"
            leftSection={<IconArrowUp size={14} />}
            onClick={scrollToTop}
            style={{ color: '#dceedf' }}
          >
            Lên Đầu Trang
          </Button>
        </Group>
      </Container>
    </footer>
  );
};
