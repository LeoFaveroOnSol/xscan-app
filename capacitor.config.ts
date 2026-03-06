import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.xscan.app',
  appName: 'XSCAN',
  webDir: 'public',
  server: {
    // Production: Load from Vercel
    url: 'https://xscan5.vercel.app',
    androidScheme: 'https',
    // Clear cache on each launch for development
    cleartext: true,
  },
  ios: {
    // Content inset behavior
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#09090b',
    // Enable native scrolling
    scrollEnabled: true,
    // Allow inline media playback
    allowsLinkPreview: false,
    // Viewport settings
    overrideUserAgent: 'XSCAN-iOS-App',
    // WebView preferences for better scroll
    webContentsDebuggingEnabled: true,
  },
  android: {
    backgroundColor: '#09090b',
    allowMixedContent: true,
    // Enable hardware acceleration
    useLegacyBridge: false,
    overrideUserAgent: 'XSCAN-Android-App',
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#09090b',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#00ff88',
      // Fade out animation
      launchFadeOutDuration: 300,
      // Auto hide after app loads
      launchAutoHide: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#09090b',
      // Overlay mode for iOS
      overlaysWebView: false,
    },
    Keyboard: {
      // Resize behavior
      resize: 'body',
      // iOS specific
      resizeOnFullScreen: true,
    },
  },
};

export default config;
