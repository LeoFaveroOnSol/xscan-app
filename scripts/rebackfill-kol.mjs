// Rebackfill entry prices for a specific KOL using 1-min candles
// Usage: node scripts/rebackfill-kol.mjs <kol_id>

const KOL_ID = process.argv[2] || '9c807a88-3ebb-488d-a5a4-dcc9664eac1d'; // MageArez
const SUPABASE_URL = 'https://mmdqkxaqgabsrhcccepf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GECKO_API = 'https://api.geckoterminal.com/api/v2';
const DELAY_MS = 2000; // 2s between API calls to be gentle

if (!SUPABASE_KEY) {
  // Try to read from .env.local
  const fs = await import('fs');
  const envContent = fs.readFileSync('/root/xscan-project/.env.local', 'utf8');
  const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (match) process.env.SUPABASE_SERVICE_ROLE_KEY = match[1].trim();
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'PATCH' ? 'return=minimal' : 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  if (options.method === 'PATCH') return null;
  return res.json();
}

async function getPoolForToken(address, network = 'solana') {
  const res = await fetch(`${GECKO_API}/networks/${network}/tokens/${address}/pools?page=1`, {
    headers: { 'accept': 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const pool = data?.data?.[0];
  if (!pool) return null;
  
  const poolAddress = pool.attributes?.address || pool.id?.split('_')[1];
  const baseAddr = pool.relationships?.base_token?.data?.id?.split('_')[1];
  const isQuoteToken = baseAddr && baseAddr.toLowerCase() !== address.toLowerCase();
  
  return { poolAddress, isQuoteToken, network };
}

async function getHistoricalEntry(poolAddress, network, targetUnixTime, isQuoteToken) {
  const now = Math.floor(Date.now() / 1000);
  const ageHours = (now - targetUnixTime) / 3600;
  
  let timeframe, aggregate;
  if (ageHours < 6) {
    timeframe = 'minute'; aggregate = 1;
  } else if (ageHours < 24) {
    timeframe = 'minute'; aggregate = 15;
  } else if (ageHours < 168) {
    timeframe = 'hour'; aggregate = 1;
  } else if (ageHours < 720) {
    timeframe = 'hour'; aggregate = 4;
  } else {
    timeframe = 'day'; aggregate = 1;
  }
  
  const beforeTs = targetUnixTime + 86400;
  const url = `${GECKO_API}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&before_timestamp=${beforeTs}&limit=1000&currency=usd`;
  
  const res = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!res.ok) return null;
  
  const data = await res.json();
  const candles = data?.data?.attributes?.ohlcv_list;
  if (!candles || candles.length === 0) return null;
  
  // Find closest candle to target time
  let closest = candles[0];
  let closestDiff = Math.abs(closest[0] - targetUnixTime);
  
  for (const c of candles) {
    const diff = Math.abs(c[0] - targetUnixTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = c;
    }
  }
  
  // Use open price
  let price = closest[1];
  if (isQuoteToken && price > 0) price = 1 / price;
  
  const candleTime = new Date(closest[0] * 1000).toISOString();
  const diffMin = Math.round(closestDiff / 60);
  
  return { price, timestamp: closest[0], candleTime, diffMin, timeframe, aggregate };
}

// Main
console.log(`🔄 Rebackfilling KOL: ${KOL_ID}`);

const calls = await supabaseFetch(
  `calls?select=id,token_address,token_symbol,entry_market_cap,entry_timestamp,ath_market_cap,ath_multiplier,current_market_cap&kol_id=eq.${KOL_ID}&entry_market_cap=gt.0&order=entry_timestamp.desc`
);

console.log(`📊 Found ${calls.length} calls with entry > 0`);

let updated = 0;
let skipped = 0;
let errors = 0;

for (const call of calls) {
  const entryTs = Math.floor(new Date(call.entry_timestamp).getTime() / 1000);
  const ageHours = (Date.now() / 1000 - entryTs) / 3600;
  
  // Skip calls older than 30 days — GeckoTerminal won't have good minute data
  if (ageHours > 720) {
    console.log(`⏭️  ${call.token_symbol || call.token_address.slice(0,8)} — too old (${Math.round(ageHours/24)}d), skipping`);
    skipped++;
    continue;
  }
  
  try {
    // Get pool
    const pool = await getPoolForToken(call.token_address);
    if (!pool) {
      console.log(`❌ ${call.token_symbol || call.token_address.slice(0,8)} — no pool found`);
      errors++;
      await sleep(DELAY_MS);
      continue;
    }
    
    await sleep(1000); // rate limit between pool lookup and OHLCV
    
    // Get historical entry price
    const hist = await getHistoricalEntry(pool.poolAddress, pool.network, entryTs, pool.isQuoteToken);
    if (!hist || hist.price <= 0) {
      console.log(`❌ ${call.token_symbol} — no historical price data`);
      errors++;
      await sleep(DELAY_MS);
      continue;
    }
    
    // Calculate new entry mcap from price ratio
    // We need current price + current mcap to derive historical mcap
    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${call.token_address}`);
    const dexData = await dexRes.json();
    const pair = dexData?.pairs?.[0];
    
    if (!pair || !pair.marketCap || !pair.priceUsd) {
      console.log(`❌ ${call.token_symbol} — no DexScreener data`);
      errors++;
      await sleep(DELAY_MS);
      continue;
    }
    
    const currentPrice = parseFloat(pair.priceUsd);
    const currentMcap = pair.marketCap;
    
    if (currentPrice <= 0) {
      console.log(`❌ ${call.token_symbol} — zero price`);
      errors++;
      await sleep(DELAY_MS);
      continue;
    }
    
    const priceRatio = hist.price / currentPrice;
    const newEntryMcap = Math.round(currentMcap * priceRatio);
    
    // Sanity check
    if (newEntryMcap <= 0 || newEntryMcap > currentMcap * 100) {
      console.log(`⚠️  ${call.token_symbol} — suspicious entry mcap: $${newEntryMcap} (current: $${currentMcap}), skipping`);
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }
    
    const oldEntry = call.entry_market_cap;
    const changePct = Math.round(((newEntryMcap - oldEntry) / oldEntry) * 100);
    
    // Recalculate ATH (keep existing if higher)
    const athMcap = Math.max(newEntryMcap, call.ath_market_cap || 0, currentMcap);
    const athMultiplier = Math.max(1, +(athMcap / newEntryMcap).toFixed(2));
    const currentMultiplier = +(currentMcap / newEntryMcap).toFixed(2);
    const isWin = athMultiplier >= 2;
    
    // Update
    await supabaseFetch(
      `calls?id=eq.${call.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          entry_market_cap: newEntryMcap,
          ath_market_cap: athMcap,
          ath_multiplier: athMultiplier,
          current_market_cap: currentMcap,
          current_multiplier: currentMultiplier,
          is_win: isWin,
        }),
      }
    );
    
    const symbol = call.token_symbol || call.token_address.slice(0, 8);
    console.log(`✅ ${symbol}: $${oldEntry} → $${newEntryMcap} (${changePct > 0 ? '+' : ''}${changePct}%) | ATH: ${athMultiplier}x | candle: ${hist.timeframe}/${hist.aggregate} (±${hist.diffMin}min)`);
    updated++;
    
  } catch (err) {
    console.log(`❌ ${call.token_symbol || '???'}: ${err.message}`);
    errors++;
  }
  
  await sleep(DELAY_MS);
}

console.log(`\n📊 Done! Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`);
