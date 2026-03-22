'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Question } from '@/lib/supabase';

type QuestionForm = {
  id: string;
  text: string;
  type: 'word_cloud' | 'multiple_choice';
  options: string[];
};

const emptyForm: QuestionForm = { id: '', text: '', type: 'multiple_choice', options: ['', ''] };

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [seeded, setSeeded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // CRUD state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionForm>({ ...emptyForm });
  const [formError, setFormError] = useState('');

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

  // Check if already authenticated via cookie on mount
  useEffect(() => {
    fetch('/api/admin/check').then((r) => {
      if (r.ok) setAuthenticated(true);
      setCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setPassword('');
    } else {
      setLoginError('Feil passord');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
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
      body: JSON.stringify({ questionId }),
    });
    await fetchData();
    setActionLoading(null);
  };

  const deactivateAll = async () => {
    setActionLoading('deactivate');
    await fetch('/api/admin/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
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
      body: JSON.stringify({ questionId }),
    });
    await fetchData();
    setActionLoading(null);
  };

  const openAddForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowAddForm(true);
    setFormError('');
  };

  const openEditForm = (q: Question) => {
    setForm({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options || ['', ''],
    });
    setEditingId(q.id);
    setShowAddForm(false);
    setFormError('');
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError('');
  };

  const handleCreateQuestion = async () => {
    setFormError('');
    const filteredOptions = form.options.filter((o) => o.trim() !== '');

    if (!form.id.trim() || !form.text.trim()) {
      setFormError('ID og tekst er påkrevd');
      return;
    }

    if (form.type === 'multiple_choice' && filteredOptions.length < 2) {
      setFormError('Flervalg trenger minst 2 alternativer');
      return;
    }

    setActionLoading('create');
    const res = await fetch('/api/admin/questions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: form.id.trim(),
        text: form.text.trim(),
        type: form.type,
        options: form.type === 'multiple_choice' ? filteredOptions : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || 'Noe gikk galt');
      setActionLoading(null);
      return;
    }

    cancelForm();
    await fetchData();
    setActionLoading(null);
  };

  const handleUpdateQuestion = async () => {
    setFormError('');
    const filteredOptions = form.options.filter((o) => o.trim() !== '');

    if (!form.text.trim()) {
      setFormError('Tekst er påkrevd');
      return;
    }

    if (form.type === 'multiple_choice' && filteredOptions.length < 2) {
      setFormError('Flervalg trenger minst 2 alternativer');
      return;
    }

    setActionLoading('update');
    const res = await fetch('/api/admin/questions/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: form.id,
        text: form.text.trim(),
        type: form.type,
        options: form.type === 'multiple_choice' ? filteredOptions : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || 'Noe gikk galt');
      setActionLoading(null);
      return;
    }

    cancelForm();
    await fetchData();
    setActionLoading(null);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm(`Er du sikker på at du vil slette spørsmål "${questionId}"? Alle svar slettes også.`)) return;
    setActionLoading(`delete-${questionId}`);
    await fetch('/api/admin/questions/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: questionId }),
    });
    await fetchData();
    setActionLoading(null);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const addOption = () => {
    setForm({ ...form, options: [...form.options, ''] });
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return;
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) });
  };

  const renderForm = (isEdit: boolean) => (
    <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-blue-300">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {isEdit ? `Rediger ${form.id}` : 'Legg til nytt spørsmål'}
      </h3>

      <div className="space-y-4">
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="f.eks. q5"
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Spørsmålstekst</label>
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="Skriv spørsmålet her..."
            rows={2}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'word_cloud' | 'multiple_choice' })}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
          >
            <option value="multiple_choice">Flervalg</option>
            <option value="word_cloud">Ordsky</option>
          </select>
        </div>

        {form.type === 'multiple_choice' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alternativer</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Alternativ ${i + 1}`}
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                  <button
                    onClick={() => removeOption(i)}
                    disabled={form.options.length <= 2}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors"
                    title="Fjern alternativ"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOption}
              className="mt-2 px-4 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              + Legg til alternativ
            </button>
          </div>
        )}

        {formError && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{formError}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={isEdit ? handleUpdateQuestion : handleCreateQuestion}
            disabled={actionLoading === 'create' || actionLoading === 'update'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isEdit ? 'Lagre endringer' : 'Opprett spørsmål'}
          </button>
          <button
            onClick={cancelForm}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Laster...</div>
      </div>
    );
  }

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
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none mb-3 text-gray-900"
          />
          {loginError && (
            <div className="mb-3 text-sm text-red-600">{loginError}</div>
          )}
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
              onClick={openAddForm}
              disabled={showAddForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              + Nytt spørsmål
            </button>
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
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Logg ut
            </button>
          </div>
        </div>

        {showAddForm && <div className="mb-6">{renderForm(false)}</div>}

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id}>
              {editingId === q.id ? (
                renderForm(true)
              ) : (
                <div
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
                          {q.type === 'multiple_choice' ? 'Flervalg' : 'Ordsky'}
                        </span>
                        {q.is_active && (
                          <span className="text-xs font-semibold bg-green-500 text-white px-2 py-0.5 rounded animate-pulse">
                            AKTIV
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">{q.text}</h2>
                      {q.options && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {q.options.map((opt: string) => (
                            <span key={opt} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
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
                        onClick={() => openEditForm(q)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Rediger
                      </button>
                      <button
                        onClick={() => resetResponses(q.id)}
                        disabled={actionLoading === `reset-${q.id}`}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
                      >
                        Nullstill
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={actionLoading === `delete-${q.id}`}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
                      >
                        Slett
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {questions.length === 0 && !showAddForm && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Ingen spørsmål funnet.</p>
            <p className="text-sm mt-2">Klikk &quot;+ Nytt spørsmål&quot; for å legge til, eller &quot;Seed spørsmål&quot; for standardspørsmålene.</p>
          </div>
        )}
      </div>
    </div>
  );
}
