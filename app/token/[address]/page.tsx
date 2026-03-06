import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Clock, Users, BarChart3 } from 'lucide-react';

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ address: string }>;
}

// Fetch token data from DexScreener
async function getTokenData(address: string) {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { cache: 'no-store' }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const pairs = data.pairs || [];
    
    if (pairs.length === 0) return null;
    
    // Get the pair with highest liquidity
    const bestPair = pairs.reduce((best: any, curr: any) => 
      (curr.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? curr : best
    );
    
    return {
      address,
      name: bestPair.baseToken?.name || 'Unknown',
      symbol: bestPair.baseToken?.symbol || '???',
      price: parseFloat(bestPair.priceUsd) || 0,
      priceChange24h: bestPair.priceChange?.h24 || 0,
      marketCap: bestPair.marketCap || bestPair.fdv || 0,
      liquidity: bestPair.liquidity?.usd || 0,
      volume24h: bestPair.volume?.h24 || 0,
      chain: bestPair.chainId || 'solana',
      dexId: bestPair.dexId,
      pairAddress: bestPair.pairAddress,
      imageUrl: bestPair.info?.imageUrl,
      website: bestPair.info?.websites?.[0]?.url,
      twitter: bestPair.info?.socials?.find((s: any) => s.type === 'twitter')?.url,
      telegram: bestPair.info?.socials?.find((s: any) => s.type === 'telegram')?.url,
    };
  } catch (e) {
    console.error('Error fetching token data:', e);
    return null;
  }
}

// Get KOL calls for this token
async function getKolCalls(address: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        kol:kols(id, twitter_handle, display_name, profile_image_url, winrate)
      `)
      .eq('token_address', address)
      .order('entry_timestamp', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching KOL calls:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception fetching KOL calls:', e);
    return [];
  }
}

// Get Telegram channel calls for this token
async function getTelegramCalls(address: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('telegram_calls')
      .select(`
        *,
        channel:telegram_channels(id, channel_username, display_name)
      `)
      .eq('token_address', address)
      .order('entry_timestamp', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching Telegram calls:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Exception fetching Telegram calls:', e);
    return [];
  }
}

function formatNumber(num: number): string {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(2);
}

function formatPrice(num: number): string {
  if (!num) return '$0';
  if (num < 0.0001) return '$' + num.toExponential(2);
  if (num < 1) return '$' + num.toFixed(6);
  return '$' + num.toFixed(2);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const token = await getTokenData(address);
  
  if (!token) {
    return { title: 'Token Not Found | XSCAN' };
  }
  
  return {
    title: `${token.symbol} - ${token.name} | XSCAN`,
    description: `Track ${token.symbol} price, market cap, and KOL calls on XSCAN`,
  };
}

export default async function TokenPage({ params }: Props) {
  const { address } = await params;
  
  // Validate address format (basic check)
  if (!address || address.length < 32) {
    notFound();
  }
  
  const [token, kolCalls, telegramCalls] = await Promise.all([
    getTokenData(address),
    getKolCalls(address),
    getTelegramCalls(address),
  ]);
  
  const dexScreenerUrl = token 
    ? `https://dexscreener.com/${token.chain}/${address}`
    : `https://dexscreener.com/solana/${address}`;
  
  const bloomUrl = token?.chain === 'solana' 
    ? `https://bloom.trading/sol/${address}`
    : `https://bloom.trading/${token?.chain || 'sol'}/${address}`;

  const isPositive = (token?.priceChange24h || 0) >= 0;
  const totalCalls = kolCalls.length + telegramCalls.length;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Token Info */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="premium-card p-6 sticky top-6">
              {/* Token Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-border overflow-hidden">
                  {token?.imageUrl ? (
                    <img src={token.imageUrl} alt={token.symbol} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {token?.symbol?.slice(0, 2) || '??'}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{token?.symbol || '???'}</h1>
                  <p className="text-muted-foreground text-sm">{token?.name || 'Unknown Token'}</p>
                </div>
              </div>

              {/* Price */}
              {token && (
                <div className="mb-6">
                  <p className="text-3xl font-bold">{formatPrice(token.price)}</p>
                  <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-medium">{isPositive ? '+' : ''}{token.priceChange24h?.toFixed(2)}%</span>
                    <span className="text-muted-foreground text-sm">24h</span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-semibold">${formatNumber(token?.marketCap || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Liquidity</span>
                  <span className="font-semibold">${formatNumber(token?.liquidity || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">24h Volume</span>
                  <span className="font-semibold">${formatNumber(token?.volume24h || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chain</span>
                  <span className="font-semibold uppercase">{token?.chain || 'solana'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Calls</span>
                  <span className="font-semibold">{totalCalls}</span>
                </div>
              </div>

              {/* Contract Address */}
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-1">Contract</p>
                <p className="font-mono text-sm break-all">{address}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <a
                  href={bloomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-colors"
                >
                  🌸 Buy on Bloom
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={dexScreenerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  📊 DexScreener
                  <ExternalLink className="w-4 h-4" />
                </a>
                {token?.twitter && (
                  <a
                    href={token.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    𝕏 Twitter
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {token?.telegram && (
                  <a
                    href={token.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    ✈️ Telegram
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Calls */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* KOL Calls Section */}
            <div className="premium-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">KOL Calls ({kolCalls.length})</h2>
              </div>
              
              {kolCalls.length > 0 ? (
                <div className="space-y-3">
                  {kolCalls.map((call: any) => {
                    const multiplier = call.ath_multiplier || call.current_multiplier || 1;
                    const isWin = multiplier >= 2;
                    
                    return (
                      <div 
                        key={call.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {call.kol?.profile_image_url ? (
                            <img 
                              src={call.kol.profile_image_url} 
                              alt={call.kol.display_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {call.kol?.twitter_handle?.slice(0, 2).toUpperCase() || '??'}
                              </span>
                            </div>
                          )}
                          <div>
                            <Link 
                              href={`/kol/${call.kol?.twitter_handle}`}
                              className="font-semibold hover:text-primary transition-colors"
                            >
                              {call.kol?.display_name || `@${call.kol?.twitter_handle}`}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(call.entry_timestamp).toLocaleDateString()}
                              <span>•</span>
                              <span>Entry: ${formatNumber(call.entry_market_cap)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          isWin ? 'bg-green-500/20 text-green-500' : 'bg-muted/20 text-muted-foreground'
                        }`}>
                          {multiplier.toFixed(2)}x
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No KOL calls found for this token.</p>
              )}
            </div>

            {/* Telegram Channel Calls Section */}
            <div className="premium-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold">Telegram Calls ({telegramCalls.length})</h2>
              </div>
              
              {telegramCalls.length > 0 ? (
                <div className="space-y-3">
                  {telegramCalls.map((call: any) => {
                    const multiplier = call.ath_multiplier || call.current_multiplier || 1;
                    const isWin = multiplier >= 2;
                    
                    return (
                      <div 
                        key={call.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-blue-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-lg">📢</span>
                          </div>
                          <div>
                            <Link 
                              href={`/telegram/${call.channel?.channel_username}`}
                              className="font-semibold hover:text-primary transition-colors"
                            >
                              {call.channel?.display_name || `@${call.channel?.channel_username}`}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(call.entry_timestamp).toLocaleDateString()}
                              <span>•</span>
                              <span>Entry: ${formatNumber(call.entry_market_cap)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          isWin ? 'bg-green-500/20 text-green-500' : 'bg-muted/20 text-muted-foreground'
                        }`}>
                          {multiplier.toFixed(2)}x
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No Telegram calls found for this token.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
