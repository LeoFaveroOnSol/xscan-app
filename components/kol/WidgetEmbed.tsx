'use client';

import { useState } from 'react';

interface WidgetEmbedProps {
  handle: string;
}

const BASE_URL = 'https://xscan5.vercel.app';

export default function WidgetEmbed({ handle }: WidgetEmbedProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const widgetUrl = `${BASE_URL}/widget/${handle}`;
  const imageUrl = `${BASE_URL}/api/widget/${handle}/image`;
  const profileUrl = `${BASE_URL}/kol/${handle}`;

  const codes = [
    {
      label: 'HTML Embed (iframe)',
      id: 'iframe',
      code: `<iframe src="${widgetUrl}" width="400" height="200" frameborder="0" style="border:none;border-radius:12px;"></iframe>`,
    },
    {
      label: 'Image Link (for Twitter/socials)',
      id: 'image',
      code: imageUrl,
    },
    {
      label: 'Markdown',
      id: 'markdown',
      code: `[![XSCAN Stats](${imageUrl})](${profileUrl})`,
    },
  ];

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
        Get Widget
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Embeddable Widget</h3>
        <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Preview */}
      <div className="mb-4 rounded-lg overflow-hidden border border-zinc-800">
        <iframe src={widgetUrl} width="100%" height="180" style={{ border: 'none' }} />
      </div>

      {/* Embed codes */}
      <div className="space-y-3">
        {codes.map(({ label, id, code }) => (
          <div key={id}>
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-zinc-300 bg-zinc-950 px-3 py-2 rounded-lg overflow-x-auto whitespace-nowrap block">
                {code}
              </code>
              <button
                onClick={() => copyToClipboard(code, id)}
                className="shrink-0 px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                {copied === id ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
