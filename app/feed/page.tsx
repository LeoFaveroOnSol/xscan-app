import type { Metadata } from 'next';
import FeedClient from './FeedClient';

export const metadata: Metadata = {
  title: 'Real-time Feed | XSCAN',
  description: 'Live feed of KOL crypto calls from Twitter and Telegram channels.',
};

export default function FeedPage() {
  return <FeedClient />;
}
