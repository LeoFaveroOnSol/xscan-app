'use client';

import { useState, useEffect } from 'react';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
}

const COINS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'binancecoin', symbol: 'BNB' },
];

export default function PriceTicker() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      const ids = COINS.map(c => c.id).join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { cache: 'no-store' }
      );
      
      if (!res.ok) return;
      
      const data = await res.json();
      
      const newPrices: PriceData[] = COINS.map(coin => ({
        symbol: coin.symbol,
        price: data[coin.id]?.usd || 0,
        change24h: data[coin.id]?.usd_24h_change || 0,
      }));
      
      setPrices(newPrices);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching prices:', e);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  if (loading || prices.length === 0) {
    return (
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="animate-pulse">Loading prices...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {prices.map((coin) => {
        const isPositive = coin.change24h >= 0;
        return (
          <div key={coin.symbol} className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">{coin.symbol}</span>
            <span className="text-[11px] font-semibold">${formatPrice(coin.price)}</span>
            <span className={`text-[10px] font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{coin.change24h.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
