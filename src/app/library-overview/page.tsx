'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import { PieChart } from '@/components/pie-chart';
import { SearchableMultiSelect } from '@/components/searchable-select';
import type { ApiItemResponse } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UnreadBook {
  id: string;
  title: string;
  page_count: number | null;
}

interface LibraryOverview {
  total_books: number;
  read_books: number;
  unread_books: number;
  total_pages: number;
  read_pages: number;
  unread_pages: number;
  publisher_distribution: { name: string; count: number }[];
  author_distribution: { name: string; count: number }[];
  unread_book_list: UnreadBook[];
}

export default function LibraryOverviewPage() {
  const [data, setData] = useState<LibraryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiItemResponse<LibraryOverview>>('/library-overview')
      .then((res) => setData(res.data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Kütüphane Detayı" />

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {isLoading || !data ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : data.total_books === 0 ? (
          <p className="text-center text-sm text-ink/40">Kütüphanenizde henüz kitap yok.</p>
        ) : (
          <>
            {/* Genel Özet: kitap + sayfa, okunan/okunmayan kırılımı */}
            <section className="rounded-sm border border-oak/10 bg-paper-elevated px-5 py-4">
              <p className="call-number mb-3 text-xs text-oak/60">Genel Özet</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-display text-2xl text-ink">{data.total_books}</p>
                  <p className="text-xs text-ink/50">toplam kitap</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-oak/10">
                    <div
                      className="h-full rounded-full bg-moss"
                      style={{ width: `${(data.read_books / data.total_books) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink/50">
                    <span className="text-moss">{data.read_books} okundu</span> ·{' '}
                    <span className="text-brass">{data.unread_books} okunmadı</span>
                  </p>
                </div>

                <div>
                  <p className="font-display text-2xl text-ink">{data.total_pages.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-ink/50">toplam sayfa</p>
                  {data.total_pages > 0 && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-oak/10">
                      <div
                        className="h-full rounded-full bg-moss"
                        style={{ width: `${(data.read_pages / data.total_pages) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-ink/50">
                    <span className="text-moss">{data.read_pages.toLocaleString('tr-TR')} okundu</span> ·{' '}
                    <span className="text-brass">{data.unread_pages.toLocaleString('tr-TR')} okunmadı</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Yayınevine Göre Dağılım */}
            <section className="rounded-sm border border-oak/10 bg-paper-elevated px-5 py-4">
              <p className="call-number mb-3 text-xs text-oak/60">Yayınevine Göre Dağılım</p>
              <PieChart data={data.publisher_distribution} />
            </section>

            {/* Yazara Göre Dağılım */}
            <section className="rounded-sm border border-oak/10 bg-paper-elevated px-5 py-4">
              <p className="call-number mb-3 text-xs text-oak/60">Yazara Göre Dağılım</p>
              <PieChart data={data.author_distribution} />
            </section>

            {/* Okuma Süresi Hesaplayıcı */}
            <ReadingPaceCalculator books={data.unread_book_list} />
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function ReadingPaceCalculator({ books }: { books: UnreadBook[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dailyPages, setDailyPages] = useState('20');

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const selectedBooks = books.filter((b) => selectedIds.includes(b.id));
  const knownPagesBooks = selectedBooks.filter((b) => b.page_count !== null);
  const unknownPagesCount = selectedBooks.length - knownPagesBooks.length;
  const totalPages = knownPagesBooks.reduce((sum, b) => sum + (b.page_count ?? 0), 0);
  const daily = Number(dailyPages) || 0;
  const estimatedDays = daily > 0 && totalPages > 0 ? Math.ceil(totalPages / daily) : null;

  const bookOptions = books.map((b) => ({
    id: b.id,
    name: b.page_count ? `${b.title} (${b.page_count} sayfa)` : `${b.title} (sayfa sayısı bilinmiyor)`,
  }));

  return (
    <section className="rounded-sm border border-oak/10 bg-paper-elevated px-5 py-4">
      <p className="call-number mb-3 text-xs text-oak/60">Okuma Süresi Hesaplayıcı</p>

      {books.length === 0 ? (
        <p className="text-sm text-ink/40">Okunmamış kitabınız kalmadı — tebrikler!</p>
      ) : (
        <div className="space-y-3">
          <SearchableMultiSelect
            label="Okunmamış kitaplardan seç"
            items={bookOptions}
            selectedIds={selectedIds}
            onToggle={toggle}
          />

          <div className="space-y-1">
            <Label>Günde kaç sayfa okuyacaksınız?</Label>
            <Input
              type="number"
              min="1"
              value={dailyPages}
              onChange={(e) => setDailyPages(e.target.value)}
              className="w-32"
            />
          </div>

          {selectedBooks.length > 0 && (
            <div className="rounded-md bg-paper px-4 py-3">
              <p className="text-sm text-ink">
                Seçilen <span className="font-medium">{selectedBooks.length} kitap</span>,{' '}
                <span className="font-medium">{totalPages.toLocaleString('tr-TR')} sayfa</span>
                {unknownPagesCount > 0 && (
                  <span className="text-ink/40"> ({unknownPagesCount} kitabın sayfa sayısı bilinmiyor, hesaba dahil değil)</span>
                )}
              </p>
              {estimatedDays !== null ? (
                <p className="mt-1 font-display text-lg text-brass">
                  Yaklaşık {estimatedDays} günde bitirirsiniz
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink/40">Günlük sayfa değeri girin.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
