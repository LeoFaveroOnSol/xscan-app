<div align="center">

# ⚡ XSCAN

**Track crypto KOL calls, win rates, and token performance across Solana, Base & EVM chains**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/LeoFaveroOnSol/xscan-app)](https://github.com/LeoFaveroOnSol/xscan-app/commits)
[![Stars](https://img.shields.io/github/stars/LeoFaveroOnSol/xscan-app?style=social)](https://github.com/LeoFaveroOnSol/xscan-app/stargazers)
[![Issues](https://img.shields.io/github/issues/LeoFaveroOnSol/xscan-app)](https://github.com/LeoFaveroOnSol/xscan-app/issues)

[Website](https://xscan.wtf) | [Twitter](https://x.com/XScan_) | [Telegram](https://t.me/xscancalls)

</div>

---

## What is XSCAN?

XSCAN is a real-time intelligence platform for crypto traders who follow KOL (Key Opinion Leader) calls. It monitors Twitter accounts and Telegram channels, detects token mentions, tracks price performance from the moment of the call, and ranks callers by actual results — not hype.

Whether you want to know which influencer actually has a good win rate, spot new calls the moment they drop, or catch deleted tweets before they vanish — XSCAN does it automatically.

**Try it live at [xscan.wtf](https://xscan.wtf)**

---

## Features

- **KOL Profiles** — Win rate, average multiplier, best calls, full call history per influencer
- **Real-time Alerts** — Instant detection of new token calls from monitored accounts
- **Achievement Tracker** — Milestone notifications when calls hit 2x, 5x, 10x, 50x, 100x
- **Deleted Tweet Detection** — Track which KOLs delete their losing calls (and how often)
- **Telegram Channel Monitoring** — Rank and compare Telegram call channels alongside Twitter
- **Leaderboards** — Top callers ranked by performance metrics across time periods
- **Flex Cards** — Shareable stat cards for any KOL (PNG export, ready for Twitter)
- **Admin Panel** — Full management of KOLs, calls, channels, and automation pipelines

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/LeoFaveroOnSol/xscan-app.git
cd xscan-app

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in your Supabase credentials and API keys

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see it running.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Realtime) |
| Hosting | Vercel |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Custom admin authentication |
| Mobile | Capacitor (iOS + Android) |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

See [`.env.example`](.env.example) for the full list.

---

## Project Structure

```
├── app/                # Next.js App Router pages and API routes
│   ├── admin/          # Admin panel
│   ├── api/            # Backend API endpoints
│   ├── kol/            # KOL profile pages
│   └── ...
├── components/         # React components
├── lib/                # Utilities, Supabase client, helpers
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── supabase/           # Database migrations and config
├── scripts/            # Automation and data scripts
├── public/             # Static assets
└── android/ & ios/     # Capacitor mobile builds
```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/something`)
3. Commit your changes (`git commit -m 'Add something'`)
4. Push to the branch (`git push origin feature/something`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ☕ by the XSCAN team — [xscan.wtf](https://xscan.wtf)

</div>
