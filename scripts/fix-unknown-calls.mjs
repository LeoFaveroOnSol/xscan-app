// Fix unknown/null symbol calls for a KOL: fetch names from DexScreener, delete truly dead ones
import fs from 'fs';

const KOL_ID = process.argv[2] || '34a0c06b-6f9a-43ae-9cca-668c4612c8d2'; // exitliquid1ty
const SUPABASE_URL = 'https://mmdqkxaqgabsrhcccepf.supabase.co';
const envContent = fs.readFileSync('/root/xscan-project/.env.local', 'utf8');
const KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': KEY, 'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'PATCH' ? 'return=minimal' : options.method === 'DELETE' ? 'return=minimal' : 'return=representation',
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  if (options.method === 'PATCH' || options.method === 'DELETE') return null;
  return res.json();
}

// Fetch all calls for this KOL
const calls = await sb(`calls?select=*&kol_id=eq.${KOL_ID}&order=entry_timestamp.desc`);
console.log(`📊 Total calls: ${calls.length}`);

// Find problematic calls
const problems = calls.filter(c =>
  c.token_symbol === null || c.token_symbol === '' || c.token_symbol === 'UNKNOWN' ||
  c.entry_market_cap === 0 || c.entry_market_cap === null || c.ath_market_cap === null
);
console.log(`🔍 Problematic calls: ${problems.length}\n`);

let fixed = 0, deleted = 0, unchanged = 0;

for (const call of problems) {
  const addr = call.token_address;
  const symbol = call.token_symbol || 'null';
  
  // If entry=0 and no ATH data, just delete
  if ((call.entry_market_cap === 0 || call.entry_market_cap === null) && 
      (call.ath_market_cap === null || call.ath_market_cap === 0)) {
    await sb(`calls?id=eq.${call.id}`, { method: 'DELETE' });
    console.log(`🗑️  Deleted: ${addr.slice(0,12)}... (${symbol}) — no entry/ath data`);
    deleted++;
    await sleep(200);
    continue;
  }
  
  // Try DexScreener for name
  try {
    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
    const dexData = await dexRes.json();
    const pair = dexData?.pairs?.[0];
    
    if (pair?.baseToken?.symbol) {
      const updates = {
        token_symbol: pair.baseToken.symbol,
        token_name: pair.baseToken.name || null,
        token_image_url: pair.info?.imageUrl || call.token_image_url || null,
      };
      
      // Also update current mcap if available
      if (pair.marketCap && pair.marketCap > 0) {
        updates.current_market_cap = pair.marketCap;
        updates.current_multiplier = +(pair.marketCap / call.entry_market_cap).toFixed(2);
      }
      
      await sb(`calls?id=eq.${call.id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      console.log(`✅ Fixed: ${addr.slice(0,12)}... — "${symbol}" → "${updates.token_symbol}" (${updates.token_name || '-'})`);
      fixed++;
    } else {
      // DexScreener doesn't have it either — try Birdeye
      const BIRDEYE_KEY = envContent.match(/BIRDEYE_API_KEY=(.+)/)?.[1]?.trim();
      if (BIRDEYE_KEY) {
        await sleep(300);
        const bRes = await fetch(
          `https://public-api.birdeye.so/defi/token_overview?address=${addr}`,
          { headers: { 'X-API-KEY': BIRDEYE_KEY, 'x-chain': 'solana' } }
        );
        const bData = await bRes.json();
        if (bData?.success && bData?.data?.symbol) {
          const updates = {
            token_symbol: bData.data.symbol,
            token_name: bData.data.name || null,
          };
          if (bData.data.mc > 0) {
            updates.current_market_cap = Math.round(bData.data.mc);
            updates.current_multiplier = +(bData.data.mc / call.entry_market_cap).toFixed(2);
          }
          await sb(`calls?id=eq.${call.id}`, { method: 'PATCH', body: JSON.stringify(updates) });
          console.log(`✅ Fixed (Birdeye): ${addr.slice(0,12)}... — "${symbol}" → "${updates.token_symbol}"`);
          fixed++;
        } else {
          console.log(`⚠️  No data: ${addr.slice(0,12)}... (${symbol}) — entry=$${call.entry_market_cap}, ath=$${call.ath_market_cap}, keeping`);
          unchanged++;
        }
      } else {
        console.log(`⚠️  No data: ${addr.slice(0,12)}... (${symbol}) — entry=$${call.entry_market_cap}, ath=$${call.ath_market_cap}, keeping`);
        unchanged++;
      }
    }
  } catch (err) {
    console.log(`❌ Error: ${addr.slice(0,12)}... — ${err.message}`);
    unchanged++;
  }
  
  await sleep(1000); // DexScreener rate limit
}

// Recalculate stats
console.log('\n📊 Recalculating stats...');
const finalCalls = await sb(`calls?select=ath_multiplier,is_win&kol_id=eq.${KOL_ID}&entry_market_cap=gt.0`);
const totalCalls = finalCalls.length;
const wins = finalCalls.filter(c => c.is_win).length;
const winrate = totalCalls > 0 ? +((wins / totalCalls) * 100).toFixed(2) : 0;
const avgMult = totalCalls > 0 ? +(finalCalls.reduce((s, c) => s + (c.ath_multiplier || 1), 0) / totalCalls).toFixed(2) : 0;
const bestMult = Math.max(...finalCalls.map(c => c.ath_multiplier || 1));

await sb(`kols?id=eq.${KOL_ID}`, {
  method: 'PATCH',
  body: JSON.stringify({ total_calls: totalCalls, winning_calls: wins, winrate, avg_multiplier: avgMult, best_multiplier: bestMult }),
});

console.log(`\n📊 RESULTS: Fixed: ${fixed} | Deleted: ${deleted} | Unchanged: ${unchanged}`);
console.log(`📊 Stats: ${totalCalls} calls | ${winrate}% winrate | ${avgMult}x avg | ${bestMult}x best`);
