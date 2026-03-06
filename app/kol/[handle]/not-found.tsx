import Link from 'next/link';
import Button from '@/components/ui/Button';
import { UserX, ArrowLeft } from 'lucide-react';

export default function KOLNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <UserX className="w-16 h-16 text-muted mx-auto mb-6" />
      <h1 className="text-2xl font-bold mb-2">KOL Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The KOL you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link href="/">
        <Button variant="secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leaderboard
        </Button>
      </Link>
    </div>
  );
}
