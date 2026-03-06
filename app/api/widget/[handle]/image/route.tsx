import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const cleanHandle = handle.replace('@', '');

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: kol } = await supabase
    .from('kols')
    .select('*')
    .eq('twitter_handle', cleanHandle)
    .eq('is_active', true)
    .single();

  if (!kol) {
    return new Response('KOL not found', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const isLight = searchParams.get('theme') === 'light';

  const bg = isLight ? '#f4f4f5' : '#0f0f13';
  const cardBg = isLight ? '#ffffff' : '#18181b';
  const text = isLight ? '#09090b' : '#fafafa';
  const muted = isLight ? '#71717a' : '#a1a1aa';
  const accent = '#22c55e';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: bg,
          padding: '16px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            background: cardBg,
            borderRadius: '16px',
            padding: '20px 24px',
            border: `1px solid ${isLight ? '#e4e4e7' : '#27272a'}`,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {kol.profile_image_url && (
              <img
                src={kol.profile_image_url}
                width={40}
                height={40}
                style={{ borderRadius: '50%' }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ color: text, fontSize: '18px', fontWeight: 700 }}>
                {kol.display_name || kol.twitter_handle}
              </div>
              <div style={{ color: muted, fontSize: '13px' }}>@{kol.twitter_handle}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ color: accent, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
                ✓ Verified by XSCAN
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {[
              { label: 'Win Rate', value: `${(kol.winrate || 0).toFixed(1)}%`, color: accent },
              { label: 'Total Calls', value: String(kol.total_calls || 0), color: text },
              { label: 'Avg Multi', value: `${(kol.avg_multiplier || 0).toFixed(1)}x`, color: text },
              { label: 'Best Call', value: `${(kol.best_multiplier || 0).toFixed(1)}x`, color: '#facc15' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  padding: '10px 8px',
                }}
              >
                <div style={{ color: stat.color, fontSize: '20px', fontWeight: 700 }}>{stat.value}</div>
                <div style={{ color: muted, fontSize: '10px', marginTop: '2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <div style={{ color: muted, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' as const }}>xscan.app</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 480,
      height: 220,
    }
  );
}
