'use client';

import { motion } from 'framer-motion';

// CC Brand colors for bars
const BAR_COLORS = [
  { bg: '#7CD7F6', label: 'Fresh Blue' },
  { bg: '#BF91DA', label: 'Lilac' },
  { bg: '#FFB23B', label: 'Bright Orange' },
  { bg: '#DEB6FE', label: 'Light Lilac' },
];

type BarChartProps = {
  options: string[];
  votes: Record<string, number>;
};

export default function BarChart({ options, votes }: BarChartProps) {
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(votes), 1);

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-5 px-4">
      {options.map((option, index) => {
        const count = votes[option] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const barWidth = totalVotes > 0 ? (count / maxVotes) * 100 : 0;
        const color = BAR_COLORS[index % BAR_COLORS.length];

        return (
          <div key={option}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-lg md:text-2xl font-medium leading-tight max-w-[70%]" style={{ color: '#D0D7FF' }}>
                {option}
              </span>
              <span className="text-lg md:text-2xl font-mono tabular-nums ml-4 shrink-0" style={{ color: '#D0D7FF', opacity: 0.7 }}>
                {count} ({percentage}%)
              </span>
            </div>
            <div
              className="h-12 md:h-14 rounded-lg overflow-hidden"
              style={{ background: 'rgba(208, 215, 255, 0.1)' }}
            >
              <motion.div
                className="h-full rounded-lg"
                style={{ background: color.bg }}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
