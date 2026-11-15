import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../theme/mantineTheme';

interface MantineRootProps {
  children: React.ReactNode;
}

export const MantineRoot: React.FC<MantineRootProps> = ({ children }) => {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" zIndex={2000} autoClose={3000} />
      {children}
    </MantineProvider>
  );
};
