import { Shield, Bot, Check, X } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Discord Bot Privacy Policy - XSCAN',
  description: 'Privacy Policy for XSCAN Discord Bot - How we handle your data',
};

export default function DiscordPrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] text-sm font-medium mb-4">
            <Bot className="w-4 h-4" />
            Discord Bot
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: February 2026
          </p>
        </div>

        {/* TL;DR Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-10">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">TL;DR:</strong> We collect minimal data necessary 
              to operate the bot. We don't sell your data. We don't store message content beyond 
              what's needed for features you use.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              This Privacy Policy explains how XSCAN ("we", "us", "our") collects, uses, and 
              protects information when you use our Discord bot. We are committed to protecting 
              your privacy and being transparent about our data practices.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Automatically Collected Data</h3>
            <p className="text-muted-foreground mb-4">
              When you interact with XSCAN, we may automatically collect:
            </p>
            
            {/* Data Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-foreground font-semibold">Data Type</th>
                    <th className="text-left py-3 px-4 text-foreground font-semibold">Purpose</th>
                    <th className="text-left py-3 px-4 text-foreground font-semibold">Retention</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Discord User ID</td>
                    <td className="py-3 px-4">Identify users for PNL tracking</td>
                    <td className="py-3 px-4">Until deletion requested</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Discord Server ID</td>
                    <td className="py-3 px-4">Configure bot settings per server</td>
                    <td className="py-3 px-4">Until bot is removed</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Command Usage</td>
                    <td className="py-3 px-4">Improve bot functionality</td>
                    <td className="py-3 px-4">30 days (anonymized)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Feature-Specific Data</h3>
            <p className="text-muted-foreground mb-4">Certain features require additional data collection:</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-card/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground">Call Tracking & PNL</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Optional</span>
                </div>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                  <li>Token addresses mentioned in messages</li>
                  <li>Timestamps of calls</li>
                  <li>Associated Discord User ID</li>
                </ul>
              </div>
              
              <div className="bg-card/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground">Wallet Tracking</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Optional</span>
                </div>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                  <li>Public wallet addresses you choose to track</li>
                  <li>Alert preferences</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Data We Do NOT Collect</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Private messages or DMs',
                'Messages where bot isn\'t mentioned',
                'Personal info (email, name, location)',
                'Financial info or private keys',
                'Voice or video data',
                'Passwords or credentials',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use collected data exclusively to:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Provide and operate bot features',
                'Track call performance and leaderboards',
                'Send requested alerts and notifications',
                'Improve bot performance and fix bugs',
                'Prevent abuse and enforce ToS',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. Data Storage & Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Data is stored on secure, encrypted servers</li>
              <li>Access is restricted to essential personnel only</li>
              <li>We use secure connections (HTTPS/WSS) for all data transfers</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Data Sharing</h2>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 mb-4">
              <p className="text-muted-foreground font-medium">
                We do not sell, trade, or rent your personal data to third parties.
              </p>
            </div>
            <p className="text-muted-foreground mb-4">
              We may share data only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">With your explicit consent</strong></li>
              <li><strong className="text-foreground">To comply with legal obligations</strong></li>
              <li><strong className="text-foreground">To protect our rights or prevent fraud</strong></li>
              <li><strong className="text-foreground">Aggregated, anonymized statistics</strong> (no personal identification)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              XSCAN integrates with third-party APIs to provide data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Birdeye</strong> — Token market data</li>
              <li><strong className="text-foreground">DexScreener</strong> — Price and liquidity data</li>
              <li><strong className="text-foreground">Helius</strong> — Blockchain transaction data</li>
              <li><strong className="text-foreground">Discord</strong> — Bot hosting platform</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              These services have their own privacy policies. We recommend reviewing them.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Access</strong> — Request a copy of your stored data</li>
              <li><strong className="text-foreground">Deletion</strong> — Request deletion of your data</li>
              <li><strong className="text-foreground">Correction</strong> — Request correction of inaccurate data</li>
              <li><strong className="text-foreground">Opt-out</strong> — Disable specific tracking features</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us through our official channels.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Server settings: Retained until bot is removed from server</li>
              <li>Call/PNL data: Retained for 90 days, then archived</li>
              <li>Usage logs: 30 days, then deleted or anonymized</li>
              <li>Upon request: Data deleted within 30 days</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              XSCAN is not intended for users under 13 years of age (or the minimum age in your 
              jurisdiction). We do not knowingly collect data from children. If you believe a 
              child has provided us data, please contact us for removal.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">10. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your data may be processed in countries other than your own. By using XSCAN, you 
              consent to the transfer of information to countries that may have different data 
              protection laws.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy periodically. We will notify users of significant 
              changes through our Discord announcements or bot messages. Continued use after 
              changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              For privacy-related questions or to exercise your data rights:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Telegram: <a href="https://t.me/xscanmonitor_bot" className="text-primary hover:underline">@xscanmonitor_bot</a>
              </li>
              <li>
                Twitter: <a href="https://twitter.com/XScan_" className="text-primary hover:underline">@XScan_</a>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-4">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
          <Link href="/discord/terms" className="text-muted-foreground hover:text-primary">
            Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
