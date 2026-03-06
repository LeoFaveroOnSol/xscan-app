'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const faqs = [
  {
    question: 'What is XSCAN?',
    answer:
      'XSCAN is a platform that tracks and ranks crypto influencers (KOLs) based on their call performance. We monitor their tweets, detect token contract addresses they share, and track how those tokens perform over time.',
  },
  {
    question: 'How is the winrate calculated?',
    answer:
      'A "win" is defined as a call that reaches 2x or more from the entry market cap. The winrate is simply the percentage of winning calls out of total calls. All data is based on actual on-chain token performance.',
  },
  {
    question: 'KOL vs Influencer?',
    answer:
      'KOLs (Key Opinion Leaders) are influencers who specifically make token calls with contract addresses. We track their performance to separate legitimate callers from those who may not have your best interests at heart.',
  },
  {
    question: 'What are side wallets?',
    answer:
      'Side wallets are secondary wallets that some KOLs use to trade before or after making public calls. XSCAN tracks linked wallets to detect this behavior and protect followers.',
  },
  {
    question: 'How can I get listed?',
    answer:
      'Click the "Apply as KOL" button and fill out the application form. You\'ll need to provide your Twitter handle and show proof of your past calls. Our team reviews and approves legitimate KOLs.',
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
    <div
      className={cn(
        'rounded-xl border transition-all duration-200 cursor-pointer',
        isOpen
          ? 'border-primary/30 bg-primary/[0.02]'
          : 'border-white/[0.06] bg-transparent hover:border-white/[0.1]'
      )}
      onClick={onToggle}
    >
      <button className="w-full px-5 py-4 flex items-center justify-between text-left">
        <span className="font-medium text-white text-[15px]">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-4',
            isOpen && 'rotate-180 text-primary'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-48 pb-4 px-5' : 'max-h-0'
        )}
      >
        <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">FAQs</h2>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  );
}
