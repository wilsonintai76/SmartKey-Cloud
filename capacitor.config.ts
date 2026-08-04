import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.poliku.smartkey',
  appName: 'SecureKey',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
  },
  plugins: {
    CapacitorSQLite: {
      androidDatabaseLocation: 'default',
    },
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning for Key Cabinet...',
        cancel: 'Cancel',
        availableDevices: 'Available devices',
        noDeviceFound: 'No Key Cabinet found',
      },
    },
    NativeBiometric: {
      iosBiometricLocalizedReason: 'Authenticate to access SecureKey',
      iosBiometricLocalizedFallbackTitle: 'Use PIN instead',
      iosBiometricLocalizedCancelTitle: 'Cancel',
    },
  },
};

export default config;
