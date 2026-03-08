import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hamzahjavaid.snowflaketraining',
  appName: 'Snowflake Training',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    // Release signing is configured via keystore in your CI/CD pipeline.
    // Run: npx cap sync android   → syncs web assets to the native project
    // Run: npx cap open android   → opens Android Studio for Play Store build
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#29b5e8',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#29b5e8',
      overlaysWebView: false,
    },
  },
};

export default config;
