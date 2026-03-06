'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const faqCategories = [
  {
    name: 'General',
    faqs: [
      {
        question: 'What is XSCAN?',
        answer:
          'XSCAN is a platform that tracks and ranks crypto influencers (KOLs) based on their call performance. We monitor their tweets, detect token contract addresses they share, and track how those tokens perform over time. This gives you verified, on-chain data about which KOLs actually make profitable calls.',
      },
      {
        question: 'Is XSCAN free to use?',
        answer:
          'Yes, XSCAN is free to use for viewing the leaderboard and basic KOL stats. Premium features may require holding $XSCAN tokens in the future.',
      },
      {
        question: 'How often is the data updated?',
        answer:
          'Tweet scanning runs every 5 minutes to detect new calls from monitored KOLs. Price updates run every 15 minutes to track token performance and update ATH (All-Time High) data.',
      },
      {
        question: 'Which blockchain does XSCAN support?',
        answer:
          'XSCAN currently supports Solana only. We track Solana SPL tokens and use Solana wallet connections for verification.',
      },
    ],
  },
  {
    name: 'Scoring & Metrics',
    faqs: [
      {
        question: 'How is the winrate calculated?',
        answer:
          'A "win" is defined as a call that reaches 2x or more from the entry market cap within the monitoring period (typically 48 hours). The winrate is the percentage of winning calls out of total calls: (Winning Calls / Total Calls) × 100%.',
      },
      {
        question: 'What is the average multiplier?',
        answer:
          'The average multiplier is the mean ATH (All-Time High) multiplier across all of a KOL\'s calls. For example, if a KOL has three calls with ATH multipliers of 3x, 5x, and 2x, their average multiplier would be (3+5+2)/3 = 3.33x.',
      },
      {
        question: 'What does "Best Call" mean?',
        answer:
          'Best Call refers to the highest ATH multiplier achieved by any single call from that KOL. It represents their single best-performing recommendation.',
      },
      {
        question: 'How are the tiers (Elite, Good, Average, Poor) determined?',
        answer:
          'Tiers are based on winrate: Elite (70%+), Good (50-69%), Average (30-49%), and Poor (below 30%). These thresholds help users quickly identify top-performing KOLs.',
      },
      {
        question: 'What is the entry market cap?',
        answer:
          'Entry market cap is the token\'s market capitalization at the moment the KOL made the call (tweeted about it). This is used as the baseline to calculate all multipliers.',
      },
    ],
  },
  {
    name: 'Side Wallets',
    faqs: [
      {
        question: 'What are side wallets?',
        answer:
          'Side wallets are secondary wallets that some KOLs use to trade before or after making public calls. For example, a KOL might buy a token with their side wallet, then promote it to their followers, and sell when the price pumps.',
      },
      {
        question: 'How does XSCAN detect side wallets?',
        answer:
          'We analyze on-chain transaction patterns, wallet interactions, and timing correlations to identify wallets that may be linked to a KOL. This includes looking at wallets that consistently buy before calls and sell during pumps.',
      },
      {
        question: 'Why is side wallet detection important?',
        answer:
          'Side wallet detection protects followers from being "exit liquidity" - where the KOL profits by selling into the demand created by their own followers. It promotes accountability and trust in the KOL space.',
      },
    ],
  },
  {
    name: 'For KOLs',
    faqs: [
      {
        question: 'How can I get listed as a KOL?',
        answer:
          'Click the "Apply as KOL" button on the homepage and fill out the application form. You\'ll need to connect your Solana wallet for verification, provide your Twitter handle, and show proof of your past calls. Our team reviews applications and approves legitimate KOLs with verifiable track records.',
      },
      {
        question: 'What are the requirements to be listed?',
        answer:
          'We look for KOLs with an active Twitter presence, a history of making token calls, and a verifiable track record. Having a substantial following helps but isn\'t strictly required - we focus more on the quality and transparency of calls.',
      },
      {
        question: 'Can I remove myself from XSCAN?',
        answer:
          'Yes, verified KOLs can request to have their profile removed. Contact us through our official channels. Note that historical data may be retained for transparency purposes.',
      },
      {
        question: 'How do I update my profile information?',
        answer:
          'Profile information is automatically synced from Twitter. For other updates, contact our team through official channels.',
      },
    ],
  },
  {
    name: '$XSCAN Token',
    faqs: [
      {
        question: 'What is the $XSCAN token?',
        answer:
          'XSCAN has a native token that powers the ecosystem. It\'s a Solana SPL token with deflationary mechanics built in through automatic buybacks and burns.',
      },
      {
        question: 'How does the auto buyback and burn work?',
        answer:
          '15% of all creator fees generated on the platform are automatically used to buy $XSCAN tokens from the open market. These tokens are then permanently burned, reducing the total supply over time.',
      },
      {
        question: 'What utility does the token provide?',
        answer:
          'Token holders get access to premium features like advanced analytics, real-time alerts, and priority access to new features. Future governance rights may also be implemented.',
      },
      {
        question: 'Where can I buy $XSCAN?',
        answer:
          '$XSCAN can be traded on decentralized exchanges on Solana. Check our official channels for verified contract addresses and trading pairs.',
      },
    ],
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-8">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleItem = (category: string, index: number) => {
    setOpenItems((prev) => ({
      ...prev,
      [category]: prev[category] === index ? null : index,
    }));
  };

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.faqs.length > 0);

  const displayCategories = activeCategory
    ? filteredCategories.filter((c) => c.name === activeCategory)
    : filteredCategories;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </div>
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about XSCAN
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeCategory === null
                ? 'bg-primary text-white'
                : 'bg-card border border-border hover:border-primary/50'
            )}
          >
            All
          </button>
          {faqCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeCategory === category.name
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border hover:border-primary/50'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {displayCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No questions found matching your search.</p>
            </div>
          ) : (
            displayCategories.map((category) => (
              <div key={category.name}>
                <h2 className="text-lg font-semibold mb-4 text-primary">{category.name}</h2>
                <div className="bg-card border border-border rounded-xl px-6">
                  {category.faqs.map((faq, index) => (
                    <FAQItem
                      key={index}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openItems[category.name] === index}
                      onToggle={() => toggleItem(category.name, index)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Reach out to us on Twitter or Discord.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://x.com/XScan_"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
            >
              Twitter/X
            </a>
            <Link
              href="/docs"
              className="px-6 py-2.5 rounded-lg bg-card border border-border hover:border-primary/50 font-medium transition-colors"
            >
              Read Docs
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
