import React from 'react';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Box,
} from '@mantine/core';
import {
  IconLeaf,
  IconCup,
  IconSparkles,
  IconCar,
} from '@tabler/icons-react';

export const AboutSection: React.FC = () => {
  return (
    <Box id="khong-gian" py={{ base: '2.5rem', md: '3.5rem' }} style={{ backgroundColor: '#ffffff' }}>
      <Container size="lg">
        {/* Concise Header */}
        <Group justify="space-between" align="flex-end" mb="lg" wrap="wrap">
          <div>
            <Title
              order={2}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
                color: '#14281b',
              }}
            >
              Không Gian Quán Xuân Phạm
            </Title>
          </div>
          <Text size="sm" c="#536b5a">
            905 Hùng Vương, Phú Mỹ • Mở cửa 06:00 - 22:00
          </Text>
        </Group>

        {/* Visual Photo Showcase (More photos, less text!) */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
          <Card
            withBorder
            radius="md"
            padding={0}
            className="clean-cafe-card"
            style={{ overflow: 'hidden', height: '240px', position: 'relative' }}
          >
            <img
              src="/images/bamboo-hero.jpg"
              alt="Vườn tre xanh mát"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 14px',
                background: 'linear-gradient(transparent, rgba(10, 28, 16, 0.88))',
                color: '#ffffff',
              }}
            >
              <Text fw={700} size="sm">
                🌿 Bóng Mát Tự Nhiên
              </Text>
              <Text size="xs" c="#dceedf">
                Không khí thoáng đãng gió trời
              </Text>
            </div>
          </Card>

          <Card
            withBorder
            radius="md"
            padding={0}
            className="clean-cafe-card"
            style={{ overflow: 'hidden', height: '240px', position: 'relative' }}
          >
            <img
              src="/images/drinks/coffee.jpg"
              alt="Cà phê mộc nguyên chất"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 14px',
                background: 'linear-gradient(transparent, rgba(10, 28, 16, 0.88))',
                color: '#ffffff',
              }}
            >
              <Text fw={700} size="sm">
                ☕ Cà Phê Mộc Chuẩn Vị
              </Text>
              <Text size="xs" c="#dceedf">
                Pha phin đậm đà, kem muối béo ngậy
              </Text>
            </div>
          </Card>

          <Card
            withBorder
            radius="md"
            padding={0}
            className="clean-cafe-card"
            style={{ overflow: 'hidden', height: '240px', position: 'relative' }}
          >
            <img
              src="/images/drinks/tra-dao.jpg"
              alt="Trà trái cây tươi mát"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 14px',
                background: 'linear-gradient(transparent, rgba(10, 28, 16, 0.88))',
                color: '#ffffff',
              }}
            >
              <Text fw={700} size="sm">
                🍹 Trà & Nước Ép Tươi Mát
              </Text>
              <Text size="xs" c="#dceedf">
                Trái cây tươi ép trong ngày
              </Text>
            </div>
          </Card>
        </SimpleGrid>

        {/* Free 2nd Pot Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #226135 0%, #153e22 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 4px 16px rgba(20, 40, 27, 0.1)',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <div>
              <Group gap="xs" mb={2}>
                <IconSparkles size={16} color="#b8d7be" />
                <Text size="xs" fw={700} style={{ textTransform: 'uppercase', color: '#dceedf' }}>
                  Ưu đãi đặc biệt
                </Text>
              </Group>
              <Text fw={700} size="md" c="#ffffff" style={{ fontFamily: 'var(--font-heading)' }}>
                Ấm Trà Thảo Mộc Nóng – Bình Thứ 2 Hoàn Toàn Miễn Phí!
              </Text>
            </div>

            <Badge
              size="lg"
              variant="filled"
              style={{
                backgroundColor: '#ffffff',
                color: '#226135',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              Chỉ 10.000đ / Ấm
            </Badge>
          </Group>
        </div>
      </Container>
    </Box>
  );
};
