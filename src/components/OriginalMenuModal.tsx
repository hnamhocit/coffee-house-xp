import React, { useState } from 'react';
import {
  Modal,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconPhoto,
  IconDownload,
  IconRotateClockwise,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
} from '@tabler/icons-react';

interface OriginalMenuModalProps {
  opened: boolean;
  onClose: () => void;
}

export const OriginalMenuModal: React.FC<OriginalMenuModalProps> = ({
  opened,
  onClose,
}) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleReset = () => {
    setRotation(0);
    setScale(1);
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title={
        <Group gap="xs">
          <IconPhoto size={20} color="#226135" />
          <Text fw={700} c="#14281b" size="md" style={{ fontFamily: 'var(--font-heading)' }}>
            Ảnh Thực Đơn Gốc Quán Xuân Phạm
          </Text>
        </Group>
      }
      size="xl"
      centered
      padding="md"
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text size="xs" c="#536b5a">
            Ảnh chụp thực tế menu quán tại <b>905 Hùng Vương, Phú Mỹ, Thủ Dầu Một</b>.
          </Text>

          {/* Interactive controls: Rotate & Zoom */}
          <Group gap={6} align="center">
            <Tooltip label="Xoay ảnh 90°" withArrow>
              <Button
                size="xs"
                variant="light"
                color="bamboo"
                leftSection={<IconRotateClockwise size={15} />}
                onClick={handleRotate}
              >
                Xoay Ảnh {rotation > 0 ? `(${rotation}°)` : ''}
              </Button>
            </Tooltip>

            <Tooltip label="Phóng to ảnh" withArrow>
              <ActionIcon size="sm" variant="default" onClick={handleZoomIn} aria-label="Phóng to">
                <IconZoomIn size={15} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Thu nhỏ ảnh" withArrow>
              <ActionIcon size="sm" variant="default" onClick={handleZoomOut} aria-label="Thu nhỏ">
                <IconZoomOut size={15} />
              </ActionIcon>
            </Tooltip>

            {(rotation !== 0 || scale !== 1) && (
              <Tooltip label="Đặt lại góc xoay & kích thước" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={handleReset} aria-label="Đặt lại">
                  <IconRefresh size={15} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Image Container with overflow: auto (NO overflow: hidden clipping) */}
        <div
          style={{
            borderRadius: '10px',
            overflow: 'auto',
            border: '1px solid #dceee1',
            backgroundColor: '#1b2720',
            textAlign: 'center',
            maxHeight: '72vh',
            minHeight: '320px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/images/menu-photo.jpg"
            alt="Menu thực tế quán Xuân Phạm (đã xoay đúng chiều)"
            style={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '68vh',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: 'transform 0.25s ease',
              borderRadius: '6px',
            }}
          />
        </div>

        {/* Footer info & Download button */}
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Badge color="bamboo" variant="light" size="sm">
            Techcombank: 3657771130 - PHAM THI THANH XUAN
          </Badge>

          <Button
            component="a"
            href="/images/menu-photo.jpg"
            target="_blank"
            download="menu-xuan-pham.jpg"
            leftSection={<IconDownload size={15} />}
            variant="outline"
            color="bamboo"
            size="xs"
          >
            Tải Ảnh Gốc Về Máy
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
