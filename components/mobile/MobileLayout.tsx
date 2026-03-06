'use client';

import { useEffect, useState, ReactNode, Children, isValidElement, cloneElement } from 'react';
import MobileNavBar from './MobileNavBar';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if running in Capacitor
    const checkCapacitor = () => {
      const isNative = typeof window !== 'undefined' &&
        !!(window as any).Capacitor?.isNativePlatform?.();

      // Also check for user agent override
      const userAgent = navigator.userAgent || '';
      const isXscanApp = userAgent.includes('XSCAN-iOS-App') || userAgent.includes('XSCAN-Android-App');

      const shouldUseMobile = isNative || isXscanApp;
      setIsCapacitor(shouldUseMobile);

      // Add class to html element for CSS targeting
      if (shouldUseMobile) {
        document.documentElement.classList.add('capacitor-app');
        document.body.classList.add('capacitor-body');
      }
    };

    checkCapacitor();

    // Listen for Capacitor ready event
    document.addEventListener('deviceready', checkCapacitor, false);

    return () => {
      document.removeEventListener('deviceready', checkCapacitor, false);
    };
  }, []);

  // Server-side or not mounted yet - render children normally
  if (!mounted) {
    return <>{children}</>;
  }

  // If not in Capacitor, render children normally (web version)
  if (!isCapacitor) {
    return <>{children}</>;
  }

  // Filter out Header and Footer from children when in Capacitor mode
  const filteredChildren = Children.map(children, (child) => {
    if (isValidElement(child)) {
      // Skip Header and Footer components in mobile mode
      const displayName = (child.type as any)?.displayName || (child.type as any)?.name || '';
      if (displayName === 'Header' || displayName === 'Footer') {
        return null;
      }
    }
    return child;
  });

  // Mobile/Capacitor version with native-like UI (fullscreen)
  return (
    <div className="mobile-app">
      {/* No header - fullscreen like the reference */}
      <div className="mobile-scroll-container">
        {filteredChildren}
      </div>
      <MobileNavBar />
    </div>
  );
}
