'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase, type Question, type Response } from '@/lib/supabase';
import WordCloud from '@/components/WordCloud';
import BarChart from '@/components/BarChart';

export default function ResultsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [{ data: qs }, { data: rs }] = await Promise.all([
      supabase.from('questions').select('*').order('created_at'),
      supabase.from('responses').select('*'),
    ]);
    setQuestions(qs || []);
    setResponses(rs || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('results-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'responses' },
        (payload) => {
          setResponses((prev) => [...prev, payload.new as Response]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'responses' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1345' }}>
        <div className="text-2xl font-light" style={{ color: '#D0D7FF' }}>
          Laster resultater...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1345' }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Resultater</h1>
          <p className="text-lg font-light" style={{ color: '#D0D7FF', opacity: 0.55 }}>
            Alle svar fra Fredrikmeter
          </p>
        </div>

        {/* Questions */}
        {questions.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#D0D7FF', opacity: 0.4 }}>
            Ingen spørsmål konfigurert ennå.
          </div>
        ) : (
          <div className="space-y-10">
            {questions.map((question, idx) => {
              const qResponses = responses.filter((r) => r.question_id === question.id);

              const wordFrequencies: Record<string, number> = {};
              const voteCounts: Record<string, number> = {};

              if (question.type === 'word_cloud') {
                qResponses.forEach((r) => {
                  const word = r.answer.toLowerCase().trim();
                  if (word) wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
                });
              } else if (question.type === 'multiple_choice' && question.options) {
                question.options.forEach((opt) => {
                  voteCounts[opt] = 0;
                });
                qResponses.forEach((r) => {
                  if (voteCounts[r.answer] !== undefined) voteCounts[r.answer]++;
                });
              }

              const hasResponses = qResponses.length > 0;

              return (
                <div
                  key={question.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(208, 215, 255, 0.07)', border: '1px solid rgba(208, 215, 255, 0.1)' }}
                >
                  {/* Card header */}
                  <div className="px-6 md:px-8 pt-6 pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{ background: 'rgba(208, 215, 255, 0.12)', color: '#FFB23B' }}
                      >
                        Spørsmål {idx + 1}
                      </span>
                      <span className="text-sm font-mono" style={{ color: '#D0D7FF', opacity: 0.45 }}>
                        {qResponses.length} {qResponses.length === 1 ? 'svar' : 'svar'}
                      </span>
                      {question.is_active && (
                        <span
                          className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                          style={{ background: 'rgba(124, 215, 246, 0.15)', color: '#7CD7F6' }}
                        >
                          Aktiv
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                      {question.text}
                    </h2>
                  </div>

                  {/* Visualization */}
                  <div className="px-4 md:px-6 pb-6">
                    {!hasResponses ? (
                      <div
                        className="flex items-center justify-center py-12 rounded-xl text-base"
                        style={{
                          background: 'rgba(208, 215, 255, 0.04)',
                          color: '#D0D7FF',
                          opacity: 0.35,
                        }}
                      >
                        Ingen svar ennå
                      </div>
                    ) : question.type === 'word_cloud' ? (
                      <div className="flex justify-center">
                        <WordCloud words={wordFrequencies} width={760} height={320} />
                      </div>
                    ) : (
                      <div className="pt-2">
                        <BarChart options={question.options || []} votes={voteCounts} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer link */}
        <div className="mt-14 text-center">
          <Link
            href="/"
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: '#D0D7FF', opacity: 0.4 }}
          >
            ← Tilbake til hjem
          </Link>
        </div>
      </div>
    </div>
  );
}
