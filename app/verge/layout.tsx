import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '$VERGE — Riches or Ruin',
  description: 'The Bull vs Bear PvP memecoin on Solana. Stack SOL. Stay chad.',
};

export default function VergeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
