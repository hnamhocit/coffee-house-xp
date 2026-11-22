import { ActionIcon, Container, Group, Text, Tooltip } from '@mantine/core';
import { IconLogout, IconQrcode, IconVolume, IconVolumeOff } from '@tabler/icons-react';

interface AdminHeaderProps {
  onOpenQr: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  signedIn: boolean;
  onLogout: () => Promise<void>;
}

export function AdminHeader({ onOpenQr, soundEnabled, onToggleSound, signedIn, onLogout }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <Container size="xl" className="admin-shell">
        <Group justify="space-between" wrap="nowrap">
          <a className="admin-brand" href="/" aria-label="Xuân Phạm · Về trang chủ">
            <img src="/images/logo.webp" alt="" width="36" height="36" />
            <span>
              <Text component="span" fw={800} display="block">Xuân Phạm</Text>
              <Text component="span" size="xs" c="dimmed" display="block">Quản trị quán</Text>
            </span>
          </a>
          <Group gap="xs" wrap="nowrap">
            <Tooltip label="QR thực đơn">
              <ActionIcon size="lg" variant="light" aria-label="QR thực đơn" onClick={onOpenQr}>
                <IconQrcode size={19} />
              </ActionIcon>
            </Tooltip>
            {signedIn && (
              <>
                <Tooltip label={soundEnabled ? 'Tắt âm báo đơn' : 'Bật âm báo đơn'}>
                  <ActionIcon size="lg" variant={soundEnabled ? 'light' : 'default'} aria-label="Âm báo đơn" aria-pressed={soundEnabled} onClick={onToggleSound}>
                    {soundEnabled ? <IconVolume size={19} /> : <IconVolumeOff size={19} />}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Đăng xuất">
                  <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Đăng xuất" onClick={onLogout}>
                    <IconLogout size={19} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Group>
        </Group>
      </Container>
    </header>
  );
}
