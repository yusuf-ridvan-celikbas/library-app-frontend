'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCrudList } from '@/lib/use-crud-list';
import type { Location } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManageLocationsPage() {
  const { items, isLoading, error, create, update, remove } = useCrudList<Location>('/locations', false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <p className="call-number text-xs text-oak/60">KONUMLAR</p>
          <Link href="/manage" className="text-sm text-ink/60 underline underline-offset-2">
            ← Geri
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        <Button onClick={() => setIsAdding((v) => !v)} className="mb-4 w-full bg-oak hover:bg-oak/90">
          {isAdding ? 'Vazgeç' : '+ Yeni Konum'}
        </Button>

        {isAdding && (
          <LocationForm
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
          <p className="text-center text-sm text-ink/40">Henüz konum eklenmemiş.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((location) =>
              editingId === location.id ? (
                <li key={location.id} className="rounded-sm border border-oak/10 bg-paper-elevated p-4">
                  <LocationForm
                    initial={location}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (data) => {
                      await update(location.id, data);
                      setEditingId(null);
                    }}
                  />
                </li>
              ) : (
                <li
                  key={location.id}
                  className="flex items-center justify-between rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3"
                >
                  <p className="call-number text-sm text-ink">{location.display_name}</p>
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => setEditingId(location.id)}
                      className="text-brass underline underline-offset-2"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`"${location.display_name}" silinsin mi?`)) remove(location.id);
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

function LocationForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Location;
  onSubmit: (data: { room: string; shelf: string; position: string | null; label: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [room, setRoom] = useState(initial?.room ?? '');
  const [shelf, setShelf] = useState(initial?.shelf ?? '');
  const [position, setPosition] = useState(initial?.position ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!room.trim() || !shelf.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        room: room.trim(),
        shelf: shelf.trim(),
        position: position || null,
        label: label || null,
      });
    } catch {
      setError('Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-sm border border-oak/15 bg-paper-elevated p-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Oda *</Label>
          <Input autoFocus value={room} onChange={(e) => setRoom(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Raf *</Label>
          <Input value={shelf} onChange={(e) => setShelf(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Göz/Sıra (opsiyonel)</Label>
          <Input value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Görünen ad (opsiyonel)</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
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
