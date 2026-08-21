'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import type { Book, PaginatedResponse } from '@/types/api';
import { Input } from '@/components/ui/input';

const STATUS_STYLES: Record<Book['status'], string> = {
  available: 'bg-moss/15 text-moss',
  reading: 'bg-brass/20 text-brass',
  loaned: 'bg-spine/15 text-spine',
  lost: 'bg-ink/10 text-ink/60',
  archived: 'bg-ink/5 text-ink/40',
};

export default function BooksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setIsLoading(true);
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      api
        .get<PaginatedResponse<Book>>(`/books${query}`, { signal: controller.signal })
        .then((res) => {
          setError(null);
          setBooks(res.data);
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
  }, [search, user]);

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-ink/50">Yükleniyor…</div>;
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Rafım" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <Input
          placeholder="Kitap ara… (başlık)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-paper-elevated"
        />

        {error && <p className="mt-4 text-sm text-spine">{error}</p>}

        {isLoading ? (
          <p className="mt-8 text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : books.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-display text-xl text-ink/60">Raf boş görünüyor.</p>
            <p className="mt-1 text-sm text-ink/40">
              {search ? 'Bu aramaya uyan bir kitap yok.' : 'Henüz kitap eklenmemiş.'}
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {books.map((book) => (
              <li key={book.id} className="flex overflow-hidden rounded-sm border border-oak/10 bg-paper-elevated">
                <div className="w-1.5 shrink-0 bg-spine" />
                <Link
                  href={`/books/${book.id}`}
                  className="flex flex-1 items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-oak/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg text-ink">{book.title}</p>
                    {book.authors.length > 0 && (
                      <p className="truncate text-sm text-ink/60">
                        {book.authors.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    {book.location && (
                      <p className="call-number mt-1 text-xs text-brass">{book.location.display_name}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[book.status]}`}
                  >
                    {book.status_label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
