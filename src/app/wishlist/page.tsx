'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import type { ApiArrayResponse, ApiItemResponse, Book } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WishlistItem {
  id: string;
  title: string;
  author_name: string | null;
  isbn: string | null;
  notes: string | null;
  created_at: string;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertedBook, setConvertedBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    api
      .get<ApiArrayResponse<WishlistItem>>('/wishlist')
      .then((res) => setItems(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Bu kayıt silinsin mi?')) return;
    try {
      await api.delete(`/wishlist/${id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silinemedi.');
    }
  }

  async function handleConvert(id: string) {
    if (!window.confirm('Bu kitap kütüphanenize eklensin mi? Alınacaklar listesinden çıkarılacak.')) return;
    setConvertingId(id);
    setError(null);
    try {
      const res = await api.post<ApiItemResponse<Book>>(`/wishlist/${id}/convert`);
      setConvertedBook(res.data);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dönüştürülemedi.');
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Alınacaklar" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <Button onClick={() => setIsAdding((v) => !v)} className="mb-4 w-full bg-oak hover:bg-oak/90">
          {isAdding ? 'Vazgeç' : '+ Yeni Kayıt'}
        </Button>

        {isAdding && (
          <ItemForm
            onDone={() => {
              setIsAdding(false);
              load();
            }}
          />
        )}

        {convertedBook && (
          <div className="mb-4 rounded-md border border-moss/30 bg-moss/5 px-4 py-3">
            <p className="text-sm text-ink">
              <span className="font-medium">{convertedBook.title}</span> kütüphanenize eklendi.
            </p>
            <Link
              href={`/books/${convertedBook.id}`}
              className="text-xs text-brass underline underline-offset-2"
            >
              Kitap detayına git →
            </Link>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-spine">{error}</p>}

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Alınacaklar listeniz boş.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) =>
              editingId === item.id ? (
                <li key={item.id} className="rounded-sm border border-oak/10 bg-paper-elevated p-4">
                  <ItemForm
                    initial={item}
                    onDone={() => {
                      setEditingId(null);
                      load();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{item.title}</p>
                    {item.author_name && <p className="truncate text-sm text-ink/60">{item.author_name}</p>}
                    {item.notes && <p className="text-xs text-ink/40">{item.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={convertingId === item.id}
                      onClick={() => handleConvert(item.id)}
                    >
                      Kütüphaneye Ekle
                    </Button>
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="text-xs text-brass underline underline-offset-2"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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
      </div>

      <BottomNav />
    </main>
  );
}

function ItemForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: WishlistItem;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [authorName, setAuthorName] = useState(initial?.author_name ?? '');
  const [isbn, setIsbn] = useState(initial?.isbn ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Başlık zorunludur.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        author_name: authorName || null,
        isbn: isbn || null,
        notes: notes || null,
      };
      if (initial) {
        await api.put(`/wishlist/${initial.id}`, payload);
      } else {
        await api.post('/wishlist', payload);
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
        <Label>ISBN (opsiyonel)</Label>
        <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Not (opsiyonel)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="örn. arkadaşım önerdi" />
      </div>
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
