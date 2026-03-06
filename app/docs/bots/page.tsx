import Link from 'next/link';
import { Bot, MessageSquare, Hash, Wallet, GitBranch, BarChart3, Trophy, TrendingUp, Bell, Settings, Users, Zap } from 'lucide-react';

function CommandBlock({ command, description, example }: { command: string; description: string; example?: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-card border border-border">
      <code className="text-primary font-mono font-semibold text-sm">{command}</code>
      <span className="text-sm text-muted-foreground">{description}</span>
      {example && (
        <span className="text-xs text-muted-foreground/70 font-mono">Example: {example}</span>
      )}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="text-muted-foreground text-sm space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function BotsDocsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Bot className="w-4 h-4" />
          Bots
        </div>
        <h1 className="text-4xl font-bold mb-4">XSCAN Bots</h1>
        <p className="text-xl text-muted-foreground">
          Real-time token tracking, group analytics, wallet monitoring, and GitHub alerts — available on Telegram and Discord.
        </p>
      </div>

      {/* Bot Links */}
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <a
          href="https://t.me/xscanmonitor_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6 text-[#26A5E4]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">Telegram Bot</h3>
              <p className="text-sm text-muted-foreground">@xscanmonitor_bot</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">DM commands + add to groups for auto token tracking</p>
        </a>

        <a
          href="https://discord.com/oauth2/authorize?client_id=1473263963717242901&permissions=277025770560&scope=bot+applications.commands"
          target="_blank"
          rel="noopener noreferrer"
          className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
            </svg>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">Discord Bot</h3>
              <p className="text-sm text-muted-foreground">Xscan#5866</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Slash commands with rich embeds and auto token detection</p>
        </a>
      </div>

      {/* ============ TELEGRAM ============ */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-7 h-7 text-[#26A5E4]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <h2 className="text-3xl font-bold">Telegram Bot</h2>
        </div>
        <p className="text-muted-foreground mb-8">
          Works in DMs for personal alerts and in groups for automatic token analysis.
          Add <a href="https://t.me/xscanmonitor_bot" className="text-primary hover:underline">@xscanmonitor_bot</a> to your group and every contract address or $TICKER posted will be automatically scanned.
        </p>

        {/* Auto Token Detection */}
        <FeatureCard icon={Zap} title="Auto Token Detection">
          <p>
            Drop any Solana contract address or $TICKER in a group where the bot is present — it will automatically analyze the token and reply with a full breakdown including market cap, liquidity, volume, holder analysis, and social links.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Multi-chain support: Solana, Ethereum, BSC, Base, and more — auto-detected.
          </p>
        </FeatureCard>

        {/* Group Commands */}
        <h3 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Group Commands
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          These commands work in groups where the bot is added. Every token posted is tracked with the caller&apos;s username, entry market cap, and ATH reached.
        </p>
        <div className="grid gap-3 mb-8">
          <CommandBlock
            command="/ga"
            description="Group Analytics — shows all tracked calls with stats: avg gain, hit rates, migration rate, chain dominance, top callers, and every call ranked by ATH performance."
            example="/ga or /ga 24h or /ga 20"
          />
          <CommandBlock
            command="/ga [hours]h"
            description="Filter calls by time window. Shows only calls from the last N hours."
            example="/ga 5h — calls from last 5 hours"
          />
          <CommandBlock
            command="/ga [count]"
            description="Limit the number of calls shown (max 100)."
            example="/ga 30 — last 30 calls"
          />
          <CommandBlock
            command="/pnl [address or $ticker]"
            description="Generate a visual PNL card for a specific token call. Shows entry, current price, ATH, multiplier, and caller info as an image."
            example="/pnl $WIF or /pnl 7GCihgDB8..."
          />
          <CommandBlock
            command="/flex [address or $ticker]"
            description="Alias for /pnl — same visual PNL card."
            example="/flex $BONK"
          />
          <CommandBlock
            command="/top"
            description="Leaderboard — ranks callers by average multiplier with hit rates and stats."
            example="/top or /leaderboard or /lb"
          />
        </div>

        {/* DM Commands */}
        <h3 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          DM Commands (Private Chat)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Message the bot directly for personal KOL alert management.
        </p>
        <div className="grid gap-3 mb-8">
          <CommandBlock
            command="/start"
            description="Get started — shows welcome message and available commands."
          />
          <CommandBlock
            command="/channels"
            description="List all monitored KOL channels with subscriber counts."
          />
          <CommandBlock
            command="/subscribe [channel]"
            description="Subscribe to alerts from a specific KOL channel. Get notified when they post a new call."
            example="/subscribe @elixirgems"
          />
          <CommandBlock
            command="/unsubscribe [channel]"
            description="Stop receiving alerts from a channel."
            example="/unsubscribe @elixirgems"
          />
          <CommandBlock
            command="/mysubs"
            description="View your current subscriptions."
          />
          <CommandBlock
            command="/stats"
            description="Show bot statistics — total channels monitored, calls tracked, and active users."
          />
          <CommandBlock
            command="/dailyresume"
            description="Get a daily summary of the best performing calls across all tracked channels."
          />
        </div>

        {/* Alert Settings */}
        <h3 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Alert Filters
        </h3>
        <div className="grid gap-3 mb-8">
          <CommandBlock
            command="/settings"
            description="View your current filter settings (min/max market cap)."
          />
          <CommandBlock
            command="/setminmcap [value]"
            description="Set minimum market cap filter — only receive alerts for tokens above this mcap."
            example="/setminmcap 50000"
          />
          <CommandBlock
            command="/setmaxmcap [value]"
            description="Set maximum market cap filter — only receive alerts for tokens below this mcap."
            example="/setmaxmcap 5000000"
          />
        </div>

        {/* Channel Suggestions */}
        <h3 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Channel Suggestions
        </h3>
        <div className="grid gap-3 mb-8">
          <CommandBlock
            command="/suggest [channel]"
            description="Suggest a new KOL channel for the bot to monitor."
            example="/suggest @newkolgems"
          />
          <CommandBlock
            command="/mysuggestions"
            description="View your submitted channel suggestions and their status."
          />
        </div>

        {/* GitHub Tracking */}
        <h3 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          GitHub Tracking
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Track any GitHub repository for commits, releases, description changes, and star milestones.
        </p>
        <div className="grid gap-3 mb-8">
          <CommandBlock
            command="/github"
            description="Show GitHub tracking help."
          />
          <CommandBlock
            command="/github track [owner/repo]"
            description="Start tracking a GitHub repository. Alerts for new commits, releases, and changes."
            example="/github track solana-labs/solana"
          />
          <CommandBlock
            command="/github untrack [owner/repo]"
            description="Stop tracking a repository."
            example="/github untrack solana-labs/solana"
          />
          <CommandBlock
            command="/github list"
            description="List all repositories being tracked in this chat."
          />
        </div>

        {/* Wallet Tracking */}
        <h3 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Wallet Tracking
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Real-time wallet monitoring via Helius webhooks. Get instant alerts for buys, sells, and swaps.
        </p>
        <div className="grid gap-3 mb-8">
          <CommandBlock
            command="/wallet"
            description="Show wallet tracking help."
          />
          <CommandBlock
            command="/wallet track [address] [label]"
            description="Start tracking a Solana wallet. Optional label for easy identification."
            example='/wallet track 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU "Smart Money #1"'
          />
          <CommandBlock
            command="/wallet untrack [address]"
            description="Stop tracking a wallet."
          />
          <CommandBlock
            command="/wallet list"
            description="List all wallets being tracked in this chat."
          />
        </div>

        {/* KOL Channel Monitoring */}
        <FeatureCard icon={TrendingUp} title="KOL Channel Monitoring">
          <p>
            XSCAN monitors 18+ top Solana KOL channels in real-time. When a KOL posts a new call, it gets tracked automatically with:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Entry market cap at time of call</li>
            <li>Continuous ATH tracking</li>
            <li>Achievement milestones (2x, 3x, 5x, 10x, 20x, 50x, 100x) with custom animated GIFs</li>
            <li>All data visible on <a href="https://xscan.wtf" className="text-primary hover:underline">xscan.wtf</a></li>
          </ul>
        </FeatureCard>

        <FeatureCard icon={Trophy} title="Achievement System">
          <p>
            When a KOL&apos;s call hits a milestone (2x, 3x, 5x...), a custom animated GIF is posted to the achievements channel. Each milestone has a unique visual.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Achievements are based on ATH reached after the call was made — not pump-and-dump spikes before the call.
          </p>
        </FeatureCard>
      </section>

      {/* ============ DISCORD ============ */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-7 h-7 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
          </svg>
          <h2 className="text-3xl font-bold">Discord Bot</h2>
        </div>
        <p className="text-muted-foreground mb-8">
          Full slash command support with rich embeds. Add to your server and drop any contract address or $TICKER — the bot auto-scans it.
        </p>

        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-primary" />
          Slash Commands
        </h3>
        <div className="grid gap-3 mb-8">
          <CommandBlock
            command="/scan [token]"
            description="Analyze any token — enter a contract address or $TICKER. Returns full breakdown with market cap, liquidity, volume, holder analysis, and links."
            example="/scan $WIF"
          />
          <CommandBlock
            command="/github track [repo]"
            description="Track a GitHub repository for commits, releases, and changes."
            example="/github track solana-labs/solana"
          />
          <CommandBlock
            command="/github untrack [repo]"
            description="Stop tracking a repository."
          />
          <CommandBlock
            command="/github list"
            description="List tracked repositories in this server."
          />
          <CommandBlock
            command="/wallet track [address] [label]"
            description="Track a Solana wallet with real-time buy/sell/swap alerts."
            example="/wallet track 7xKXtg... Smart Money"
          />
          <CommandBlock
            command="/wallet untrack [address]"
            description="Stop tracking a wallet."
          />
          <CommandBlock
            command="/wallet list"
            description="List tracked wallets."
          />
          <CommandBlock
            command="/ping"
            description="Check if the bot is online."
          />
          <CommandBlock
            command="/help"
            description="Show all available commands."
          />
        </div>

        <FeatureCard icon={Zap} title="Auto Token Detection">
          <p>
            Just like Telegram, the Discord bot detects contract addresses and $TICKER mentions automatically. No command needed — just paste and it scans.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Features Rick-style embeds with color-coded holder analysis (80/20 split, top wallets, insider detection).
          </p>
        </FeatureCard>
      </section>

      {/* ============ TOKEN SCAN BREAKDOWN ============ */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          What&apos;s in a Token Scan?
        </h2>
        <p className="text-muted-foreground mb-6">
          Every scan provides a comprehensive analysis:
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <h4 className="font-semibold mb-2">📊 Market Data</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Market Cap & FDV</li>
              <li>• Liquidity & Liq Multiplier</li>
              <li>• 24h Volume</li>
              <li>• 1h/6h/24h Price Change</li>
              <li>• Buy/Sell ratio (1h)</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <h4 className="font-semibold mb-2">👥 Holder Analysis</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Total holders</li>
              <li>• Top 10 holders breakdown</li>
              <li>• 80/20 concentration analysis</li>
              <li>• Insider/team wallet detection</li>
              <li>• Dev wallet status</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <h4 className="font-semibold mb-2">🔗 Quick Links</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• DexScreener chart</li>
              <li>• BullX trading link</li>
              <li>• Twitter / Website (if available)</li>
              <li>• Telegram community</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <h4 className="font-semibold mb-2">🌐 Multi-Chain</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Solana (primary)</li>
              <li>• Ethereum</li>
              <li>• Base</li>
              <li>• BSC & more</li>
              <li>• Auto-detected from address</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ GETTING STARTED ============ */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
            <div>
              <h4 className="font-semibold mb-1">Add the bot</h4>
              <p className="text-sm text-muted-foreground">
                Click <a href="https://t.me/xscanmonitor_bot" className="text-primary hover:underline">@xscanmonitor_bot</a> on Telegram or invite the Discord bot to your server.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
            <div>
              <h4 className="font-semibold mb-1">Add to your group</h4>
              <p className="text-sm text-muted-foreground">
                Add the bot to any Telegram group or Discord server. It needs message read permissions to detect tokens.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
            <div>
              <h4 className="font-semibold mb-1">Start posting tokens</h4>
              <p className="text-sm text-muted-foreground">
                Paste any contract address or type $TICKER — the bot will auto-scan and track every call made in the group with the caller&apos;s name and entry price.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">4</div>
            <div>
              <h4 className="font-semibold mb-1">Check analytics</h4>
              <p className="text-sm text-muted-foreground">
                Use <code className="text-primary">/ga</code> to see all calls and group performance, <code className="text-primary">/pnl</code> for individual token cards, and <code className="text-primary">/top</code> for caller rankings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5 text-center">
        <h3 className="text-2xl font-bold mb-2">Ready to track?</h3>
        <p className="text-muted-foreground mb-4">Add XSCAN to your group and turn every call into data.</p>
        <p className="text-xs text-muted-foreground mb-6">
          Built by{' '}
          <a href="https://x.com/leofaveroo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">@leofaveroo</a>
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="https://t.me/xscanmonitor_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Add to Telegram
          </a>
          <a
            href="https://t.me/xscancalls"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card font-semibold hover:border-primary/50 transition-colors"
          >
            📢 @xscancalls
          </a>
        </div>
      </div>
    </div>
  );
}
