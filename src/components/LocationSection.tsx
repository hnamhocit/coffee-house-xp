import React from 'react';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Button,
  Badge,
  ThemeIcon,
  Stack,
  Box,
  Tooltip,
} from '@mantine/core';
import {
  IconMapPin,
  IconPhone,
  IconClock,
  IconBrandFacebook,
  IconExternalLink,
  IconCar,
  IconNavigation,
  IconMail,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { siteConfig } from '../config/siteConfig';

export const LocationSection: React.FC = () => {
  const handleFacebookClick = (e: React.MouseEvent) => {
    if (!siteConfig.facebookUrl || siteConfig.facebookUrl === '#' || siteConfig.facebookUrl.trim() === '') {
      e.preventDefault();
      notifications.show({
        title: 'Facebook Chủ Quán',
        message: 'Link Facebook đang để trống và sẽ được cập nhật sớm. Bạn có thể gọi hotline để được hỗ trợ: ' + siteConfig.hotlineDisplay,
        color: 'bamboo',
      });
    }
  };

  return (
    <Box
      id="dia-chi"
      py={{ base: '2.5rem', md: '4rem' }}
      style={{
        backgroundColor: '#f7faf7',
        borderTop: '1px solid #e2ede3',
      }}
    >
      <Container size="lg">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 24px auto' }}>
          <Title
            order={2}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.4rem, 3.2vw, 2.1rem)',
              color: '#14281b',
              marginBottom: '6px',
            }}
          >
            Ghé Thăm Xuân Phạm Coffee House
          </Title>

          <Text size="sm" c="#455b4e">
            Nằm trên trục đường Hùng Vương rợp bóng mát thuộc Phường Phú Mỹ, Thủ Dầu Một.
            Rất thuận tiện di chuyển, có chỗ đậu xe máy và ô tô thông thoáng.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'md', md: 'xl' }}>
          {/* Contact & Store Info Card */}
          <Card
            withBorder
            radius="lg"
            p={{ base: 'md', sm: 'xl' }}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #badcc3',
              boxShadow: '0 4px 20px rgba(37, 98, 50, 0.05)',
            }}
          >
            <Stack gap="lg">
              <div>
                <Group gap="xs" mb={6}>
                  <ThemeIcon size={36} radius="md" color="bamboo" variant="light">
                    <IconMapPin size={20} />
                  </ThemeIcon>
                  <Text fw={700} size="md" c="#174421">
                    Địa Chỉ Quán
                  </Text>
                </Group>
                <Text
                  size="md"
                  fw={600}
                  c="#253d2d"
                  style={{
                    backgroundColor: '#f0f7f2',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #dceee1',
                    lineHeight: 1.5,
                  }}
                >
                  {siteConfig.address}
                </Text>
              </div>

              <div>
                <Group gap="xs" mb={6}>
                  <ThemeIcon size={36} radius="md" color="coffee" variant="light">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <Text fw={700} size="md" c="#174421">
                    Thời Gian Hoạt Động
                  </Text>
                </Group>
                <Text size="sm" c="#455b4e">
                  <b>{siteConfig.openingHours}</b> – Mở cửa phục vụ tất cả các ngày trong tuần (kể cả Lễ, Tết).
                </Text>
              </div>

              <div>
                <Group gap="xs" mb={6}>
                  <ThemeIcon size={36} radius="md" color="bamboo" variant="light">
                    <IconPhone size={20} />
                  </ThemeIcon>
                  <Text fw={700} size="md" c="#174421">
                    Hotline & Zalo Quán
                  </Text>
                </Group>
                <Text size="sm" c="#455b4e" mb="xs">
                  Quý khách cần đặt bàn trước, gọi món mang về hoặc phản hồi dịch vụ:
                </Text>
                <Button
                  component="a"
                  href={`tel:${siteConfig.hotline}`}
                  variant="filled"
                  color="bamboo"
                  size="md"
                  leftSection={<IconPhone size={18} />}
                  style={{ fontWeight: 700 }}
                >
                  Gọi Ngay: {siteConfig.hotlineDisplay}
                </Button>
              </div>

              {/* Facebook Section */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f6f9f6',
                  borderRadius: '12px',
                  border: '1px solid #dceee1',
                }}
              >
                <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                  <div>
                    <Group gap="xs" mb={2}>
                      <img src="/images/facebook-logo.png" alt="Facebook" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                      <Text fw={700} size="sm" c="#174421">
                        Facebook Chủ Quán
                      </Text>
                    </Group>
                    <Text size="xs" c="#546c5c">
                      {siteConfig.facebookUrl
                        ? 'Trang Fanpage chính thức'
                        : 'Link Facebook chủ quán (Sẵn sàng cập nhật)'}
                    </Text>
                  </div>

                  <Tooltip
                    label={
                      siteConfig.facebookUrl
                        ? 'Truy cập Facebook'
                        : 'Link đang để trống - Chủ quán có thể cập nhật trong file cấu hình siteConfig'
                    }
                    withArrow
                  >
                    <Button
                      component="a"
                      href={siteConfig.facebookUrl || '#'}
                      target={siteConfig.facebookUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      onClick={handleFacebookClick}
                      variant="outline"
                      color="bamboo"
                      size="xs"
                      leftSection={<img src="/images/facebook-logo.png" alt="FB" style={{ width: 16, height: 16, borderRadius: '50%' }} />}
                      rightSection={<IconExternalLink size={14} />}
                    >
                      {siteConfig.facebookUrl ? 'Ghé Thăm Fanpage' : 'Facebook Quán'}
                    </Button>
                  </Tooltip>
                </Group>
              </div>

              <Group gap="xs">
                <IconCar size={18} color="#256232" />
                <Text size="xs" c="#455b4e">
                  Bãi đỗ xe máy & ô tô rộng rãi, có người trông coi an toàn.
                </Text>
              </Group>

              <Button
                component="a"
                href={siteConfig.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="md"
                variant="outline"
                color="bamboo"
                leftSection={<IconNavigation size={18} />}
                style={{ fontWeight: 600 }}
              >
                Mở Bản Đồ Chỉ Đường Trên Google Maps
              </Button>
            </Stack>
          </Card>

          {/* Google Maps Embed Frame */}
          <Card
            withBorder
            radius="lg"
            padding={0}
            style={{
              overflow: 'hidden',
              border: '1px solid #badcc3',
              boxShadow: '0 4px 20px rgba(37, 98, 50, 0.05)',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 16px',
                borderBottom: '1px solid #e1ece2',
              }}
            >
              <Group justify="space-between" align="center">
                <Text fw={700} size="sm" c="#174421">
                  Vị trí trên bản đồ (Khu vực Phú Mỹ, TP. Thủ Dầu Một)
                </Text>
                <Badge size="xs" color="bamboo" variant="light">
                  Google Maps
                </Badge>
              </Group>
            </div>

            <iframe
              src={siteConfig.googleMapsEmbed}
              width="100%"
              height="100%"
              style={{ border: 0, flex: 1, minHeight: '340px' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Vị trí Cà Phê Vườn Tre Xuân Phạm"
            />
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
};
