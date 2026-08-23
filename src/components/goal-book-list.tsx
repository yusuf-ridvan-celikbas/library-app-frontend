'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { SearchableMultiSelect } from '@/components/searchable-select';
import type { ApiArrayResponse, ApiItemResponse, Book, PaginatedResponse, ReadingGoal } from '@/types/api';

interface BorrowedBookLite {
  id: string;
  title: string;
}

/**
 * Faz 3b + ödünç kitap desteği: bir hedefe belirli kitaplar/ödünç
 * kitaplar iliştirme. Liste boşken hedef "sayım modunda" çalışmaya
 * devam eder — bu bileşen kullanılmasa bile mevcut hedefler bozulmaz.
 *
 * KRİTİK UX notu: SearchableMultiSelect kullanılıyor (SearchableSingleSelect
 * DEĞİL) — çünkü kullanıcı aynı açılır pencereyi kapatmadan art arda
 * birden fazla kitap işaretleyip kaldırabilmeli. Her toggle, anında
 * attach/detach isteği tetikler (ayrı bir "Ekle" butonuna gerek yok).
 * İki ayrı seçici var (Kitap / Ödünç Kitap) çünkü bunlar backend'de
 * farklı endpoint'lere gidiyor.
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && books.length === 0) {
      api.get<PaginatedResponse<Book>>('/books?per_page=100').then((res) => setBooks(res.data));
    }
    if (isOpen && borrowedBooks.length === 0) {
      api
        .get<ApiArrayResponse<BorrowedBookLite>>('/borrowed-books?status=all')
        .then((res) => setBorrowedBooks(res.data));
    }
  }, [isOpen, books.length, borrowedBooks.length]);

  const attachedBookIds = goal.books.filter((b) => b.source === 'book').map((b) => b.target_id);
  const attachedBorrowedIds = goal.books.filter((b) => b.source === 'borrowed').map((b) => b.target_id);

  // Filtrelenmiyor — seçili/seçili değil durumu SearchableMultiSelect'in
  // kendi işaretleme mekanizmasıyla gösteriliyor, aynı pencerede hem
  // ekleme hem çıkarma yapılabilsin diye.
  const bookOptions = books.map((b) => ({ id: b.id, name: b.title }));
  const borrowedOptions = borrowedBooks.map((b) => ({ id: b.id, name: b.title }));

  async function handleToggleBook(bookId: string) {
    setError(null);
    try {
      const isAttached = attachedBookIds.includes(bookId);
      const res = isAttached
        ? await api.delete<ApiItemResponse<ReadingGoal>>(`/reading-goals/${goal.id}/books/${bookId}`)
        : await api.post<ApiItemResponse<ReadingGoal>>(`/reading-goals/${goal.id}/books`, { book_id: bookId });
      onChanged(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem başarısız oldu.');
    }
  }

  async function handleToggleBorrowed(borrowedId: string) {
    setError(null);
    try {
      const isAttached = attachedBorrowedIds.includes(borrowedId);
      const res = isAttached
        ? await api.delete<ApiItemResponse<ReadingGoal>>(`/reading-goals/${goal.id}/borrowed-books/${borrowedId}`)
        : await api.post<ApiItemResponse<ReadingGoal>>(`/reading-goals/${goal.id}/borrowed-books`, {
            borrowed_book_id: borrowedId,
          });
      onChanged(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem başarısız oldu.');
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
                    onClick={() =>
                      b.source === 'book' ? handleToggleBook(b.target_id) : handleToggleBorrowed(b.target_id)
                    }
                    className="text-xs text-spine underline underline-offset-2"
                  >
                    Çıkar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <SearchableMultiSelect
            label="Kendi kitaplığından ekle/çıkar"
            items={bookOptions}
            selectedIds={attachedBookIds}
            onToggle={handleToggleBook}
          />

          <SearchableMultiSelect
            label="Ödünç aldıklarından ekle/çıkar"
            items={borrowedOptions}
            selectedIds={attachedBorrowedIds}
            onToggle={handleToggleBorrowed}
          />

          {error && <p className="text-xs text-spine">{error}</p>}
        </div>
      )}
    </div>
  );
}
