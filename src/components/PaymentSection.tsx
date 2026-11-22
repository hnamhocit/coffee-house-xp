import React from 'react';
import {
  Container,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Button,
  CopyButton,
  Tooltip,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconCopy,
  IconCheck,
  IconShieldCheck,
  IconHeart,
  IconDownload,
  IconExternalLink,
} from '@tabler/icons-react';
import { siteConfig } from '../config/siteConfig';

export const PaymentSection: React.FC = () => {
  const qrDefaultUrl = `https://img.vietqr.io/image/${siteConfig.bankInfo.bankShortCode}-${siteConfig.bankInfo.accountNumber}-compact2.png?accountName=${encodeURIComponent(siteConfig.bankInfo.accountHolder)}&addInfo=Xuan%20Pham%20Coffee`;

  return (
    <Box id="thanh-toan" py={{ base: '2.5rem', md: '3.5rem' }} style={{ backgroundColor: '#ffffff' }}>
      <Container size="lg">
        {/* Header - Direct, No redundant pill badges */}
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 30px auto' }}>
          <Title
            order={2}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.6rem, 3.2vw, 2.1rem)',
              color: '#14281b',
              marginBottom: '6px',
            }}
          >
            Chuyển Khoản & Quét Mã VietQR
          </Title>

          <Text size="sm" c="#536b5a">
            Chuyển khoản sau khi quán xác nhận đơn. Nếu đặt trên website, dùng mã VietQR trong mục Theo dõi đơn.
          </Text>
        </div>

        <Card
          withBorder
          radius="md"
          p={{ base: 'md', sm: 'xl' }}
          style={{
            maxWidth: '780px',
            margin: '0 auto',
            backgroundColor: '#fafdfb',
            borderColor: '#b8d7be',
            boxShadow: '0 4px 20px rgba(34, 97, 53, 0.06)',
          }}
        >
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" style={{ alignItems: 'center' }}>
            {/* Left Column: Bank details with REAL TECHCOMBANK LOGO */}
            <Stack gap="sm">
              {/* Real Official Techcombank Logo */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2ede4',
                  width: 'fit-content',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <img
                  src="/images/techcombank-logo.png"
                  alt="Techcombank Logo Chính Thức"
                  style={{
                    height: '34px',
                    maxWidth: '170px',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>

              {/* Account Number Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #dceee1',
                }}
              >
                <Text size="xs" c="#607667" fw={700} mb={2}>
                  SỐ TÀI KHOẢN:
                </Text>
                <Group justify="space-between" align="center">
                  <Text
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: '#226135',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {siteConfig.bankInfo.accountNumber}
                  </Text>

                  <CopyButton value={siteConfig.bankInfo.accountNumber} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Đã sao chép!' : 'Chép số tài khoản'} withArrow>
                        <Button
                          size="xs"
                          variant={copied ? 'filled' : 'light'}
                          color={copied ? 'teal' : 'bamboo'}
                          onClick={copy}
                          leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                          style={{ fontWeight: 600 }}
                        >
                          {copied ? 'Đã Chép' : 'Sao Chép'}
                        </Button>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </div>

              {/* Account Holder Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #dceee1',
                }}
              >
                <Text size="xs" c="#607667" fw={700} mb={2}>
                  CHỦ TÀI KHOẢN:
                </Text>
                <Text
                  fw={800}
                  size="md"
                  c="#14281b"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}
                >
                  {siteConfig.bankInfo.accountHolder}
                </Text>
              </div>

              <Group gap="xs">
                <IconShieldCheck size={16} color="#226135" />
                <Text size="xs" c="#536b5a">
                  Napas 247 nhận tiền ngay lập tức, không mất phí
                </Text>
              </Group>

              <Text size="xs" fw={600} c="#226135">
                ❤️ Xin cảm ơn quý khách đã ủng hộ quán!
              </Text>
            </Stack>

            {/* Right Column: QR Code Display */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#ffffff',
                  padding: '14px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(34, 97, 53, 0.08)',
                  border: '1.5px solid #b8d7be',
                }}
              >
                <img
                  src={qrDefaultUrl}
                  alt="Mã QR Techcombank Xuân Phạm"
                  style={{
                    width: '210px',
                    height: '210px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    display: 'block',
                  }}
                />
                <Text size="xs" fw={700} c="#14281b" mt={8}>
                  Quét QR Bằng Ứng Dụng Ngân Hàng
                </Text>

                <Group gap={6} mt={8} justify="center">
                  <Button
                    component="a"
                    href={qrDefaultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                    variant="light"
                    color="bamboo"
                    leftSection={<IconExternalLink size={14} />}
                  >
                    Mở Mã QR Toàn Màn Hình
                  </Button>
                </Group>
              </div>
            </div>
          </SimpleGrid>
        </Card>
      </Container>
    </Box>
  );
};
