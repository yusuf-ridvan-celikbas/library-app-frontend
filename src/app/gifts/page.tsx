'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import type { ApiArrayResponse, Book, Borrower } from '@/types/api';
import { Button } from '@/components/ui/button';

interface Gift {
  id: string;
  book: Pick<Book, 'id' | 'title'> | null;
  borrower: Pick<Borrower, 'id' | 'name'> | null;
  gifted_at: string;
  notes: string | null;
  created_at: string;
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    api
      .get<ApiArrayResponse<Gift>>('/gifts')
      .then((res) => setGifts(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleUndo(gift: Gift) {
    if (!gift.book) return;
    if (!window.confirm(`"${gift.book.title}" için hediye kaydı geri alınsın mı?`)) return;
    setUndoingId(gift.id);
    setError(null);
    try {
      await api.delete(`/books/${gift.book.id}/gift`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Geri alınamadı.');
    } finally {
      setUndoingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Hediyeler" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {error && <p className="mb-4 text-sm text-spine">{error}</p>}

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : gifts.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Henüz hediye edilen bir kitap yok.</p>
        ) : (
          <ul className="space-y-2">
            {gifts.map((gift) => (
              <li
                key={gift.id}
                className="flex items-center justify-between rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3"
              >
                <div className="min-w-0">
                  {gift.book ? (
                    <Link
                      href={`/books/${gift.book.id}`}
                      className="font-medium text-ink underline underline-offset-2"
                    >
                      {gift.book.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-ink/50">Silinmiş kitap</span>
                  )}
                  <p className="text-sm text-ink/60">{gift.borrower?.name ?? 'Silinmiş kişi'}</p>
                  <p className="text-xs text-ink/40">
                    {gift.gifted_at}
                    {gift.notes && ` · ${gift.notes}`}
                  </p>
                </div>
                {gift.book && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={undoingId === gift.id}
                    onClick={() => handleUndo(gift)}
                  >
                    Geri Al
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
