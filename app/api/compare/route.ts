import { NextRequest, NextResponse } from 'next/server';
import { createAnonClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const kol1Handle = request.nextUrl.searchParams.get('kol1')?.replace('@', '');
    const kol2Handle = request.nextUrl.searchParams.get('kol2')?.replace('@', '');

    if (!kol1Handle || !kol2Handle) {
      return NextResponse.json({ error: 'Both kol1 and kol2 params required' }, { status: 400 });
    }

    const supabase = createAnonClient();

    // Fetch both KOLs
    const { data: kols, error: kolsError } = await supabase
      .from('kols')
      .select('*')
      .in('twitter_handle', [kol1Handle, kol2Handle])
      .eq('is_active', true);

    if (kolsError || !kols || kols.length < 2) {
      return NextResponse.json({ error: 'One or both KOLs not found' }, { status: 404 });
    }

    const kol1 = kols.find((k: any) => k.twitter_handle === kol1Handle)!;
    const kol2 = kols.find((k: any) => k.twitter_handle === kol2Handle)!;

    // Fetch calls for both KOLs
    const [calls1Res, calls2Res] = await Promise.all([
      supabase
        .from('calls')
        .select('*')
        .eq('kol_id', kol1.id)
        .eq('is_deleted', false)
        .order('entry_timestamp', { ascending: false }),
      supabase
        .from('calls')
        .select('*')
        .eq('kol_id', kol2.id)
        .eq('is_deleted', false)
        .order('entry_timestamp', { ascending: false }),
    ]);

    const calls1 = calls1Res.data || [];
    const calls2 = calls2Res.data || [];

    // Find tokens in common
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
      kol1: { ...kol1, calls: calls1.slice(0, 10) },
      kol2: { ...kol2, calls: calls2.slice(0, 10) },
      tokensInCommon,
    });
  } catch (error) {
    console.error('Error in GET /api/compare:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
