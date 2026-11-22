import { useEffect, useMemo, useState } from 'react';
import { Anchor, Button, Group, Menu, Modal, Paper, Stack, Text, TextInput } from '@mantine/core';
import { IconCopy, IconDownload, IconMail, IconMaximize, IconMinimize, IconShare2 } from '@tabler/icons-react';
import { generateWebsiteQr, OFFICIAL_WEBSITE_URL } from '../services/firebaseService';

interface WebsiteQrModalProps {
  opened: boolean;
  onClose: () => void;
}

export function WebsiteQrModal({ opened, onClose }: WebsiteQrModalProps) {
  const [qr, setQr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const qrFile = useMemo(() => {
    if (!qr || typeof File === 'undefined') return null;
    const bytes = Uint8Array.from(atob(qr.slice(qr.indexOf(',') + 1)), (character) => character.charCodeAt(0));
    return new File([bytes], 'xuan-pham-qr.png', { type: 'image/png' });
  }, [qr]);
  const supportsShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const canShareImage = Boolean(supportsShare && qrFile && navigator.canShare?.({ files: [qrFile] }));

  useEffect(() => {
    if (!opened || qr !== null) return;
    let cancelled = false;
    generateWebsiteQr().then((image) => {
      if (!cancelled) setQr(image);
    });
    return () => { cancelled = true; };
  }, [opened, qr]);

  const close = () => {
    setExpanded(false);
    setCopied(false);
    setShowLink(false);
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(OFFICIAL_WEBSITE_URL);
      setCopied(true);
    } catch {
      setShowLink(true);
    }
  };

  const share = async (data: ShareData) => {
    try {
      await navigator.share(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setShowLink(true);
    }
  };

  const downloadQr = () => {
    if (!qr) return;
    const link = document.createElement('a');
    link.href = qr;
    link.download = 'xuan-pham-qr.png';
    link.click();
  };

  const emailLink = `mailto:?subject=${encodeURIComponent('Xuân Phạm')}&body=${encodeURIComponent(OFFICIAL_WEBSITE_URL)}`;

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={<Text fw={750}>QR thực đơn</Text>}
      closeButtonProps={{ 'aria-label': 'Đóng QR thực đơn' }}
      size="sm"
      padding="lg"
      radius="lg"
      zIndex={1600}
      centered
      fullScreen={expanded}
    >
      <Stack gap="md" maw={expanded ? 460 : undefined} mx="auto">
        <Paper bg="#f3f8f4" radius="md" p="md" ta="center">
          <Group justify="center" gap="xs" mb="sm">
            <img src="/images/logo.webp" alt="" width="32" height="32" />
            <Text fw={750} c="bamboo.9">Xuân Phạm</Text>
          </Group>
          {qr ? (
            <img
              src={qr}
              alt="Quét mã QR để mở thực đơn Xuân Phạm"
              className={expanded ? 'website-qr-image website-qr-image-expanded' : 'website-qr-image'}
            />
          ) : (
            <Stack className="website-qr-image" justify="center" align="center" aria-live="polite">
              <Text size="sm">{qr === null ? 'Đang tạo mã QR…' : 'Chưa tạo được mã QR.'}</Text>
              {qr === '' && <Button size="compact-sm" onClick={() => setQr(null)}>Thử lại</Button>}
            </Stack>
          )}
          <Anchor href={OFFICIAL_WEBSITE_URL} target="_blank" rel="noopener noreferrer" size="xs" c="bamboo.9" mt="sm" display="inline-block">
            {new URL(OFFICIAL_WEBSITE_URL).host}
          </Anchor>
        </Paper>

        <Group grow gap="xs">
          <Menu withinPortal={false} position="bottom-start">
            <Menu.Target>
              <Button leftSection={<IconShare2 size={17} />}>Chia sẻ</Button>
            </Menu.Target>
            <Menu.Dropdown>
              {supportsShare && (
                <Menu.Item leftSection={<IconShare2 size={16} />} onClick={() => share({ title: 'Xuân Phạm', url: OFFICIAL_WEBSITE_URL })}>
                  Chia sẻ liên kết
                </Menu.Item>
              )}
              {canShareImage && qrFile && (
                <Menu.Item leftSection={<IconShare2 size={16} />} onClick={() => share({ files: [qrFile] })}>
                  Chia sẻ ảnh QR
                </Menu.Item>
              )}
              <Menu.Item leftSection={<IconCopy size={16} />} onClick={copyLink}>Sao chép liên kết</Menu.Item>
              <Menu.Item component="a" href={emailLink} leftSection={<IconMail size={16} />}>Gửi qua email</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button variant="light" leftSection={<IconDownload size={17} />} onClick={downloadQr} disabled={!qr}>
            Tải PNG
          </Button>
        </Group>
        {copied && <Text size="sm" c="bamboo.9" role="status">Đã sao chép liên kết.</Text>}
        {showLink && (
          <TextInput label="Liên kết thực đơn" value={OFFICIAL_WEBSITE_URL} readOnly onFocus={(event) => event.currentTarget.select()} />
        )}
        <Button
          variant="subtle"
          leftSection={expanded ? <IconMinimize size={17} /> : <IconMaximize size={17} />}
          onClick={() => setExpanded((value) => !value)}
          disabled={!qr}
        >
          {expanded ? 'Thu nhỏ' : 'Phóng to QR'}
        </Button>
      </Stack>
    </Modal>
  );
}
