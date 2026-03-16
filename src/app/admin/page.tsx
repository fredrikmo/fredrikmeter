'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Question } from '@/lib/supabase';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [seeded, setSeeded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: qs } = await supabase
      .from('questions')
      .select('*')
      .order('id');
    setQuestions(qs || []);

    const { data: responses } = await supabase
      .from('responses')
      .select('question_id');

    const counts: Record<string, number> = {};
    (responses || []).forEach((r) => {
      counts[r.question_id] = (counts[r.question_id] || 0) + 1;
    });
    setVoteCounts(counts);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'panel2025') {
      setAuthenticated(true);
    }
  };

  const seedQuestions = async () => {
    setActionLoading('seed');
    await fetch('/api/seed', { method: 'POST' });
    setSeeded(true);
    await fetchData();
    setActionLoading(null);
  };

  const activateQuestion = async (questionId: string) => {
    setActionLoading(`activate-${questionId}`);
    await fetch('/api/admin/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, password }),
    });
    await fetchData();
    setActionLoading(null);
  };

  const deactivateAll = async () => {
    setActionLoading('deactivate');
    await fetch('/api/admin/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    await fetchData();
    setActionLoading(null);
  };

  const resetResponses = async (questionId: string) => {
    if (!confirm(`Er du sikker på at du vil slette alle svar for ${questionId}?`)) return;
    setActionLoading(`reset-${questionId}`);
    await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, password }),
    });
    await fetchData();
    setActionLoading(null);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passord"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none mb-4 text-gray-900"
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Logg inn
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex gap-3">
            <button
              onClick={seedQuestions}
              disabled={actionLoading === 'seed'}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {seeded ? '✓ Seeded' : 'Seed spørsmål'}
            </button>
            <button
              onClick={deactivateAll}
              disabled={actionLoading === 'deactivate'}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              Deaktiver alle
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`bg-white rounded-2xl shadow-sm p-6 border-2 transition-colors ${
                q.is_active ? 'border-green-500 bg-green-50' : 'border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                      {q.id}
                    </span>
                    <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {q.type}
                    </span>
                    {q.is_active && (
                      <span className="text-xs font-semibold bg-green-500 text-white px-2 py-0.5 rounded animate-pulse">
                        AKTIV
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{q.text}</h2>
                  <div className="text-sm text-gray-500">
                    Svar: <span className="font-bold text-gray-700">{voteCounts[q.id] || 0}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => activateQuestion(q.id)}
                    disabled={q.is_active || actionLoading === `activate-${q.id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    Aktiver
                  </button>
                  <button
                    onClick={() => resetResponses(q.id)}
                    disabled={actionLoading === `reset-${q.id}`}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
                  >
                    Nullstill
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Ingen spørsmål funnet.</p>
            <p className="text-sm mt-2">Klikk &quot;Seed spørsmål&quot; for å legge til spørsmålene.</p>
          </div>
        )}
      </div>
    </div>
  );
}
