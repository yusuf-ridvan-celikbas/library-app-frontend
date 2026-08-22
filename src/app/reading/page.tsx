'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import type { ApiArrayResponse, PaginatedResponse, ReadingSession, ReadingStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FilterStatus = ReadingStatus | 'all';

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'planned', label: 'Planlandı' },
  { value: 'in_progress', label: 'Okunuyor' },
  { value: 'finished', label: 'Okundu' },
  { value: 'abandoned', label: 'Yarım Bırakıldı' },
];

/**
 * Ödünç aldığınız kitaplar için hafif bir okuma kaydı — kendi
 * kütüphanenizdeki (books) ReadingSession'dan farklı bir kaynak, ama
 * bu sayfada görünürlük için birleştiriliyor. page_count bilgisi
 * OLMADIĞI için "günde kaç sayfa" gibi metrikler bu kayıtlar için
 * hesaplanmaz — sadece durum/tarih/puan gösterilir.
 */
interface BorrowedBookLite {
  id: string;
  title: string;
  author_name: string | null;
  borrower: { id: string; name: string };
  reading_status: 'not_started' | 'reading' | 'finished';
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
}

/** İki farklı kaynağı (kendi kitaplarım + ödünç aldıklarım) tek bir listede göstermek için ortak zarf. */
type ReadingItem =
  | { source: 'book'; id: string; data: ReadingSession }
  | { source: 'borrowed'; id: string; data: BorrowedBookLite };

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

  const pagesPerDay = session.book?.page_count ? Math.round(session.book.page_count / days) : null;

  return { days, pagesPerDay };
}

export default function ReadingHistoryPage() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Ödünç aldığım kitaplardaki reading_status'ü, kendi kitaplarımın
  // ReadingStatus'üne en yakın karşılığa eşliyoruz — 'not_started' hiç
  // gösterilmez (henüz okumaya başlamamışsınız, "geçmiş"e ait değil).
  function matchesFilter(readingStatus: BorrowedBookLite['reading_status']): boolean {
    if (readingStatus === 'not_started') return false;
    if (filter === 'all') return true;
    if (filter === 'in_progress') return readingStatus === 'reading';
    if (filter === 'finished') return readingStatus === 'finished';
    return false; // 'planned'/'abandoned' filtrelerinde ödünç kitap gösterilmez
  }

  function sortKey(item: ReadingItem): string {
    if (item.source === 'book') {
      return item.data.finished_at ?? item.data.started_at ?? item.data.created_at;
    }
    return item.data.finished_at ?? item.data.started_at ?? '';
  }

  function load() {
    setIsLoading(true);
    const params = new URLSearchParams({ per_page: '50' });
    if (filter !== 'all') params.set('status', filter);

    Promise.all([
      api.get<PaginatedResponse<ReadingSession>>(`/reading-sessions?${params.toString()}`),
      api.get<ApiArrayResponse<BorrowedBookLite>>('/borrowed-books?status=all'),
    ])
      .then(([sessionsRes, borrowedRes]) => {
        const bookItems: ReadingItem[] = sessionsRes.data.map((s) => ({ source: 'book', id: s.id, data: s }));
        const borrowedItems: ReadingItem[] = borrowedRes.data
          .filter((b) => matchesFilter(b.reading_status))
          .map((b) => ({ source: 'borrowed', id: b.id, data: b }));

        const merged = [...bookItems, ...borrowedItems].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
        setItems(merged);
      })
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
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Okuma Geçmişim" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1 overflow-hidden rounded-md border border-oak/20">
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
          <Link
            href="/reading/stats"
            className="text-xs text-brass underline underline-offset-2"
          >
            İstatistikler
          </Link>
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Kayıt yok.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              if (item.source === 'borrowed') {
                const b = item.data;
                return (
                  <li
                    key={`borrowed-${b.id}`}
                    className="rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href="/borrowed-books"
                          className="font-medium text-ink underline underline-offset-2"
                        >
                          {b.title}
                        </Link>
                        {/* Ödünç kaynaklı kayıt olduğunu belli eden küçük rozet */}
                        <span className="ml-2 rounded-full bg-oak/10 px-1.5 py-0.5 text-[10px] font-medium text-oak">
                          Ödünç
                        </span>
                        <p className="text-sm text-ink/60">
                          {b.reading_status === 'finished' ? 'Okundu' : 'Okunuyor'}
                          {b.rating && <span className="text-brass"> · {'★'.repeat(b.rating)}</span>}
                        </p>
                        <p className="text-xs text-ink/40">
                          {b.started_at ?? '—'}
                          {b.finished_at && ` → ${b.finished_at}`}
                        </p>
                      </div>
                      <Link
                        href="/borrowed-books"
                        className="shrink-0 text-xs text-brass underline underline-offset-2"
                      >
                        Düzenle
                      </Link>
                    </div>
                  </li>
                );
              }

              const session = item.data;
              return editingId === session.id ? (
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
                      {session.book ? (
                        <Link
                          href={`/books/${session.book.id}`}
                          className="font-medium text-ink underline underline-offset-2"
                        >
                          {session.book.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-ink/50">Silinmiş kitap</span>
                      )}
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
              );
            })}
          </ul>
        )}
      </div>

      <BottomNav />
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
        book_id: session.book?.id, // undefined olursa backend mevcut book_id'yi korur
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
      <p className="font-medium text-ink">{session.book?.title ?? 'Silinmiş kitap'}</p>
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
