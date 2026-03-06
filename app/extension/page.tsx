import type { Metadata } from 'next';
import { Download, Shield, Puzzle, Monitor, Keyboard, ChevronRight, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'XSCAN Extension — Chrome Extension for axiom.trade',
  description: 'Real-time alpha calls from XSCAN directly on axiom.trade. Free Chrome extension.',
};

const steps = [
  {
    number: '1',
    title: 'Download the extension',
    description: 'Click the button below to download the .zip file.',
  },
  {
    number: '2',
    title: 'Unzip the file',
    description: 'Extract the downloaded .zip to a folder on your computer.',
  },
  {
    number: '3',
    title: 'Open Chrome Extensions',
    description: (
      <>
        Go to <code className="px-2 py-0.5 rounded bg-white/5 text-primary font-mono text-sm">chrome://extensions/</code> in your browser.
      </>
    ),
  },
  {
    number: '4',
    title: 'Enable Developer Mode',
    description: 'Toggle the "Developer mode" switch in the top right corner.',
  },
  {
    number: '5',
    title: 'Load unpacked',
    description: 'Click "Load unpacked" and select the extracted folder.',
  },
  {
    number: '6',
    title: 'Open axiom.trade',
    description: 'Navigate to axiom.trade — the XSCAN panel appears automatically.',
  },
];

const features = [
  {
    icon: <Monitor className="w-5 h-5" />,
    title: 'Floating Panel',
    description: 'Latest calls with token image, symbol, entry MC, ATH multiplier, and channel — right on your trading screen.',
  },
  {
    icon: <Puzzle className="w-5 h-5" />,
    title: 'Chart Bubbles',
    description: 'When viewing a token chart, see exactly when each channel called it with visual markers.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Live Updates',
    description: 'Real-time websocket connection to XSCAN database. New calls appear instantly.',
  },
  {
    icon: <Keyboard className="w-5 h-5" />,
    title: 'Keyboard Shortcut',
    description: 'Press Alt+X to toggle the panel. Draggable and resizable.',
  },
];

export default function ExtensionPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-6">
            <Puzzle className="w-3.5 h-3.5" />
            Chrome Extension
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            XSCAN on <span className="text-primary">axiom.trade</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Real-time alpha calls directly on your trading screen. See what channels are calling — without leaving Axiom.
          </p>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mb-16">
          <a
            href="/xscan-extension.zip"
            download="xscan-extension.zip"
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-black font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            <Download className="w-6 h-6" />
            Download Extension
            <span className="text-sm font-normal opacity-70">v1.3.0 • 23KB</span>
          </a>
        </div>

        {/* Security Notice */}
        <div className="mb-16 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-500 font-semibold text-sm mb-1">Sideloaded Extension</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                This extension is not on the Chrome Web Store yet. You need to install it manually using Developer Mode. 
                Chrome may show a warning — this is normal for unpacked extensions. 
                The extension only runs on <code className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 font-mono text-xs">axiom.trade</code> and 
                connects to XSCAN&apos;s public API. No data is collected, no permissions beyond what&apos;s needed.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">Features</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#111113] border border-[#1a1a1f]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Install Steps */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">How to install</h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[#111113] border border-[#1a1a1f]">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl bg-[#111113] border border-[#1a1a1f]">
          <p className="text-zinc-400 mb-4">
            Want alerts on Telegram too?
          </p>
          <a
            href="https://t.me/xscancalls"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-semibold text-sm"
          >
            Join @xscancalls
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </div>
  );
}
