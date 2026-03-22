'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import cloud from 'd3-cloud';

// CC Brand colors for word cloud
const CC_COLORS = [
  '#7CD7F6',  // Fresh Blue
  '#BF91DA',  // Lilac
  '#FFB23B',  // Bright Orange
  '#D0D7FF',  // Cool Violet
  '#DEB6FE',  // Light Lilac
  '#B3E8FF',  // Light Blue
  '#FFE5BF',  // Mellow Yellow
  '#FFFFFF',  // White
];

type WordData = { text: string; size: number; count: number; x?: number; y?: number; rotate?: number };

type WordCloudProps = {
  words: Record<string, number>;
  width?: number;
  height?: number;
};

export default function WordCloud({ words, width: widthProp, height: heightProp }: WordCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layout, setLayout] = useState<WordData[]>([]);
  const [dimensions, setDimensions] = useState({ width: widthProp ?? 900, height: heightProp ?? 500 });

  useEffect(() => {
    if (widthProp !== undefined && heightProp !== undefined) {
      setDimensions({ width: widthProp, height: heightProp });
      return;
    }
    const updateDimensions = () => {
      setDimensions({
        width: widthProp ?? Math.min(window.innerWidth * 0.7, 1100),
        height: heightProp ?? Math.min(window.innerHeight * 0.65, 600),
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [widthProp, heightProp]);

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
              fill: CC_COLORS[i % CC_COLORS.length],
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
