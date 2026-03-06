import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const cleanHandle = handle.replace('@', '').toLowerCase();
    const supabase = createServiceClient();

    // Look up KOL
    const { data: kol, error: kolError } = await supabase
      .from('kols')
      .select('id')
      .eq('twitter_handle', cleanHandle)
      .single();

    if (kolError || !kol) {
      return NextResponse.json({ totalWithCA: 0, deletedWithCA: 0, deletionRate: 0, deletedTweets: [] });
    }

    // Get all calls for this KOL
    const { data: allCalls } = await supabase
      .from('calls')
      .select('token_address, token_symbol, token_name, entry_market_cap, entry_timestamp, tweet_url, is_deleted, deleted_tweet_data, ath_multiplier, current_multiplier, source')
      .eq('kol_id', kol.id)
      ;

    if (!allCalls || allCalls.length === 0) {
      return NextResponse.json({ totalWithCA: 0, deletedWithCA: 0, deletionRate: 0, deletedTweets: [] });
    }

    const totalWithCA = allCalls.length;
    const deletedCalls = allCalls.filter((c: any) => c.is_deleted === true);
    const deletedWithCA = deletedCalls.length;
    const deletionRate = totalWithCA > 0 ? Math.round((deletedWithCA / totalWithCA) * 100) : 0;

    const deletedTweets = deletedCalls.map((c: any) => {
      const meta = c.deleted_tweet_data || {};
      return {
        ca: c.token_address,
        chain: meta.chain || 'solana',
        tokenSymbol: c.token_symbol,
        tokenName: c.token_name,
        content: meta.content || null,
        tweetTime: meta.tweetTime || c.entry_timestamp,
        likes: meta.likes || 0,
        retweets: meta.retweets || 0,
        athMultiplier: c.ath_multiplier || meta.athMultiplier || null,
        currentMultiplier: c.current_multiplier || meta.currentMultiplier || null,
        marketCapAtCall: c.entry_market_cap || meta.marketCapAtCall || null,
        currentMarketCap: meta.currentMarketCap || null,
      };
    });

    return NextResponse.json({
      totalWithCA,
      deletedWithCA,
      deletionRate,
      deletedTweets,
    });
  } catch (error) {
    console.error('Error in deleted-tweets API:', error);
    return NextResponse.json(
      { error: 'Internal error', message: 'Data temporarily unavailable' },
      { status: 500 }
    );
  }
}
