'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, type Question } from '@/lib/supabase';
import { motion } from 'framer-motion';

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  return 'Annet';
}

export default function VotePage({ params }: { params: { questionId: string } }) {
  const { questionId } = params;
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const pageLoadedAt = useRef<number>(Date.now());

  useEffect(() => {
    async function fetchQuestion() {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
      setQuestion(data);

      // Check localStorage — but verify the vote still exists (admin may have reset)
      const voted = localStorage.getItem(`voted-${questionId}`);
      if (voted) {
        const { count } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('question_id', questionId);

        if (count === 0) {
          // Responses were reset — allow voting again
          localStorage.removeItem(`voted-${questionId}`);
        } else {
          setSubmitted(true);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      pageLoadedAt.current = Date.now();
    }
    fetchQuestion();
  }, [questionId]);

  const handleSubmit = async (selectedAnswer: string) => {
    if (!selectedAnswer.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const responseTimeMs = Date.now() - pageLoadedAt.current;

      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answer: selectedAnswer,
          deviceType: getDeviceType(),
          browser: getBrowser(),
          responseTimeMs,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Noe gikk galt');
        setSubmitting(false);
        return;
      }

      localStorage.setItem(`voted-${questionId}`, 'true');
      setSubmitted(true);
    } catch {
      setError('Kunne ikke sende svar. Sjekk internettforbindelsen.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Takk for svaret!</h1>
          <p className="text-gray-500">Ditt svar er registrert.</p>
        </motion.div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-gray-700">Spørsmålet finnes ikke</h1>
        </div>
      </div>
    );
  }

  if (!question.is_active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-xl font-semibold text-gray-700">
            Dette spørsmålet er ikke åpent ennå
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Vent til spørsmålet aktiveres.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Question */}
      <div className="p-6 pt-10">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl md:text-2xl font-bold text-gray-900 text-center leading-snug"
        >
          {question.text}
        </motion.h1>
      </div>

      {/* Answer area */}
      <div className="flex-1 flex flex-col justify-center p-6">
        {question.type === 'word_cloud' ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Skriv et ord eller kort frase..."
              maxLength={50}
              className="w-full px-5 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 bg-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && answer.trim()) handleSubmit(answer);
              }}
            />
            <button
              onClick={() => handleSubmit(answer)}
              disabled={!answer.trim() || submitting}
              className="w-full py-4 text-lg font-semibold rounded-2xl bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors active:bg-blue-700"
            >
              {submitting ? 'Sender...' : 'Send svar'}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {question.options?.map((option: string, index: number) => (
              <motion.button
                key={option}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => handleSubmit(option)}
                disabled={submitting}
                className="w-full py-5 px-6 text-left text-lg font-medium rounded-2xl bg-white border-2 border-gray-200 text-gray-900 active:bg-blue-50 active:border-blue-500 disabled:opacity-50 transition-all shadow-sm"
              >
                {option}
              </motion.button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl text-red-600 text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
