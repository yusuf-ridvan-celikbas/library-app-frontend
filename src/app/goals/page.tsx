'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { GoalBookList } from '@/components/goal-book-list';
import type { ApiArrayResponse, GoalPeriod, ReadingGoal } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = [
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'yearly', label: 'Yıllık' },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    api
      .get<ApiArrayResponse<ReadingGoal>>('/reading-goals')
      .then((res) => setGoals(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Bu hedef silinsin mi?')) return;
    try {
      await api.delete(`/reading-goals/${id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silinemedi.');
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <p className="call-number text-xs text-oak/60">HEDEFLERİM</p>
          <Link href="/books" className="text-sm text-ink/60 underline underline-offset-2">
            ← Rafa dön
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <Button onClick={() => setIsAdding((v) => !v)} className="mb-4 w-full bg-oak hover:bg-oak/90">
          {isAdding ? 'Vazgeç' : '+ Yeni Hedef'}
        </Button>

        {isAdding && (
          <NewGoalForm
            onCreated={() => {
              setIsAdding(false);
              load();
            }}
          />
        )}

        {error && <p className="mb-4 text-sm text-spine">{error}</p>}

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : goals.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Henüz bir hedef belirlemediniz.</p>
        ) : (
          <ul className="space-y-3">
            {goals.map((goal) => (
              <li key={goal.id} className="overflow-hidden rounded-sm border border-oak/10 bg-paper-elevated">
                <div className="flex items-start justify-between px-5 pt-4">
                  <div>
                    <p className="call-number text-xs text-oak/60">{goal.period_type_label.toUpperCase()}</p>
                    <p className="font-display text-lg text-ink">
                      {goal.completed_books} / {goal.target_books} kitap
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-xs text-spine underline underline-offset-2"
                  >
                    Sil
                  </button>
                </div>

                {/* İlerleme çubuğu */}
                <div className="mx-5 mt-3 h-2 overflow-hidden rounded-full bg-oak/10">
                  <div
                    className={`h-full rounded-full ${goal.is_on_track ? 'bg-moss' : 'bg-brass'}`}
                    style={{ width: `${goal.percent_complete}%` }}
                  />
                </div>

                <div className="px-5 py-4 text-sm text-ink/60">
                  <p>
                    {goal.period_start} → {goal.period_end}
                  </p>
                  {goal.remaining_books > 0 ? (
                    <p className="mt-1">
                      Kalan <span className="font-medium text-ink">{goal.remaining_books} kitap</span> ·{' '}
                      {goal.days_remaining} gün kaldı
                      {goal.suggested_daily_pages > 0 && (
                        <> · günde ~<span className="font-medium text-brass">{goal.suggested_daily_pages} sayfa</span></>
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 font-medium text-moss">Hedefe ulaştınız! 🎉</p>
                  )}
                  <p className={`mt-1 text-xs ${goal.is_on_track ? 'text-moss' : 'text-spine'}`}>
                    {goal.is_on_track ? 'Takip ediyorsunuz' : 'Biraz gerideyseniz de yetişebilirsiniz'}
                  </p>
                </div>

                <GoalBookList
                  goal={goal}
                  onChanged={(updated) =>
                    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function NewGoalForm({ onCreated }: { onCreated: () => void }) {
  const [periodType, setPeriodType] = useState<GoalPeriod>('yearly');
  const [targetBooks, setTargetBooks] = useState('12');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await api.post('/reading-goals', { period_type: periodType, target_books: Number(targetBooks) });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-sm border border-oak/15 bg-paper-elevated p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Periyot</Label>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as GoalPeriod)}
            className="w-full rounded-md border border-oak/20 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brass"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Hedef kitap sayısı</Label>
          <Input
            type="number"
            min="1"
            max="1000"
            value={targetBooks}
            onChange={(e) => setTargetBooks(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-spine">{error}</p>}
      <Button type="submit" size="sm" disabled={isSaving} className="w-full bg-oak hover:bg-oak/90">
        {isSaving ? 'Kaydediliyor…' : 'Hedefi Oluştur'}
      </Button>
    </form>
  );
}
