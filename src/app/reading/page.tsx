'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import type { PaginatedResponse, ReadingSession, ReadingStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FilterStatus = ReadingStatus | 'all';

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'planned', label: 'Planlandı' },
  { value: 'in_progress', label: 'Okunuyor' },
  { value: 'finished', label: 'Bitti' },
  { value: 'abandoned', label: 'Yarım Bırakıldı' },
];

/**
 * Bir okuma kaydından "kaç günde okundu" ve "günlük ortalama sayfa"
 * metriklerini türetir. Ek bir veritabanı alanı GEREKMİYOR — mevcut
 * started_at/finished_at ve book.page_count üzerinden hesaplanır.
 * finished_at yoksa (kitap hâlâ okunuyorsa) metrikler gösterilmez.
 */
function computeMetrics(session: ReadingSession): { days: number; pagesPerDay: number | null } | null {
  if (!session.started_at || !session.finished_at) return null;

  const start = new Date(session.started_at);
  const end = new Date(session.finished_at);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const pagesPerDay = session.book.page_count ? Math.round(session.book.page_count / days) : null;

  return { days, pagesPerDay };
}

export default function ReadingHistoryPage() {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    const params = new URLSearchParams({ per_page: '50' });
    if (filter !== 'all') params.set('status', filter);

    api
      .get<PaginatedResponse<ReadingSession>>(`/reading-sessions?${params.toString()}`)
      .then((res) => setSessions(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [filter]);

  async function handleDelete(id: string) {
    if (!window.confirm('Bu okuma kaydı silinsin mi?')) return;
    try {
      await api.delete(`/reading-sessions/${id}`);
      load();
    } catch {
      // sessizce yut
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <p className="call-number text-xs text-oak/60">OKUMA GEÇMİŞİM</p>
          <Link href="/books" className="text-sm text-ink/60 underline underline-offset-2">
            ← Rafa dön
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex flex-wrap gap-1 overflow-hidden rounded-md border border-oak/20">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-oak text-paper' : 'bg-paper-elevated text-ink/60'
            }`}
          >
            Tümü
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === s.value ? 'bg-oak text-paper' : 'bg-paper-elevated text-ink/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : sessions.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Kayıt yok.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) =>
              editingId === session.id ? (
                <li key={session.id} className="rounded-sm border border-oak/10 bg-paper-elevated p-4">
                  <EditSessionForm
                    session={session}
                    onSaved={() => {
                      setEditingId(null);
                      load();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li key={session.id} className="rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/books/${session.book.id}`}
                        className="font-medium text-ink underline underline-offset-2"
                      >
                        {session.book.title}
                      </Link>
                      <p className="text-sm text-ink/60">
                        {session.status_label}
                        {session.rating && <span className="text-brass"> · {'★'.repeat(session.rating)}</span>}
                      </p>
                      <p className="text-xs text-ink/40">
                        {session.started_at ?? '—'}
                        {session.finished_at && ` → ${session.finished_at}`}
                      </p>
                      {(() => {
                        const metrics = computeMetrics(session);
                        if (!metrics) return null;
                        return (
                          <p className="call-number mt-1 text-xs text-brass">
                            {metrics.days} günde okundu
                            {metrics.pagesPerDay && ` · günde ~${metrics.pagesPerDay} sayfa`}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="flex shrink-0 gap-3 text-sm">
                      <button
                        onClick={() => setEditingId(session.id)}
                        className="text-brass underline underline-offset-2"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="text-spine underline underline-offset-2"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </main>
  );
}

function EditSessionForm({
  session,
  onSaved,
  onCancel,
}: {
  session: ReadingSession;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<ReadingStatus>(session.status);
  const [startedAt, setStartedAt] = useState(session.started_at ?? '');
  const [finishedAt, setFinishedAt] = useState(session.finished_at ?? '');
  const [rating, setRating] = useState(session.rating?.toString() ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSaving(true);
    setError(null);
    try {
      await api.put(`/reading-sessions/${session.id}`, {
        book_id: session.book.id,
        status,
        started_at: startedAt || null,
        finished_at: finishedAt || null,
        rating: rating ? Number(rating) : null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="font-medium text-ink">{session.book.title}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Durum</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReadingStatus)}
            className="w-full rounded-md border border-oak/20 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-brass"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Puan</Label>
          <Input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="h-9 bg-paper text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Başlangıç</Label>
          <Input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="h-9 bg-paper text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label>Bitiş</Label>
          <Input
            type="date"
            value={finishedAt}
            onChange={(e) => setFinishedAt(e.target.value)}
            className="h-9 bg-paper text-sm"
          />
        </div>
      </div>
      {error && <p className="text-xs text-spine">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="bg-oak hover:bg-oak/90">
          Kaydet
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
