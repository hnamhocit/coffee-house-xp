import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  CopyButton,
  Paper,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import {
  IconQrcode,
  IconDownload,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconDeviceMobile,
  IconMaximize,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { generateWebsiteQr, OFFICIAL_WEBSITE_URL } from '../services/firebaseService';

interface WebsiteQrModalProps {
  opened: boolean;
  onClose: () => void;
}

export const WebsiteQrModal: React.FC<WebsiteQrModalProps> = ({ opened, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (opened) {
      setLoading(true);
      generateWebsiteQr(OFFICIAL_WEBSITE_URL)
        .then((url) => {
          if (isMounted) {
            setQrDataUrl(url);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [opened]);

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'QR_Standee_XuanPhamCoffee.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notifications.show({
      title: 'Tải mã QR thành công!',
      message: 'Đã tải ảnh mã QR website. Bạn có thể in ra standee để bàn hoặc dán tại quầy pha chế.',
      color: 'teal',
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setIsFullScreen(false);
        onClose();
      }}
      title={
        <Group gap="xs">
          <ThemeIcon size={32} radius="xl" color="bamboo" variant="light">
            <IconQrcode size={18} />
          </ThemeIcon>
          <div>
            <Text fw={800} size="md" c="#174421" style={{ fontFamily: 'var(--font-heading)' }}>
              Mã QR Quán Cho Khách Quét Vào Web
            </Text>
            <Text size="xs" c="#607667">
              Dùng để in standee để bàn hoặc mở trên điện thoại cho khách quét
            </Text>
          </div>
        </Group>
      }
      size={isFullScreen ? '100%' : 'md'}
      radius="md"
      zIndex={1600}
      fullScreen={isFullScreen}
    >
      <Stack gap="md" align="center" py="xs">
        {/* Printable Standee Card Frame */}
        <Paper
          withBorder
          p={{ base: 'md', sm: 'lg' }}
          radius="lg"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#b8d7be',
            boxShadow: '0 8px 30px rgba(34, 97, 53, 0.12)',
            textAlign: 'center',
            maxWidth: isFullScreen ? '420px' : '360px',
            width: '100%',
          }}
        >
          {/* Logo & Cafe Brand */}
          <img
            src="/images/logo.png"
            alt="Xuân Phạm Coffee House"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              margin: '0 auto 8px auto',
              display: 'block',
              border: '2px solid #226135',
            }}
          />

          <Text fw={800} size="md" c="#174421" style={{ fontFamily: 'var(--font-heading)' }}>
            Xuân Phạm Coffee House
          </Text>
          <Text size="xs" c="#546c5c" mb="xs">
            Cà Phê Rang Mộc & Trà Trái Cây Tươi Mát
          </Text>

          <Badge size="sm" variant="light" color="bamboo" mb="md">
            Quét mã để xem menu & gọi món
          </Badge>

          {/* Crisp QR Code Container */}
          <div
            style={{
              padding: '10px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '2px solid #226135',
              display: 'inline-block',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              maxWidth: '100%',
            }}
          >
            {loading ? (
              <div
                style={{
                  width: 200,
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size="xs" c="#607667">
                  Đang tạo mã QR...
                </Text>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Website"
                style={{
                  width: '100%',
                  maxWidth: isFullScreen ? '280px' : '220px',
                  height: 'auto',
                  aspectRatio: '1',
                  display: 'block',
                }}
              />
            ) : (
              <Text size="xs" c="red">
                Không thể tạo mã QR. Vui lòng thử lại.
              </Text>
            )}
          </div>

          <Text size="xs" fw={700} c="#226135" mt="sm">
            {OFFICIAL_WEBSITE_URL}
          </Text>
          <Text size="11px" c="#789080" mt={2}>
            Hỗ trợ quét bằng Camera điện thoại, Zalo hoặc app Ngân hàng
          </Text>
        </Paper>

        {/* Action Controls - Clean Mobile Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '360px' }}>
          <Button
            size="sm"
            color="bamboo"
            variant="filled"
            leftSection={<IconDownload size={15} />}
            onClick={handleDownloadQr}
            style={{ fontWeight: 700 }}
          >
            Tải Standee
          </Button>

          <CopyButton value={OFFICIAL_WEBSITE_URL} timeout={2500}>
            {({ copied, copy }) => (
              <Button
                size="sm"
                variant="light"
                color={copied ? 'teal' : 'bamboo'}
                leftSection={copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                onClick={copy}
              >
                {copied ? 'Đã sao chép' : 'Chép link'}
              </Button>
            )}
          </CopyButton>

          <Button
            size="sm"
            variant="outline"
            color="gray"
            leftSection={<IconMaximize size={15} />}
            onClick={() => setIsFullScreen((prev) => !prev)}
            style={{ gridColumn: 'span 2' }}
          >
            {isFullScreen ? 'Thu Nhỏ Lại' : 'Mở To Cho Khách Quét'}
          </Button>
        </div>
      </Stack>
    </Modal>
  );
};
