import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { Coins } from 'lucide-react';
import TokensTable from './TokensTable';

export const metadata: Metadata = {
  title: 'Tokens | XSCAN',
  description: 'Track all tokens called by KOLs and Telegram channels',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTokens() {
  const supabase = await createClient();

  const { data: tgCalls } = await supabase
    .from('telegram_calls')
    .select('token_address, token_symbol, token_name, token_image_url, entry_market_cap, ath_market_cap, ath_multiplier, current_market_cap, current_multiplier, entry_timestamp, channel_id, chain')
    .not('token_address', 'is', null)
    .gt('entry_market_cap', 0)
    .order('entry_timestamp', { ascending: false })
    .limit(500);

  const { data: kolCalls } = await supabase
    .from('calls')
    .select('token_address, token_symbol, token_name, token_image_url, entry_market_cap, ath_market_cap, ath_multiplier, current_market_cap, current_multiplier, entry_timestamp, kol_id, is_deleted')
    .not('token_address', 'is', null)
    .gt('entry_market_cap', 0)
    .order('entry_timestamp', { ascending: false })
    .limit(500);

  const tokenMap = new Map<string, any>();

  for (const call of [...(tgCalls || []), ...(kolCalls || [])]) {
    const addr = call.token_address;
    const existing = tokenMap.get(addr);

    if (!existing) {
      tokenMap.set(addr, {
        address: addr,
        symbol: call.token_symbol || '???',
        name: call.token_name || '',
        image: call.token_image_url,
        entryMc: call.entry_market_cap,
        athMc: call.ath_market_cap || 0,
        athMultiplier: call.ath_multiplier || 0,
        currentMc: call.current_market_cap || 0,
        currentMultiplier: call.current_multiplier || 0,
        firstCalled: call.entry_timestamp,
        callers: 1,
        sources: new Set([('channel_id' in call && call.channel_id) ? 'tg' : 'kol']),
      });
    } else {
      existing.callers += 1;
      existing.sources.add(('channel_id' in call && call.channel_id) ? 'tg' : 'kol');
      if ((call.ath_multiplier || 0) > existing.athMultiplier) {
        existing.athMultiplier = call.ath_multiplier;
        existing.athMc = call.ath_market_cap;
      }
      if (new Date(call.entry_timestamp) < new Date(existing.firstCalled)) {
        existing.firstCalled = call.entry_timestamp;
      }
    }
  }

  return Array.from(tokenMap.values())
    .map(t => ({ ...t, sources: Array.from(t.sources) }))
    .sort((a, b) => new Date(b.firstCalled).getTime() - new Date(a.firstCalled).getTime());
}

export default async function TokensPage() {
  const tokens = await getTokens();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tokens</h1>
              <p className="text-muted-foreground">
                {tokens.length} tokens called by KOLs &amp; Channels
              </p>
            </div>
          </div>
        </div>

        <TokensTable tokens={tokens} />
      </div>
    </div>
  );
}
