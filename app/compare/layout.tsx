import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KOL Comparison — XSCAN',
  description: 'Compare two crypto KOLs side-by-side on XSCAN. Win rate, multipliers, calls, and more.',
  openGraph: {
    title: 'KOL Comparison — XSCAN',
    description: 'Compare two crypto KOLs side-by-side on XSCAN.',
    type: 'website',
    siteName: 'XSCAN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KOL Comparison — XSCAN',
    description: 'Compare two crypto KOLs side-by-side on XSCAN.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
