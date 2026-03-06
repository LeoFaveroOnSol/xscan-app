import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const kol1Handle = request.nextUrl.searchParams.get('kol1')?.replace('@', '') || '';
  const kol2Handle = request.nextUrl.searchParams.get('kol2')?.replace('@', '') || '';

  let kol1Name = kol1Handle, kol2Name = kol2Handle;
  let kol1Wr = '-', kol2Wr = '-';
  let kol1Avg = '-', kol2Avg = '-';

  try {
    const supabase = createServiceClient();
    const { data: kols } = await supabase
      .from('kols')
      .select('twitter_handle, display_name, winrate, avg_multiplier')
      .in('twitter_handle', [kol1Handle, kol2Handle]);

    if (kols) {
      const k1 = kols.find((k: any) => k.twitter_handle === kol1Handle);
      const k2 = kols.find((k: any) => k.twitter_handle === kol2Handle);
      if (k1) { kol1Name = k1.display_name || k1.twitter_handle; kol1Wr = `${(k1.winrate * 100).toFixed(0)}%`; kol1Avg = `${k1.avg_multiplier?.toFixed(1)}x`; }
      if (k2) { kol2Name = k2.display_name || k2.twitter_handle; kol2Wr = `${(k2.winrate * 100).toFixed(0)}%`; kol2Avg = `${k2.avg_multiplier?.toFixed(1)}x`; }
    }
  } catch {}

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#09090b', color: 'white', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', fontSize: 20, color: '#00ff88', marginBottom: 24 }}>XSCAN KOL COMPARISON</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{kol1Name}</div>
            <div style={{ fontSize: 16, color: '#888', marginTop: 4 }}>@{kol1Handle}</div>
            <div style={{ display: 'flex', marginTop: 16, gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: '#666' }}>Win Rate</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#00ff88' }}>{kol1Wr}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: '#666' }}>Avg</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{kol1Avg}</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#333' }}>VS</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{kol2Name}</div>
            <div style={{ fontSize: 16, color: '#888', marginTop: 4 }}>@{kol2Handle}</div>
            <div style={{ display: 'flex', marginTop: 16, gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: '#666' }}>Win Rate</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#00ff88' }}>{kol2Wr}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: '#666' }}>Avg</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{kol2Avg}</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 32, fontSize: 14, color: '#555' }}>xscan.wtf/compare</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
