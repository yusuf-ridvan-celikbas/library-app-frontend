'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import type { PaginatedResponse, ReadingSession, ReadingStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'planned', label: 'Planlandı' },
  { value: 'in_progress', label: 'Okunuyor' },
  { value: 'finished', label: 'Bitti' },
  { value: 'abandoned', label: 'Yarım Bırakıldı' },
];

interface SessionForm {
  status: ReadingStatus;
  startedAt: string;
  finishedAt: string;
  rating: string;
  notes: string;
}

const emptyForm: SessionForm = { status: 'planned', startedAt: '', finishedAt: '', rating: '', notes: '' };

function sessionToForm(s: ReadingSession): SessionForm {
  return {
    status: s.status,
    startedAt: s.started_at ?? '',
    finishedAt: s.finished_at ?? '',
    rating: s.rating?.toString() ?? '',
    notes: s.notes ?? '',
  };
}

/** Bir kitabın okuma geçmişini (birden fazla okuma turu olabilir) listeler, ekler, düzenler. */
export function ReadingSection({ bookId }: { bookId: string }) {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    api
      .get<PaginatedResponse<ReadingSession>>(`/reading-sessions?book_id=${bookId}&per_page=20`)
      .then((res) => setSessions(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [bookId]);

  async function handleCreate(form: SessionForm) {
    await api.post('/reading-sessions', {
      book_id: bookId,
      status: form.status,
      started_at: form.startedAt || null,
      finished_at: form.finishedAt || null,
      rating: form.rating ? Number(form.rating) : null,
      notes: form.notes || null,
    });
    setIsAdding(false);
    load();
  }

  async function handleUpdate(id: string, form: SessionForm) {
    await api.put(`/reading-sessions/${id}`, {
      book_id: bookId,
      status: form.status,
      started_at: form.startedAt || null,
      finished_at: form.finishedAt || null,
      rating: form.rating ? Number(form.rating) : null,
      notes: form.notes || null,
    });
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Bu okuma kaydı silinsin mi?')) return;
    await api.delete(`/reading-sessions/${id}`);
    load();
  }

  return (
    <fieldset className="space-y-3 rounded-sm border border-oak/10 bg-paper-elevated px-6 py-5">
      <div className="flex items-center justify-between">
        <legend className="call-number px-1 text-xs text-oak/60">Okuma Geçmişi</legend>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="text-xs text-brass underline underline-offset-2"
        >
          {isAdding ? 'Vazgeç' : '+ Kayıt Ekle'}
        </button>
      </div>

      {isAdding && <SessionForm initial={emptyForm} onSubmit={handleCreate} onCancel={() => setIsAdding(false)} />}

      {isLoading ? (
        <p className="text-sm text-ink/40">Yükleniyor…</p>
      ) : sessions.length === 0 && !isAdding ? (
        <p className="text-sm text-ink/40">Henüz okuma kaydı yok.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) =>
            editingId === s.id ? (
              <li key={s.id}>
                <SessionForm
                  initial={sessionToForm(s)}
                  onSubmit={(form) => handleUpdate(s.id, form)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={s.id} className="flex items-center justify-between rounded-md border border-oak/10 bg-paper px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium text-ink">{s.status_label}</span>
                  {s.started_at && <span className="text-ink/50"> · {s.started_at}</span>}
                  {s.finished_at && <span className="text-ink/50"> → {s.finished_at}</span>}
                  {s.rating && <span className="text-brass"> · {'★'.repeat(s.rating)}</span>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingId(s.id)}
                    className="text-xs text-brass underline underline-offset-2"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-xs text-spine underline underline-offset-2"
                  >
                    Sil
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </fieldset>
  );
}

function SessionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: SessionForm;
  onSubmit: (form: SessionForm) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-oak/15 bg-paper p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Durum</Label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ReadingStatus })}
            className="w-full rounded-md border border-oak/20 bg-paper-elevated px-2 py-1.5 text-sm text-ink outline-none focus:border-brass"
          >
            {STATUS_OPTIONS.map((s) => (
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
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
            className="h-9 bg-paper-elevated text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Başlangıç</Label>
          <Input
            type="date"
            value={form.startedAt}
            onChange={(e) => setForm({ ...form, startedAt: e.target.value })}
            className="h-9 bg-paper-elevated text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label>Bitiş</Label>
          <Input
            type="date"
            value={form.finishedAt}
            onChange={(e) => setForm({ ...form, finishedAt: e.target.value })}
            className="h-9 bg-paper-elevated text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Not</Label>
        <Input
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="h-9 bg-paper-elevated text-sm"
        />
      </div>
      {error && <p className="text-xs text-spine">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit} disabled={isSaving} className="bg-oak hover:bg-oak/90">
          Kaydet
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
