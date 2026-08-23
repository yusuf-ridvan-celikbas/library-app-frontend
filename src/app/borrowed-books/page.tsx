'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { SearchableSingleSelect } from '@/components/searchable-select';
import { TimeLogList } from '@/components/time-log-list';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import type { ApiArrayResponse, ApiItemResponse, Borrower, PaginatedResponse, TimeLog } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BorrowedBook {
  id: string;
  title: string;
  author_name: string | null;
  page_count: number | null;
  borrower: Borrower;
  borrowed_at: string;
  due_at: string | null;
  returned_at: string | null;
  is_returned: boolean;
  notes: string | null;
  reading_status: 'not_started' | 'reading' | 'finished';
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  reading_notes: string | null;
  total_minutes?: number;
  time_logs?: TimeLog[];
}

const READING_STATUS_OPTIONS: { value: BorrowedBook['reading_status']; label: string }[] = [
  { value: 'not_started', label: 'Okunmadı' },
  { value: 'reading', label: 'Okunuyor' },
  { value: 'finished', label: 'Okundu' },
];

type FilterStatus = 'active' | 'returned' | 'all';

export default function BorrowedBooksPage() {
  const [records, setRecords] = useState<BorrowedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);

    api
      .get<ApiArrayResponse<BorrowedBook>>(`/borrowed-books?${params.toString()}`)
      .then((res) => setRecords(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [filter]);

  async function handleReturn(id: string) {
    setSavingId(id);
    setError(null);
    try {
      await api.patch(`/borrowed-books/${id}/return`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem başarısız oldu.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Bu kayıt silinsin mi?')) return;
    try {
      await api.delete(`/borrowed-books/${id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silinemedi.');
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Ödünç Aldıklarım" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex overflow-hidden rounded-md border border-oak/20">
            {(['active', 'returned', 'all'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f ? 'bg-oak text-paper' : 'bg-paper-elevated text-ink/60'
                }`}
              >
                {f === 'active' ? 'Bende' : f === 'returned' ? 'İade Edilmiş' : 'Tümü'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setIsAdding((v) => !v)} className="bg-oak hover:bg-oak/90">
            {isAdding ? 'Vazgeç' : '+ Yeni Kayıt'}
          </Button>
        </div>

        {isAdding && (
          <RecordForm
            onDone={() => {
              setIsAdding(false);
              load();
            }}
          />
        )}

        {error && <p className="mb-4 text-sm text-spine">{error}</p>}

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : records.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Kayıt yok.</p>
        ) : (
          <ul className="space-y-2">
            {records.map((r) =>
              editingId === r.id ? (
                <li key={r.id} className="rounded-sm border border-oak/10 bg-paper-elevated p-4">
                  <RecordForm
                    initial={r}
                    onDone={() => {
                      setEditingId(null);
                      load();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li key={r.id} className="rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{r.title}</p>
                      {r.author_name && <p className="truncate text-sm text-ink/60">{r.author_name}</p>}
                      <p className="text-xs text-ink/50">Kimden: {r.borrower.name}</p>
                      <p className="text-xs text-ink/40">
                        {r.borrowed_at}
                        {r.due_at && ` · Son: ${r.due_at}`}
                        {r.returned_at && ` · İade: ${r.returned_at}`}
                      </p>
                      {r.reading_status !== 'not_started' && (
                        <p className={`text-xs ${r.reading_status === 'finished' ? 'text-moss' : 'text-brass'}`}>
                          {r.reading_status === 'finished' ? '✓ Okundu' : 'Okunuyor'}
                          {r.rating && ` · ${'★'.repeat(r.rating)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!r.is_returned && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === r.id}
                          onClick={() => handleReturn(r.id)}
                        >
                          İade Et
                        </Button>
                      )}
                      <button
                        onClick={() => setEditingId(r.id)}
                        className="text-xs text-brass underline underline-offset-2"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs text-spine underline underline-offset-2"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                  {r.reading_status !== 'not_started' && (
                    <TimeLogList
                      endpoint={`/borrowed-books/${r.id}/time-logs`}
                      logs={r.time_logs ?? []}
                      totalMinutes={r.total_minutes ?? 0}
                      onChanged={load}
                    />
                  )}
                </li>
              ),
            )}
          </ul>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function RecordForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: BorrowedBook;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [authorName, setAuthorName] = useState(initial?.author_name ?? '');
  const [pageCount, setPageCount] = useState(initial?.page_count?.toString() ?? '');
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [borrowerId, setBorrowerId] = useState(initial?.borrower.id ?? '');
  const [borrowedAt, setBorrowedAt] = useState(initial?.borrowed_at ?? '');
  const [dueAt, setDueAt] = useState(initial?.due_at ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [readingStatus, setReadingStatus] = useState<BorrowedBook['reading_status']>(
    initial?.reading_status ?? 'not_started',
  );
  const [startedAt, setStartedAt] = useState(initial?.started_at ?? '');
  const [finishedAt, setFinishedAt] = useState(initial?.finished_at ?? '');
  const [rating, setRating] = useState(initial?.rating?.toString() ?? '');
  const [readingNotes, setReadingNotes] = useState(initial?.reading_notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<PaginatedResponse<Borrower>>('/borrowers?per_page=100').then((res) => setBorrowers(res.data));
  }, []);

  async function handleSubmit() {
    if (!title.trim() || !borrowerId) {
      setError('Başlık ve kişi seçimi zorunludur.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        author_name: authorName || null,
        page_count: pageCount ? Number(pageCount) : null,
        borrower_id: borrowerId,
        borrowed_at: borrowedAt || undefined,
        due_at: dueAt || null,
        notes: notes || null,
        reading_status: readingStatus,
        started_at: startedAt || null,
        finished_at: finishedAt || null,
        rating: rating ? Number(rating) : null,
        reading_notes: readingNotes || null,
      };
      if (initial) {
        await api.put(`/borrowed-books/${initial.id}`, payload);
      } else {
        await api.post('/borrowed-books', payload);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mb-4 space-y-3 rounded-sm border border-oak/15 bg-paper-elevated p-4">
      <div className="space-y-1">
        <Label>Kitap adı</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Yazar (opsiyonel)</Label>
        <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Sayfa sayısı (opsiyonel, biliyorsanız — İstatistikler için kullanılır)</Label>
        <Input type="number" min="1" value={pageCount} onChange={(e) => setPageCount(e.target.value)} />
      </div>
      <SearchableSingleSelect
        label="Kimden alındı"
        items={borrowers}
        selectedId={borrowerId}
        onChange={setBorrowerId}
        createEndpoint="/borrowers"
        onCreated={(item) => setBorrowers((prev) => [...prev, item])}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Alınma tarihi</Label>
          <Input type="date" value={borrowedAt} onChange={(e) => setBorrowedAt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Son iade tarihi (opsiyonel)</Label>
          <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Not (opsiyonel)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <fieldset className="space-y-3 rounded-md border border-oak/10 bg-paper p-3">
        <legend className="call-number px-1 text-xs text-oak/60">Okuma Bilgisi</legend>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Durum</Label>
            <select
              value={readingStatus}
              onChange={(e) => setReadingStatus(e.target.value as BorrowedBook['reading_status'])}
              className="w-full rounded-md border border-oak/20 bg-paper-elevated px-2 py-1.5 text-sm text-ink outline-none focus:border-brass"
            >
              {READING_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Puan (1-5)</Label>
            <Input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="h-9 bg-paper-elevated text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Okumaya başlama</Label>
            <Input
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="h-9 bg-paper-elevated text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label>Bitiş</Label>
            <Input
              type="date"
              value={finishedAt}
              onChange={(e) => setFinishedAt(e.target.value)}
              className="h-9 bg-paper-elevated text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Okuma notu (opsiyonel)</Label>
          <Input
            value={readingNotes}
            onChange={(e) => setReadingNotes(e.target.value)}
            className="h-9 bg-paper-elevated text-sm"
          />
        </div>
      </fieldset>

      {error && <p className="text-xs text-spine">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="bg-oak hover:bg-oak/90">
          {isSaving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        {onCancel && (
          <Button size="sm" variant="outline" onClick={onCancel}>
            Vazgeç
          </Button>
        )}
      </div>
    </div>
  );
}
