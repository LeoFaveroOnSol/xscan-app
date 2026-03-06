// Lightweight client-side analytics tracker (< 2KB)

let lastTracked = '';

function getUTMParams(): Record<string, string> {
  const params: Record<string, string> = {};
  if (typeof window === 'undefined') return params;
  const sp = new URLSearchParams(window.location.search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const val = sp.get(key);
    if (val) params[key] = val;
  }
  return params;
}

export function trackPageView(path?: string) {
  if (typeof window === 'undefined') return;

  const p = path || window.location.pathname;

  // Dedupe same path within 2s
  const key = `${p}:${Math.floor(Date.now() / 2000)}`;
  if (key === lastTracked) return;
  lastTracked = key;

  const body: Record<string, string> = {
    path: p,
    referrer: document.referrer || '',
    ...getUTMParams(),
  };

  // Use sendBeacon for reliability, fall back to fetch
  const payload = JSON.stringify(body);
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }));
  } else {
    fetch('/api/analytics/track', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
}
