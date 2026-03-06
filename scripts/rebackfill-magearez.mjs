// Rebackfill MageArez calls with Birdeye 1-min data + cleanup junk calls
import fs from 'fs';

const KOL_ID = process.argv[2] || '9c807a88-3ebb-488d-a5a4-dcc9664eac1d';
const SUPABASE_URL = 'https://mmdqkxaqgabsrhcccepf.supabase.co';
const BIRDEYE_API = 'https://public-api.birdeye.so';

// Load env
const envContent = fs.readFileSync('/root/xscan-project/.env.local', 'utf8');
const KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const BIRDEYE_KEY = envContent.match(/BIRDEYE_API_KEY=(.+)/)?.[1]?.trim();

if (!KEY || !BIRDEYE_KEY) { console.error('Missing keys'); process.exit(1); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': KEY, 'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'PATCH' ? 'return=minimal' : options.method === 'DELETE' ? 'return=minimal' : 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  if (options.method === 'PATCH' || options.method === 'DELETE') return null;
  return res.json();
}

async function birdeyeHistoricalPrice(address, unixTime) {
  const res = await fetch(
    `${BIRDEYE_API}/defi/historical_price?address=${address}&address_type=token&type=1m&time_from=${unixTime - 120}&time_to=${unixTime + 120}`,
    { headers: { 'X-API-KEY': BIRDEYE_KEY, 'x-chain': 'solana' } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.success || !data.data?.items?.length) return null;
  
  // Find closest candle
  let closest = data.data.items[0];
  let closestDiff = Math.abs(closest.unixTime - unixTime);
  for (const item of data.data.items) {
    const diff = Math.abs(item.unixTime - unixTime);
    if (diff < closestDiff) { closestDiff = diff; closest = item; }
  }
  return { price: closest.value, timestamp: closest.unixTime };
}

async function birdeyeTokenOverview(address) {
  const res = await fetch(
    `${BIRDEYE_API}/defi/token_overview?address=${address}`,
    { headers: { 'X-API-KEY': BIRDEYE_KEY, 'x-chain': 'solana' } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.success || !data.data) return null;
  return data.data;
}

// ===== MAIN =====
console.log('📊 Fetching all MageArez calls...');
const calls = await sb(`calls?select=*&kol_id=eq.${KOL_ID}&order=entry_timestamp.desc`);
console.log(`Found ${calls.length} total calls\n`);

// ===== PHASE 1: CLEANUP junk calls =====
console.log('🧹 PHASE 1: Cleaning up junk calls...');
const junkCalls = calls.filter(c => 
  c.entry_market_cap === 0 || 
  c.entry_market_cap === null ||
  (!c.token_symbol && !c.token_name && (c.ath_market_cap === null || c.ath_market_cap === 0))
);

console.log(`Found ${junkCalls.length} junk calls (no data/name/mcap)`);
let deleted = 0;

for (const junk of junkCalls) {
  const age = Math.round((Date.now() - new Date(junk.entry_timestamp).getTime()) / 86400000);
  const symbol = junk.token_symbol || junk.token_address?.slice(0, 12) + '...';
  
  // Delete if old (>30 days) and no useful data
  if (age > 30 || (junk.entry_market_cap === 0 && !junk.token_symbol)) {
    await sb(`calls?id=eq.${junk.id}`, { method: 'DELETE' });
    console.log(`  🗑️  Deleted: ${symbol} (${age}d old, entry=$${junk.entry_market_cap || 0}, ath=$${junk.ath_market_cap || 0})`);
    deleted++;
    await sleep(200);
  }
}
console.log(`Deleted ${deleted} junk calls\n`);

// ===== PHASE 2: Deduplicate =====
console.log('🔍 PHASE 2: Deduplicating...');
const remaining = calls.filter(c => !junkCalls.find(j => j.id === c.id) || !c.entry_market_cap);
const tokenGroups = new Map();
for (const c of remaining) {
  if (!c.token_address) continue;
  if (!tokenGroups.has(c.token_address)) tokenGroups.set(c.token_address, []);
  tokenGroups.get(c.token_address).push(c);
}

let deduped = 0;
for (const [addr, group] of tokenGroups) {
  if (group.length <= 1) continue;
  // Keep the one with best ATH, delete rest
  group.sort((a, b) => (b.ath_multiplier || 0) - (a.ath_multiplier || 0));
  for (let i = 1; i < group.length; i++) {
    await sb(`calls?id=eq.${group[i].id}`, { method: 'DELETE' });
    console.log(`  🔄 Dedup: ${group[i].token_symbol || addr.slice(0,8)} (kept ${group[0].ath_multiplier}x, removed ${group[i].ath_multiplier}x)`);
    deduped++;
    await sleep(200);
  }
}
console.log(`Deduped ${deduped} calls\n`);

// ===== PHASE 3: Rebackfill entry prices with Birdeye =====
console.log('🔄 PHASE 3: Rebackfilling entry prices with Birdeye...');

// Re-fetch remaining calls
const validCalls = await sb(`calls?select=*&kol_id=eq.${KOL_ID}&entry_market_cap=gt.0&order=entry_timestamp.desc`);
console.log(`${validCalls.length} valid calls to process\n`);

let updated = 0, skipped = 0, errors = 0;

for (const call of validCalls) {
  const entryTs = Math.floor(new Date(call.entry_timestamp).getTime() / 1000);
  const ageHours = (Date.now() / 1000 - entryTs) / 3600;
  const symbol = call.token_symbol || call.token_address.slice(0, 8);
  
  try {
    // Get historical price from Birdeye
    const hist = await birdeyeHistoricalPrice(call.token_address, entryTs);
    await sleep(300); // Birdeye rate limit
    
    if (!hist || hist.price <= 0) {
      // Try DexScreener for current data at least
      skipped++;
      continue;
    }
    
    // Get current overview for mcap reference
    const overview = await birdeyeTokenOverview(call.token_address);
    await sleep(300);
    
    if (!overview || !overview.mc || !overview.price || overview.price <= 0) {
      // Fallback to DexScreener
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${call.token_address}`);
      const dexData = await dexRes.json();
      const pair = dexData?.pairs?.[0];
      
      if (!pair?.marketCap || !pair?.priceUsd || parseFloat(pair.priceUsd) <= 0) {
        skipped++;
        continue;
      }
      
      const currentPrice = parseFloat(pair.priceUsd);
      const currentMcap = pair.marketCap;
      const priceRatio = hist.price / currentPrice;
      const newEntryMcap = Math.round(currentMcap * priceRatio);
      
      if (newEntryMcap <= 0 || newEntryMcap > currentMcap * 100) { skipped++; continue; }
      
      const athMcap = Math.max(newEntryMcap, call.ath_market_cap || 0, currentMcap);
      const athMultiplier = Math.max(1, +(athMcap / newEntryMcap).toFixed(2));
      const currentMultiplier = +(currentMcap / newEntryMcap).toFixed(2);
      
      const updates = {
        entry_market_cap: newEntryMcap,
        ath_market_cap: athMcap,
        ath_multiplier: athMultiplier,
        current_market_cap: currentMcap,
        current_multiplier: currentMultiplier,
        is_win: athMultiplier >= 2,
        token_name: pair.baseToken?.name || call.token_name,
        token_symbol: pair.baseToken?.symbol || call.token_symbol,
      };
      
      await sb(`calls?id=eq.${call.id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      const changePct = Math.round(((newEntryMcap - call.entry_market_cap) / call.entry_market_cap) * 100);
      console.log(`✅ ${symbol}: $${call.entry_market_cap} → $${newEntryMcap} (${changePct > 0 ? '+' : ''}${changePct}%) | ATH: ${athMultiplier}x [DexScreener]`);
      updated++;
      await sleep(1000);
      continue;
    }
    
    // Use Birdeye overview
    const currentPrice = overview.price;
    const currentMcap = overview.mc;
    const priceRatio = hist.price / currentPrice;
    const newEntryMcap = Math.round(currentMcap * priceRatio);
    
    if (newEntryMcap <= 0 || newEntryMcap > currentMcap * 100) { skipped++; continue; }
    
    const athMcap = Math.max(newEntryMcap, call.ath_market_cap || 0, currentMcap);
    const athMultiplier = Math.max(1, +(athMcap / newEntryMcap).toFixed(2));
    const currentMultiplier = +(currentMcap / newEntryMcap).toFixed(2);
    
    const updates = {
      entry_market_cap: newEntryMcap,
      ath_market_cap: athMcap,
      ath_multiplier: athMultiplier,
      current_market_cap: currentMcap,
      current_multiplier: currentMultiplier,
      is_win: athMultiplier >= 2,
      token_name: overview.name || call.token_name,
      token_symbol: overview.symbol || call.token_symbol,
    };
    
    await sb(`calls?id=eq.${call.id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    const changePct = Math.round(((newEntryMcap - call.entry_market_cap) / call.entry_market_cap) * 100);
    console.log(`✅ ${symbol}: $${call.entry_market_cap} → $${newEntryMcap} (${changePct > 0 ? '+' : ''}${changePct}%) | ATH: ${athMultiplier}x [Birdeye]`);
    updated++;
    
  } catch (err) {
    console.log(`❌ ${symbol}: ${err.message}`);
    errors++;
  }
  
  await sleep(800);
}

console.log(`\n📊 FINAL RESULTS:`);
console.log(`  🗑️  Deleted junk: ${deleted}`);
console.log(`  🔄 Deduped: ${deduped}`);
console.log(`  ✅ Updated entry: ${updated}`);
console.log(`  ⏭️  Skipped: ${skipped}`);
console.log(`  ❌ Errors: ${errors}`);

// ===== PHASE 4: Recalculate KOL stats =====
console.log('\n📊 PHASE 4: Recalculating MageArez stats...');
const finalCalls = await sb(`calls?select=ath_multiplier,is_win&kol_id=eq.${KOL_ID}&entry_market_cap=gt.0`);
const totalCalls = finalCalls.length;
const wins = finalCalls.filter(c => c.is_win).length;
const winrate = totalCalls > 0 ? +((wins / totalCalls) * 100).toFixed(2) : 0;
const avgMult = totalCalls > 0 ? +(finalCalls.reduce((s, c) => s + (c.ath_multiplier || 1), 0) / totalCalls).toFixed(2) : 0;
const bestMult = Math.max(...finalCalls.map(c => c.ath_multiplier || 1));

await sb(`kols?id=eq.${KOL_ID}`, {
  method: 'PATCH',
  body: JSON.stringify({
    total_calls: totalCalls,
    winning_calls: wins,
    winrate: winrate,
    avg_multiplier: avgMult,
    best_multiplier: bestMult,
  }),
});

console.log(`  Total: ${totalCalls} | Wins: ${wins} | Winrate: ${winrate}% | Avg: ${avgMult}x | Best: ${bestMult}x`);
console.log('\n✅ Done!');
