'use client';

import { motion } from 'framer-motion';

type BarChartProps = {
  options: string[];
  votes: Record<string, number>;
};

export default function BarChart({ options, votes }: BarChartProps) {
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(votes), 1);

  return (
    <div className="w-full max-w-[1100px] mx-auto space-y-6 px-4">
      {options.map((option, index) => {
        const count = votes[option] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const barWidth = totalVotes > 0 ? (count / maxVotes) * 100 : 0;

        const colors = [
          'from-blue-500 to-blue-400',
          'from-emerald-500 to-emerald-400',
          'from-amber-500 to-amber-400',
          'from-rose-500 to-rose-400',
        ];

        return (
          <div key={option}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-white/90 text-lg md:text-2xl font-medium leading-tight max-w-[70%]">
                {option}
              </span>
              <span className="text-white/70 text-lg md:text-2xl font-mono tabular-nums ml-4 shrink-0">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="h-12 md:h-14 bg-white/10 rounded-lg overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-lg`}
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
