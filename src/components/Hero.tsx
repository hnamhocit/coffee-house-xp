import React from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Box,
} from '@mantine/core';
import {
  IconPhoto,
  IconArrowRight,
} from '@tabler/icons-react';

interface HeroProps {
  onOpenOriginalMenu: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenOriginalMenu }) => {
  return (
    <Box
      id="top"
      py={{ base: '3rem', md: '4.5rem' }}
      style={{
        // Seamless background: starts from pure white matching Navbar, gently warming into soft natural sage
        background: 'linear-gradient(180deg, #ffffff 0%, #f4f8f5 55%, #edf5ef 100%)',
        borderBottom: '1px solid #e4ede5',
        textAlign: 'center',
      }}
    >
      <Container size="md">
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          {/* Clean Human Title */}
          <Title
            order={1}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.3rem, 5.8vw, 4rem)',
              fontWeight: 800,
              color: '#14281b',
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '16px',
            }}
          >
            <span style={{ whiteSpace: 'nowrap' }}>Xuân Phạm</span>{' '}
            <span style={{ color: '#226135', whiteSpace: 'nowrap' }}>
              Coffee House
            </span>
          </Title>

          {/* Slogan */}
          <Text
            style={{
              color: '#285338',
              fontStyle: 'italic',
              fontSize: 'clamp(1.05rem, 2.5vw, 1.4rem)',
              fontWeight: 500,
              letterSpacing: '0.01em',
              lineHeight: 1.6,
              margin: '0 auto 28px auto',
              maxWidth: '640px',
              padding: '0 8px',
            }}
          >
            “Chậm lại một nhịp giữa bộn bề phố thị, tìm chút an yên dưới bóng tre xanh.”
          </Text>

          {/* Only 2 Clean, Human Action Buttons */}
          <Group justify="center" gap="sm">
            <Button
              component="a"
              href="#thuc-don"
              size="lg"
              color="bamboo"
              variant="filled"
              rightSection={<IconArrowRight size={19} />}
              style={{
                backgroundColor: '#226135',
                fontWeight: 700,
                height: '48px',
                padding: '0 28px',
                fontSize: '1rem',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(34, 97, 53, 0.22)',
              }}
            >
              Xem Menu & Gọi Món
            </Button>

            <Button
              onClick={onOpenOriginalMenu}
              size="lg"
              variant="default"
              leftSection={<IconPhoto size={18} color="#226135" />}
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#badcc3',
                color: '#226135',
                fontWeight: 600,
                height: '48px',
                padding: '0 22px',
                fontSize: '1rem',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(34, 97, 53, 0.05)',
              }}
            >
              Xem Menu Gốc
            </Button>
          </Group>
        </div>
      </Container>
    </Box>
  );
};
