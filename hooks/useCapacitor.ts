'use client';

import { useState, useEffect } from 'react';

interface CapacitorInfo {
  isCapacitor: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  platform: 'ios' | 'android' | 'web';
}

export function useCapacitor(): CapacitorInfo {
  const [info, setInfo] = useState<CapacitorInfo>({
    isCapacitor: false,
    isIOS: false,
    isAndroid: false,
    isWeb: true,
    platform: 'web',
  });

  useEffect(() => {
    // Check if running in Capacitor
    const isCapacitor = typeof window !== 'undefined' &&
      !!(window as any).Capacitor?.isNativePlatform?.();

    if (isCapacitor) {
      const platform = (window as any).Capacitor?.getPlatform?.() || 'web';
      setInfo({
        isCapacitor: true,
        isIOS: platform === 'ios',
        isAndroid: platform === 'android',
        isWeb: false,
        platform: platform as 'ios' | 'android' | 'web',
      });
    } else {
      // Fallback detection for iOS Safari in standalone mode (PWA)
      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream;
      const isStandalone = (window.navigator as any).standalone === true;

      if (isIOSSafari && isStandalone) {
        setInfo({
          isCapacitor: false,
          isIOS: true,
          isAndroid: false,
          isWeb: true,
          platform: 'ios',
        });
      }
    }
  }, []);

  return info;
}

// Hook to detect safe area insets for iOS
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10) ||
             parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10) ||
                parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10) ||
              parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10) ||
               parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
}
