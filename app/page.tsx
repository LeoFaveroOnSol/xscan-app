import { createServiceClient } from '@/lib/supabase/server';

export const revalidate = 300;
import Link from 'next/link';
import HeroSection from '@/components/home/HeroSection';
import GOATsSection from '@/components/home/GOATsSection';
import XCallsSidebar from '@/components/home/XCallsSidebar';
import FAQSection from '@/components/home/FAQSection';
import LockedSection from '@/components/ui/LockedSection';
import { ArrowRight } from 'lucide-react';

async function getKOLs() {
  try {
    const supabase = createServiceClient();

    const { data: kols, error } = await supabase
      .from('kols')
      .select('*')
      .eq('is_active', true)
      .order('winrate', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching KOLs:', error);
      return [];
    }

    return kols || [];
  } catch (err) {
    console.error('Failed to fetch KOLs:', err);
    return [];
  }
}

async function getCalls() {
  try {
    const supabase = createServiceClient();

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .order('entry_timestamp', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching calls:', error);
      return [];
    }

    return calls || [];
  } catch (err) {
    console.error('Failed to fetch calls:', err);
    return [];
  }
}

export default async function HomePage() {
  const [kols, calls] = await Promise.all([getKOLs(), getCalls()]);

  return (
    <div className="min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.015] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.01] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <HeroSection />

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* The GOATs Section */}
            <GOATsSection kols={kols} />

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-8" />

            {/* FAQ Section */}
            <FAQSection />

            {/* CTA Section */}
            <section className="py-10">
              <div className="relative overflow-hidden rounded-2xl border border-primary/20">
                {/* Background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />

                <div className="relative p-8 md:p-10 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">Are you a KOL?</h2>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm md:text-base">
                    Apply to get listed on XSCAN and showcase your track record to thousands of traders.
                  </p>
                  <Link
                    href="/apply"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,136,0.25)]"
                  >
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* X Calls Sidebar - Locked */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-24">
              <LockedSection
                requiredAmount={100000}
                tokenSymbol="$XSCAN"
                buyLink="/docs/token"
              >
                <XCallsSidebar calls={calls} />
              </LockedSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
