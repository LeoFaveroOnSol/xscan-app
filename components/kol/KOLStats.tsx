import { Card } from '@/components/ui/Card';
import MultiplierBadge from '@/components/ui/MultiplierBadge';
import { formatPercent } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { Target, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import type { KOL } from '@/types/database';

interface KOLStatsProps {
  kol: KOL;
}

export default function KOLStats({ kol }: KOLStatsProps) {
  const stats = [
    {
      label: 'Winrate',
      value: formatPercent(kol.winrate),
      icon: Target,
      color: kol.winrate >= 70 ? 'text-success' : kol.winrate >= 50 ? 'text-primary' : 'text-warning',
      description: `${kol.winning_calls}/${kol.total_calls} winning calls`,
    },
    {
      label: 'Avg Multiplier',
      value: kol.avg_multiplier,
      icon: TrendingUp,
      isMultiplier: true,
      description: 'Average ATH return',
    },
    {
      label: 'Best Call',
      value: kol.best_multiplier,
      icon: Zap,
      isMultiplier: true,
      description: 'Highest multiplier achieved',
    },
    {
      label: 'Total Calls',
      value: kol.total_calls,
      icon: BarChart3,
      color: 'text-muted-foreground',
      description: 'Tokens called',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Icon className="w-4 h-4" />
              <span className="text-sm">{stat.label}</span>
            </div>
            <div className="mb-1">
              {stat.isMultiplier ? (
                <MultiplierBadge value={stat.value as number} size="lg" />
              ) : (
                <span className={cn('text-2xl font-bold', stat.color)}>{stat.value}</span>
              )}
            </div>
            <p className="text-xs text-muted">{stat.description}</p>
          </Card>
        );
      })}
    </div>
  );
}
