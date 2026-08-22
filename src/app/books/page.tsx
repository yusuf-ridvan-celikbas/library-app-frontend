'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import type { Author, Book, PaginatedResponse, Publisher } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STATUS_STYLES: Record<Book['status'], string> = {
  available: 'bg-moss/15 text-moss',
  reading: 'bg-brass/20 text-brass',
  loaned: 'bg-spine/15 text-spine',
  lost: 'bg-ink/10 text-ink/60',
  archived: 'bg-ink/5 text-ink/40',
  gifted: 'bg-oak/10 text-oak',
};

// Bir sayfada yeterince büyük bir grup çekip "Daha fazla yükle" ile
// devamını getiriyoruz — kişisel bir kütüphane için makul bir denge
// (tek seferde binlerce kaydı çekmek yerine).
const PER_PAGE = 60;

export default function BooksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Filtre seçicileri için referans listeleri — bir kez çekilir.
  useEffect(() => {
    if (!user) return;
    api.get<PaginatedResponse<Publisher>>('/publishers?per_page=100').then((res) => setPublishers(res.data));
    api.get<PaginatedResponse<Author>>('/authors?per_page=100').then((res) => setAuthors(res.data));
  }, [user]);

  // Arama ya da filtreler değiştiğinde sayfa 1'den yeniden başla.
  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setIsLoading(true);
      const params = new URLSearchParams({ per_page: String(PER_PAGE), page: '1' });
      if (search.trim()) params.set('search', search.trim());
      if (publisherId) params.set('publisher_id', publisherId);
      if (authorId) params.set('author_id', authorId);

      api
        .get<PaginatedResponse<Book>>(`/books?${params.toString()}`, { signal: controller.signal })
        .then((res) => {
          setError(null);
          setBooks(res.data);
          setPage(res.meta.current_page);
          setLastPage(res.meta.last_page);
        })
        .catch((err) => {
          if (err instanceof ApiError) setError(err.message);
        })
        .finally(() => setIsLoading(false));
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, publisherId, authorId, user]);

  function loadMore() {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    const params = new URLSearchParams({ per_page: String(PER_PAGE), page: String(nextPage) });
    if (search.trim()) params.set('search', search.trim());
    if (publisherId) params.set('publisher_id', publisherId);
    if (authorId) params.set('author_id', authorId);

    api
      .get<PaginatedResponse<Book>>(`/books?${params.toString()}`)
      .then((res) => {
        setBooks((prev) => [...prev, ...res.data]);
        setPage(res.meta.current_page);
        setLastPage(res.meta.last_page);
      })
      .finally(() => setIsLoadingMore(false));
  }

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-ink/50">Yükleniyor…</div>;
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Rafım" />

      <div className="mx-auto max-w-3xl px-4 py-6">
        <Input
          placeholder="Kitap ara… (başlık)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-paper-elevated"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            value={publisherId}
            onChange={(e) => setPublisherId(e.target.value)}
            className="rounded-md border border-oak/20 bg-paper-elevated px-3 py-2 text-sm text-ink outline-none focus:border-brass"
          >
            <option value="">Tüm Yayınevleri</option>
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="rounded-md border border-oak/20 bg-paper-elevated px-3 py-2 text-sm text-ink outline-none focus:border-brass"
          >
            <option value="">Tüm Yazarlar</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mt-4 text-sm text-spine">{error}</p>}

        {isLoading ? (
          <p className="mt-8 text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : books.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-display text-xl text-ink/60">Raf boş görünüyor.</p>
            <p className="mt-1 text-sm text-ink/40">
              {search || publisherId || authorId ? 'Bu filtrelere uyan bir kitap yok.' : 'Henüz kitap eklenmemiş.'}
            </p>
          </div>
        ) : (
          <>
            {/* 3 sütunlu ızgara — kitap sayısı arttıkça aşağı doğru
                büyür, sayfa normal şekilde kayar (yapay bir yükseklik
                sınırı yok). */}
            <ul className="mt-6 grid grid-cols-3 gap-2">
              {books.map((book) => {
                const firstTag = book.tags[0];
                return (
                  <li key={book.id} className="overflow-hidden rounded-sm border border-oak/10 bg-paper-elevated">
                    <Link href={`/books/${book.id}`} className="block transition-colors hover:bg-oak/5">
                      <div className="h-1.5 bg-spine" />
                      <div className="p-2.5">
                        {/* Üst satır: başlık solda, (varsa) etiket sağda — başlığın "karşısında" */}
                        <div className="flex items-start justify-between gap-1">
                          <p className="line-clamp-2 min-w-0 flex-1 font-display text-sm leading-snug text-ink">
                            {book.title}
                          </p>
                          {firstTag && (
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-paper"
                              style={{ backgroundColor: firstTag.color }}
                            >
                              {firstTag.name}
                            </span>
                          )}
                        </div>

                        {/* Yazar · Yayınevi birleşik satırı */}
                        {(book.authors[0] || book.publisher) && (
                          <p className="mt-1 truncate text-xs text-ink/50">
                            {book.authors[0]?.name}
                            {book.authors[0] && book.publisher && ' · '}
                            {book.publisher?.name}
                          </p>
                        )}

                        {/* Alt satır: durum solda, konum sağda */}
                        <div className="mt-1.5 flex items-center justify-between gap-1">
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[book.status]}`}
                          >
                            {book.status_label}
                          </span>
                          {book.location && (
                            <span className="call-number truncate text-[10px] text-brass">
                              {book.location.display_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {page < lastPage && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="border-oak/20"
                >
                  {isLoadingMore ? 'Yükleniyor…' : 'Daha fazla yükle'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Kayan ekleme butonu (FAB) — alt nav'ın hemen üzerinde, sağ altta */}
      <Link
        href="/books/scan"
        aria-label="Kitap ekle"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-oak text-paper shadow-lg transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </Link>

      <BottomNav />
    </main>
  );
}
