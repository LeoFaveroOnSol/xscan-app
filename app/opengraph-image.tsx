import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'XSCAN - Track the best memecoin callers';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Gradient line at top */}
        <div
          style={{
            position: 'absolute',
            top: '160px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '500px',
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(0,255,136,0.4), transparent)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.03))',
              border: '1px solid rgba(0,255,136,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#00ff88',
            }}
          >
            X
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: '600',
              color: 'white',
              letterSpacing: '-0.5px',
            }}
          >
            XSCAN
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-2px',
              display: 'flex',
              gap: '16px',
            }}
          >
            <span>Track the best memecoin</span>
            <span style={{ color: '#00ff88' }}>callers</span>
            <span>.</span>
          </div>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-2px',
              display: 'flex',
              gap: '16px',
            }}
          >
            <span>Love</span>
            <span style={{ color: '#00ff88' }}>KOLs</span>
            <span>once again.</span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            fontSize: '20px',
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '1px',
          }}
        >
          xscan.wtf
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
