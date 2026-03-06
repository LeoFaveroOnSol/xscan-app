# XSCAN

**KOL Call Tracker for Solana, Base & EVM chains.**

Track crypto KOL (Key Opinion Leader) calls in real-time. See who's calling what, win rates, ATH multipliers, deleted tweets, and more.

🔗 **Live:** [xscan.wtf](https://xscan.wtf)

## Features

- 📊 **KOL Profiles** — Win rate, avg multiplier, best calls, call history
- 🔔 **Real-time Alerts** — New calls detected from monitored channels
- 📈 **Achievement Tracker** — Milestone notifications (2x, 5x, 10x, 50x, 100x)
- 🗑️ **Deleted Tweet Detection** — Track deletion rates per KOL
- 📱 **Telegram Channels** — Monitor and rank Telegram call channels
- 🏆 **Leaderboards** — Top callers ranked by performance
- 🖼️ **Flex Cards** — Shareable KOL stat cards (PNG export)
- 🔐 **Admin Panel** — Manage KOLs, calls, channels, and automation

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Custom admin auth

## Setup

```bash
# Install dependencies
npm install

# Copy env
cp .env.example .env.local
# Fill in your Supabase credentials

# Run dev server
npm run dev
```

## Environment Variables

See `.env.example` for all required variables.

## License

MIT
