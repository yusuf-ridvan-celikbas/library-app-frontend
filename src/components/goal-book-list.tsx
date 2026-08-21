'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { SearchableMultiSelect } from '@/components/searchable-select';
import type { ApiItemResponse, Book, PaginatedResponse, ReadingGoal } from '@/types/api';

/**
 * Faz 3b: bir hedefe belirli kitaplar iliştirme. Liste boşken hedef
 * "sayım modunda" (Faz 3) çalışmaya devam eder — bu bileşen kullanılmasa
 * bile mevcut hedefler bozulmaz.
 *
 * ÖNEMLİ UX düzeltmesi: bir hedefe kitap eklemek, o hedefin ilerleme
 * hesaplama şeklini "sayım modundan" "liste moduna" çevirir — bu andan
 * itibaren SADECE listedeki kitaplar sayılır. Bu, sayım modunda zaten
 * var olan ilerlemenin (örn. "10/27") görünürde düşmesine yol açabilir
 * (veri KAYBOLMAZ, sadece hangi kitapların sayılacağı değişir). Bu
 * yüzden, sayım modunda zaten ilerleme varken listeye İLK kitap
 * eklenirken kullanıcıyı özellikle uyarıyoruz.
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && books.length === 0) {
      api.get<PaginatedResponse<Book>>('/books?per_page=100').then((res) => setBooks(res.data));
    }
  }, [isOpen, books.length]);

  const bookOptions = books.map((b) => ({ id: b.id, name: b.title }));
  const selectedIds = goal.books.map((b) => b.id);

  async function handleToggle(bookId: string) {
    const isCurrentlySelected = selectedIds.includes(bookId);

    // Mod-değişikliği uyarısı: sadece İLK kitap eklenirken VE hedefin
    // sayım modunda zaten tamamlanmış kitabı varken gösterilir.
    if (!isCurrentlySelected && goal.books.length === 0 && goal.completed_books > 0) {
      const confirmed = window.confirm(
        `Bu hedefte şu anda ${goal.completed_books} kitaplık bir ilerlemeniz var (sayım moduna göre hesaplanmış).\n\n` +
          'Bir kitap listesi eklerseniz, ilerleme artık SADECE bu listedeki kitaplara göre hesaplanacak. ' +
          'Önceden okuduğunuz kitaplar listede yoksa, ilerleme çubuğu düşük görünecek — ama okuma geçmişiniz KAYBOLMAZ, ' +
          'sadece bu hedefin sayma şekli değişir.\n\nDevam etmek istiyor musunuz?',
      );
      if (!confirmed) return;
    }

    setError(null);
    try {
      if (isCurrentlySelected) {
        const res = await api.delete<ApiItemResponse<ReadingGoal>>(`/reading-goals/${goal.id}/books/${bookId}`);
        onChanged(res.data);
      } else {
        const res = await api.post<ApiItemResponse<ReadingGoal>>(`/reading-goals/${goal.id}/books`, {
          book_id: bookId,
        });
        onChanged(res.data);
      }
    } catch {
      setError('İşlem başarısız oldu.');
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
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className={b.is_finished ? 'text-moss' : 'text-ink/70'}>
                    {b.is_finished ? '✓ ' : ''}
                    {b.title}
                  </span>
                  <button
                    onClick={() => handleToggle(b.id)}
                    className="text-xs text-spine underline underline-offset-2"
                  >
                    Çıkar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* SearchableMultiSelect: pencere kapanmadan birden fazla kitap
              art arda seçilip listeye eklenebilir/çıkarılabilir — her
              tıklama anında attach/detach isteği tetikler. */}
          <SearchableMultiSelect
            label="Kitap ekle/çıkar"
            items={bookOptions}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
          {error && <p className="text-xs text-spine">{error}</p>}
        </div>
      )}
    </div>
  );
}
