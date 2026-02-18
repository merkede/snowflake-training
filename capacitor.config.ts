import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hamzahjavaid.snowflaketraining',
  appName: 'Snowflake Training',
  webDir: 'dist',
  server: {
    // Allow navigation within the app
    allowNavigation: ['*'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a', // slate-900 to match your hero
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#0f172a',
      style: 'LIGHT', // light text on dark background
    },
  },
  android: {
    // Ensures proper back button behaviour
    allowMixedContent: false,
    backgroundColor: '#0f172a',
  },
};

export default config;
