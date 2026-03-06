import { NextRequest, NextResponse } from 'next/server';
import { createAnonClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ch1Handle = request.nextUrl.searchParams.get('ch1')?.replace('@', '');
    const ch2Handle = request.nextUrl.searchParams.get('ch2')?.replace('@', '');

    if (!ch1Handle || !ch2Handle) {
      return NextResponse.json({ error: 'Both ch1 and ch2 params required' }, { status: 400 });
    }

    const supabase = createAnonClient();

    const { data: channels, error: chError } = await supabase
      .from('telegram_channels')
      .select('*')
      .in('channel_username', [ch1Handle, ch2Handle])
      .eq('is_active', true);

    if (chError || !channels || channels.length < 2) {
      return NextResponse.json({ error: 'One or both channels not found' }, { status: 404 });
    }

    const ch1 = channels.find((c: any) => c.channel_username === ch1Handle)!;
    const ch2 = channels.find((c: any) => c.channel_username === ch2Handle)!;

    const [calls1Res, calls2Res] = await Promise.all([
      supabase
        .from('telegram_calls')
        .select('*')
        .eq('channel_id', ch1.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('telegram_calls')
        .select('*')
        .eq('channel_id', ch2.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false }),
    ]);

    const calls1 = calls1Res.data || [];
    const calls2 = calls2Res.data || [];

    const tokens1Map = new Map(calls1.map((c: any) => [c.token_address, c]));
    const tokensInCommon = calls2
      .filter((c: any) => tokens1Map.has(c.token_address))
      .map((c2: any) => {
        const c1 = tokens1Map.get(c2.token_address)!;
        return {
          token_address: c2.token_address,
          token_symbol: c2.token_symbol || c1.token_symbol,
          kol1_entry_mcap: c1.entry_market_cap,
          kol1_multiplier: c1.ath_multiplier,
          kol2_entry_mcap: c2.entry_market_cap,
          kol2_multiplier: c2.ath_multiplier,
        };
      });

    return NextResponse.json({
      kol1: { ...ch1, twitter_handle: ch1.channel_username, calls: calls1.slice(0, 10) },
      kol2: { ...ch2, twitter_handle: ch2.channel_username, calls: calls2.slice(0, 10) },
      tokensInCommon,
    });
  } catch (error) {
    console.error('Error in GET /api/compare/telegram:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
