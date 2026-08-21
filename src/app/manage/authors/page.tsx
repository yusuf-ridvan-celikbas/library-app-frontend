'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCrudList } from '@/lib/use-crud-list';
import type { Author } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManageAuthorsPage() {
  const { items, isLoading, error, create, update, remove } = useCrudList<Author>('/authors', true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <p className="call-number text-xs text-oak/60">YAZARLAR</p>
          <Link href="/manage" className="text-sm text-ink/60 underline underline-offset-2">
            ← Geri
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        <Button onClick={() => setIsAdding((v) => !v)} className="mb-4 w-full bg-oak hover:bg-oak/90">
          {isAdding ? 'Vazgeç' : '+ Yeni Yazar'}
        </Button>

        {isAdding && (
          <AuthorForm
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
          <p className="text-center text-sm text-ink/40">Henüz yazar eklenmemiş.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((author) =>
              editingId === author.id ? (
                <li key={author.id} className="rounded-sm border border-oak/10 bg-paper-elevated p-4">
                  <AuthorForm
                    initial={author}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (data) => {
                      await update(author.id, data);
                      setEditingId(null);
                    }}
                  />
                </li>
              ) : (
                <li
                  key={author.id}
                  className="flex items-center justify-between rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3"
                >
                  <div>
                    <p className="text-ink">{author.name}</p>
                    {author.birth_country && <p className="text-xs text-ink/40">{author.birth_country}</p>}
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => setEditingId(author.id)} className="text-brass underline underline-offset-2">
                      Düzenle
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`"${author.name}" silinsin mi?`)) remove(author.id);
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

function AuthorForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Author;
  onSubmit: (data: { name: string; birth_country: string | null; bio: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [birthCountry, setBirthCountry] = useState(initial?.birth_country ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), birth_country: birthCountry || null, bio: bio || null });
    } catch {
      setError('Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-sm border border-oak/15 bg-paper-elevated p-4">
      <div className="space-y-1">
        <Label>İsim</Label>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Ülke kodu (TR, US…)</Label>
        <Input value={birthCountry} onChange={(e) => setBirthCountry(e.target.value.toUpperCase())} maxLength={2} />
      </div>
      <div className="space-y-1">
        <Label>Kısa biyografi</Label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-oak/20 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brass"
        />
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
