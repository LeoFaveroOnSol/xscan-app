import { FileText, AlertTriangle, Bot } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Discord Bot Terms of Service - XSCAN',
  description: 'Terms of Service for XSCAN Discord Bot - Real-Time Solana Alpha Scanner',
};

export default function DiscordTermsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] text-sm font-medium mb-4">
            <Bot className="w-4 h-4" />
            Discord Bot
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: February 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By adding XSCAN Bot to your Discord server or using any of its features, you agree 
              to be bound by these Terms of Service. If you do not agree to these terms, please 
              do not use the bot.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">XSCAN Discord Bot provides:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Real-time cryptocurrency token analysis and market data</li>
              <li>Alpha wallet activity tracking and alerts</li>
              <li>Call performance tracking and group leaderboards</li>
              <li>GitHub repository monitoring</li>
              <li>Market data aggregation from third-party sources</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. No Financial Advice</h2>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Important:</strong> XSCAN does not provide 
                  financial, investment, legal, or tax advice. All information provided by the bot 
                  is for informational and educational purposes only.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">You acknowledge that:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Cryptocurrency trading involves substantial risk of loss</li>
              <li>Past performance does not guarantee future results</li>
              <li>You are solely responsible for your trading decisions</li>
              <li>You should consult qualified professionals before making investment decisions</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. User Responsibilities</h2>
            <p className="text-muted-foreground mb-4">By using XSCAN, you agree to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the bot in compliance with Discord's Terms of Service</li>
              <li>Not attempt to abuse, exploit, or manipulate the bot</li>
              <li>Not use the bot for any illegal activities</li>
              <li>Not spam commands or overload the service</li>
              <li>Take full responsibility for your trading activities</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Data Accuracy</h2>
            <p className="text-muted-foreground mb-4">
              XSCAN aggregates data from third-party APIs and blockchain sources. While we strive 
              for accuracy:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>We do not guarantee the accuracy, completeness, or timeliness of data</li>
              <li>Price data may be delayed or differ from actual market prices</li>
              <li>Token analysis metrics are algorithmic estimates, not guarantees</li>
              <li>Users should verify information from multiple sources</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Service Availability</h2>
            <p className="text-muted-foreground mb-4">
              We aim to provide reliable service but do not guarantee:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Uninterrupted or error-free operation</li>
              <li>Availability at all times</li>
              <li>Compatibility with all servers or configurations</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We reserve the right to modify, suspend, or discontinue the service at any time 
              without notice.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-muted-foreground">
                XSCAN and its operators shall not be liable for any direct, indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of or inability 
                to use the service, including but not limited to financial losses from trading decisions.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The XSCAN name, logo, and bot functionality are proprietary. You may not copy, 
              modify, or distribute any part of the service without explicit permission.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to terminate or restrict access to XSCAN for any user or server 
              that violates these terms or engages in abusive behavior, without prior notice.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms of Service at any time. Continued use of the bot after 
              changes constitutes acceptance of the new terms. We encourage you to review this 
              page periodically.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">11. Contact</h2>
            <p className="text-muted-foreground mb-4">
              For questions about these Terms of Service, please contact us through our official channels:
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
          <Link href="/discord/privacy" className="text-muted-foreground hover:text-primary">
            Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
