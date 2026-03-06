import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ theme?: string; compact?: string }>;
}

async function getKOL(handle: string) {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('kols')
    .select('*')
    .eq('twitter_handle', handle.replace('@', ''))
    .eq('is_active', true)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const kol = await getKOL(handle);
  if (!kol) return { title: 'Widget - XSCAN' };
  return {
    title: `${kol.display_name || kol.twitter_handle} - XSCAN Widget`,
    other: { 'X-Frame-Options': '' },
  };
}

export default async function WidgetPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const { theme: themeParam, compact: compactParam } = await searchParams;
  const kol = await getKOL(handle);
  if (!kol) notFound();

  const isLight = themeParam === 'light';
  const isCompact = compactParam === 'true';

  const bg = isLight ? '#ffffff' : '#0f0f13';
  const cardBg = isLight ? '#f4f4f5' : '#18181b';
  const border = isLight ? '#e4e4e7' : '#27272a';
  const text = isLight ? '#09090b' : '#fafafa';
  const textMuted = isLight ? '#71717a' : '#a1a1aa';
  const accent = '#22c55e';

  const profileUrl = `https://xscan5.vercel.app/kol/${kol.twitter_handle}`;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${bg}; }
          a { text-decoration: none; color: inherit; }
        `}} />
      </head>
      <body>
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={{
          display: 'block',
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: '12px',
          padding: isCompact ? '12px 16px' : '16px 20px',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isCompact ? '8px' : '12px' }}>
            {kol.profile_image_url && (
              <img
                src={kol.profile_image_url}
                alt={kol.display_name || kol.twitter_handle}
                width={isCompact ? 28 : 36}
                height={isCompact ? 28 : 36}
                style={{ borderRadius: '50%', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: text, fontWeight: 700, fontSize: isCompact ? '13px' : '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {kol.display_name || kol.twitter_handle}
              </div>
              <div style={{ color: textMuted, fontSize: '11px' }}>@{kol.twitter_handle}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ color: accent, fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Verified by XSCAN</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
            gap: '8px',
          }}>
            <StatBox label="Win Rate" value={`${(kol.winrate || 0).toFixed(1)}%`} color={accent} textColor={text} mutedColor={textMuted} />
            <StatBox label="Total Calls" value={String(kol.total_calls || 0)} color={text} textColor={text} mutedColor={textMuted} />
            {!isCompact && (
              <>
                <StatBox label="Avg Multi" value={`${(kol.avg_multiplier || 0).toFixed(1)}x`} color={text} textColor={text} mutedColor={textMuted} />
                <StatBox label="Best Call" value={`${(kol.best_multiplier || 0).toFixed(1)}x`} color="#facc15" textColor={text} mutedColor={textMuted} />
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '8px', textAlign: 'right' }}>
            <span style={{ color: textMuted, fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase' }}>xscan.app</span>
          </div>
        </a>
      </body>
    </html>
  );
}

function StatBox({ label, value, color, textColor, mutedColor }: { label: string; value: string; color: string; textColor: string; mutedColor: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '8px 10px',
      textAlign: 'center',
    }}>
      <div style={{ color, fontSize: '16px', fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
      <div style={{ color: mutedColor, fontSize: '10px', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}
