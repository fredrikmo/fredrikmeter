'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import cloud from 'd3-cloud';

type WordData = { text: string; size: number; count: number; x?: number; y?: number; rotate?: number };

export default function WordCloud({ words }: { words: Record<string, number> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layout, setLayout] = useState<WordData[]>([]);
  const [dimensions, setDimensions] = useState({ width: 900, height: 500 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Math.min(window.innerWidth * 0.85, 1200),
        height: Math.min(window.innerHeight * 0.6, 600),
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const layoutWords = useCallback(() => {
    const entries = Object.entries(words);
    if (entries.length === 0) return;

    const maxCount = Math.max(...entries.map(([, c]) => c));
    const minSize = 20;
    const maxSize = Math.min(dimensions.width / 6, 120);

    const wordList = entries.map(([text, count]) => ({
      text,
      size: minSize + ((count / maxCount) * (maxSize - minSize)),
      count,
    }));

    const layoutGenerator = cloud<WordData>()
      .size([dimensions.width, dimensions.height])
      .words(wordList)
      .padding(8)
      .rotate(() => (Math.random() > 0.7 ? 90 : 0))
      .fontSize((d) => d.size!)
      .spiral('archimedean')
      .on('end', (output) => {
        setLayout(output);
      });

    layoutGenerator.start();
  }, [words, dimensions]);

  useEffect(() => {
    layoutWords();
  }, [layoutWords]);

  const colors = [
    '#60A5FA', '#34D399', '#FBBF24', '#F87171',
    '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9',
  ];

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      className="mx-auto"
    >
      <g transform={`translate(${dimensions.width / 2},${dimensions.height / 2})`}>
        {layout.map((word, i) => (
          <text
            key={`${word.text}-${i}`}
            textAnchor="middle"
            transform={`translate(${word.x ?? 0},${word.y ?? 0}) rotate(${word.rotate ?? 0})`}
            style={{
              fontSize: `${word.size}px`,
              fill: colors[i % colors.length],
              fontWeight: 700,
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              transition: 'font-size 0.5s ease, opacity 0.5s ease',
            }}
          >
            {word.text}
          </text>
        ))}
      </g>
    </svg>
  );
}
