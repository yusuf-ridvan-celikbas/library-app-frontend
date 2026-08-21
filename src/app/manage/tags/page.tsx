'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCrudList } from '@/lib/use-crud-list';
import { ApiError } from '@/lib/api-client';
import type { Tag } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManageTagsPage() {
  const { items, isLoading, error, create, update, remove } = useCrudList<Tag>('/tags', false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <p className="call-number text-xs text-oak/60">ETİKETLER</p>
          <Link href="/manage" className="text-sm text-ink/60 underline underline-offset-2">
            ← Geri
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        <Button onClick={() => setIsAdding((v) => !v)} className="mb-4 w-full bg-oak hover:bg-oak/90">
          {isAdding ? 'Vazgeç' : '+ Yeni Etiket'}
        </Button>

        {isAdding && (
          <TagForm
            onCancel={() => setIsAdding(false)}
            onSubmit={async (data) => {
              await create(data);
              setIsAdding(false);
            }}
          />
        )}

        {error && <p className="mb-4 text-sm text-spine">{error}</p>}

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Henüz etiket eklenmemiş.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((tag) =>
              editingId === tag.id ? (
                <li key={tag.id} className="rounded-sm border border-oak/10 bg-paper-elevated p-4">
                  <TagForm
                    initial={tag}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (data) => {
                      await update(tag.id, data);
                      setEditingId(null);
                    }}
                  />
                </li>
              ) : (
                <li
                  key={tag.id}
                  className="flex items-center justify-between rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3"
                >
                  <span
                    className="rounded-full px-3 py-1 text-sm text-paper"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => setEditingId(tag.id)} className="text-brass underline underline-offset-2">
                      Düzenle
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`"${tag.name}" silinsin mi?`)) remove(tag.id);
                      }}
                      className="text-spine underline underline-offset-2"
                    >
                      Sil
                    </button>
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

function TagForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Tag;
  onSubmit: (data: { name: string; color: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? '#6b7280');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), color });
    } catch (err) {
      setError(err instanceof ApiError ? (err.fieldError('name') ?? err.message) : 'Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-sm border border-oak/15 bg-paper-elevated p-4">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label>İsim</Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Renk</Label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-md border border-oak/20 bg-paper"
          />
        </div>
      </div>
      {error && <p className="text-xs text-spine">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSaving} className="bg-oak hover:bg-oak/90">
          Kaydet
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
