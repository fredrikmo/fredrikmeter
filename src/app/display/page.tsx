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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1345' }}>
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse">📊</div>
          <h1 className="text-3xl font-light" style={{ color: '#D0D7FF' }}>
            Venter på neste spørsmål...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1345' }}>
      {/* Question text */}
      <div className="text-center pt-8 pb-4 px-8">
        <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight max-w-5xl mx-auto">
          {activeQuestion.text}
        </h1>
        <div className="mt-3 text-xl font-mono" style={{ color: '#D0D7FF', opacity: 0.6 }}>
          {responses.length} svar
        </div>
      </div>

      {/* Main content: 3/4 visualization + 1/4 QR */}
      <div className="flex-1 flex items-stretch px-8 pb-8 gap-6">
        {/* Left: Visualization (3/4) */}
        <div className="w-3/4 flex items-center justify-center">
          {activeQuestion.type === 'word_cloud' ? (
            <WordCloud words={wordFrequencies} />
          ) : (
            <BarChart
              options={activeQuestion.options || []}
              votes={voteCounts}
            />
          )}
        </div>

        {/* Right: QR Code + URL (1/4) */}
        <div className="w-1/4 flex items-center justify-center">
          <div
            className="flex flex-col items-center gap-5 rounded-3xl p-6 w-full"
            style={{ background: 'rgba(208, 215, 255, 0.1)', backdropFilter: 'blur(12px)' }}
          >
            {voteUrl && (
              <QRCodeSVG
                value={voteUrl}
                size={220}
                bgColor="transparent"
                fgColor="#D0D7FF"
                level="M"
              />
            )}
            <div className="text-center">
              <div
                className="text-sm mb-2 uppercase tracking-widest font-semibold"
                style={{ color: '#FFB23B' }}
              >
                Stem her
              </div>
              <div
                className="font-mono text-sm break-all leading-relaxed"
                style={{ color: '#D0D7FF', opacity: 0.8 }}
              >
                {shortUrl}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
