'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { SearchableSingleSelect } from '@/components/searchable-select';
import type { ApiArrayResponse, ApiItemResponse, Book, PaginatedResponse, ReadingGoal } from '@/types/api';
import { Button } from '@/components/ui/button';

interface BorrowedBookLite {
  id: string;
  title: string;
}

/**
 * Faz 3b + ödünç kitap desteği: bir hedefe belirli kitaplar/ödünç
 * kitaplar iliştirme. Liste boşken hedef "sayım modunda" çalışmaya
 * devam eder — bu bileşen kullanılmasa bile mevcut hedefler bozulmaz.
 *
 * İki ayrı seçici var (Kitap / Ödünç Kitap) çünkü bunlar backend'de
 * farklı endpoint'lere gidiyor (attachBook vs attachBorrowedBook) —
 * tek bir birleşik seçiciye zorlamak, kullanıcının "hangi kaynaktan
 * ekliyorum" niyetini gizler.
 */
export function GoalBookList({
  goal,
  onChanged,
}: {
  goal: ReadingGoal;
  onChanged: (updated: ReadingGoal) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBookLite[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedBorrowedId, setSelectedBorrowedId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && books.length === 0) {
      api.get<PaginatedResponse<Book>>('/books?per_page=100').then((res) => setBooks(res.data));
    }
    if (isOpen && borrowedBooks.length === 0) {
      api.get<ApiArrayResponse<BorrowedBookLite>>('/borrowed-books?status=all').then((res) => setBorrowedBooks(res.data));
    }
  }, [isOpen, books.length, borrowedBooks.length]);

  const attachedBookIds = goal.books.filter((b) => b.source === 'book').map((b) => b.target_id);
  const attachedBorrowedIds = goal.books.filter((b) => b.source === 'borrowed').map((b) => b.target_id);

  const bookOptions = books.filter((b) => !attachedBookIds.includes(b.id)).map((b) => ({ id: b.id, name: b.title }));
  const borrowedOptions = borrowedBooks
    .filter((b) => !attachedBorrowedIds.includes(b.id))
    .map((b) => ({ id: b.id, name: b.title }));

  async function handleAddBook() {
    if (!selectedBookId) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await api.post<ApiItemResponse<ReadingGoal>>(`/reading-goals/${goal.id}/books`, {
        book_id: selectedBookId,
      });
      onChanged(res.data);
      setSelectedBookId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Eklenemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddBorrowed() {
    if (!selectedBorrowedId) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await api.post<ApiItemResponse<ReadingGoal>>(`/reading-goals/${goal.id}/borrowed-books`, {
        borrowed_book_id: selectedBorrowedId,
      });
      onChanged(res.data);
      setSelectedBorrowedId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Eklenemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(source: 'book' | 'borrowed', targetId: string) {
    try {
      const path =
        source === 'book'
          ? `/reading-goals/${goal.id}/books/${targetId}`
          : `/reading-goals/${goal.id}/borrowed-books/${targetId}`;
      const res = await api.delete<ApiItemResponse<ReadingGoal>>(path);
      onChanged(res.data);
    } catch {
      // sessizce yut
    }
  }

  return (
    <div className="border-t border-oak/10 px-5 py-4">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="text-xs text-brass underline underline-offset-2"
      >
        {isOpen ? 'Kitap listesini gizle' : `Kitap listesi (${goal.books.length})`}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {goal.books.length === 0 ? (
            <p className="text-xs text-ink/40">
              Henüz kitap eklenmedi. Liste boşken hedef sayım moduyla (tahmini sayfa/gün) çalışır.
            </p>
          ) : (
            <ul className="space-y-1">
              {goal.books.map((b) => (
                <li key={b.item_id} className="flex items-center justify-between text-sm">
                  <span className={b.is_finished ? 'text-moss' : 'text-ink/70'}>
                    {b.is_finished ? '✓ ' : ''}
                    {b.title}
                    {b.source === 'borrowed' && (
                      <span className="ml-1.5 rounded-full bg-oak/10 px-1.5 py-0.5 text-[10px] font-medium text-oak">
                        Ödünç
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleRemove(b.source, b.target_id)}
                    className="text-xs text-spine underline underline-offset-2"
                  >
                    Çıkar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SearchableSingleSelect
                label="Kendi kitaplığından ekle"
                items={bookOptions}
                selectedId={selectedBookId}
                onChange={setSelectedBookId}
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddBook}
              disabled={!selectedBookId || isSaving}
              className="bg-oak hover:bg-oak/90"
            >
              Ekle
            </Button>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SearchableSingleSelect
                label="Ödünç aldıklarından ekle"
                items={borrowedOptions}
                selectedId={selectedBorrowedId}
                onChange={setSelectedBorrowedId}
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddBorrowed}
              disabled={!selectedBorrowedId || isSaving}
              variant="outline"
            >
              Ekle
            </Button>
          </div>

          {error && <p className="text-xs text-spine">{error}</p>}
        </div>
      )}
    </div>
  );
}
