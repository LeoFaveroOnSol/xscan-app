import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import { MobileLayout } from '@/components/mobile';
import WhatsNewModal from '@/components/ui/WhatsNewModal';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'XSCAN - Twitter KOL Scanner',
  description: 'Track the best crypto KOLs on Twitter/X. See their winrate, multipliers, and call history.',
  keywords: ['crypto', 'KOL', 'Twitter', 'Solana', 'memecoin', 'trading', 'leaderboard'],
  icons: {
    icon: '/favicon.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'XSCAN - Twitter KOL Scanner',
    description: 'Track the best crypto KOLs on Twitter/X. See their winrate, multipliers, and call history.',
    type: 'website',
    siteName: 'XSCAN',
    url: 'https://xscan.wtf',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XSCAN - Twitter KOL Scanner',
    description: 'Track the best crypto KOLs on Twitter/X. See their winrate, multipliers, and call history.',
    creator: '@XScan_',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'XSCAN',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Providers>
          <AnalyticsProvider>
            <MobileLayout>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <WhatsNewModal />
            </MobileLayout>
          </AnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}
