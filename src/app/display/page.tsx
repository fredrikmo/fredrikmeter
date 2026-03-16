'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Question, type Response } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import WordCloud from '@/components/WordCloud';
import BarChart from '@/components/BarChart';

export default function DisplayPage() {
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  const fetchActiveQuestion = useCallback(async () => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .single();
    setActiveQuestion(data);
    if (data) {
      const { data: resp } = await supabase
        .from('responses')
        .select('*')
        .eq('question_id', data.id);
      setResponses(resp || []);
    } else {
      setResponses([]);
    }
  }, []);

  useEffect(() => {
    fetchActiveQuestion();

    // Poll for active question changes every 2 seconds
    const questionPoll = setInterval(fetchActiveQuestion, 2000);

    // Subscribe to new responses in real time
    const channel = supabase
      .channel('responses-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'responses' },
        (payload) => {
          const newResponse = payload.new as Response;
          setResponses((prev) => {
            // Only add if it belongs to the active question
            if (prev.length === 0 || newResponse.question_id === prev[0]?.question_id) {
              return [...prev, newResponse];
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'responses' },
        () => {
          // Refetch on delete (reset)
          fetchActiveQuestion();
        }
      )
      .subscribe();

    return () => {
      clearInterval(questionPoll);
      supabase.removeChannel(channel);
    };
  }, [fetchActiveQuestion]);

  // Compute word frequencies for word cloud
  const wordFrequencies: Record<string, number> = {};
  if (activeQuestion?.type === 'word_cloud') {
    responses.forEach((r) => {
      const word = r.answer.toLowerCase().trim();
      if (word) {
        wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
      }
    });
  }

  // Compute vote counts for multiple choice
  const voteCounts: Record<string, number> = {};
  if (activeQuestion?.type === 'multiple_choice' && activeQuestion.options) {
    activeQuestion.options.forEach((opt: string) => {
      voteCounts[opt] = 0;
    });
    responses.forEach((r) => {
      if (voteCounts[r.answer] !== undefined) {
        voteCounts[r.answer]++;
      }
    });
  }

  const voteUrl = activeQuestion ? `${baseUrl}/vote/${activeQuestion.id}` : '';
  const shortUrl = activeQuestion
    ? voteUrl.replace(/^https?:\/\//, '')
    : '';

  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse">📊</div>
          <h1 className="text-white/50 text-3xl font-light">
            Venter på neste spørsmål...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col p-8">
      {/* Question text */}
      <div className="text-center mb-8">
        <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight max-w-4xl mx-auto">
          {activeQuestion.text}
        </h1>
        <div className="mt-4 text-white/40 text-xl font-mono">
          {responses.length} {responses.length === 1 ? 'svar' : 'svar'}
        </div>
      </div>

      {/* Visualization */}
      <div className="flex-1 flex items-center justify-center">
        {activeQuestion.type === 'word_cloud' ? (
          <WordCloud words={wordFrequencies} />
        ) : (
          <BarChart
            options={activeQuestion.options || []}
            votes={voteCounts}
          />
        )}
      </div>

      {/* QR Code + URL */}
      <div className="fixed bottom-8 right-8 flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-3xl p-6">
        {voteUrl && (
          <QRCodeSVG
            value={voteUrl}
            size={200}
            bgColor="transparent"
            fgColor="#ffffff"
            level="M"
          />
        )}
        <div className="text-white/70 max-w-[200px]">
          <div className="text-white/40 text-sm mb-2 uppercase tracking-wider font-semibold">Stem her</div>
          <div className="font-mono text-base break-all leading-relaxed">
            {shortUrl}
          </div>
        </div>
      </div>
    </div>
  );
}
