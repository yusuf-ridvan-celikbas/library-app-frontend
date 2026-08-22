'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import type { ApiItemResponse } from '@/types/api';

interface BookPace {
  title: string;
  days: number;
}

interface ReadingStats {
  total_books_finished: number;
  total_pages_read: number;
  average_rating: number | null;
  selected_year: number;
  available_years: number[];
  year_stats: {
    books_finished: number;
    pages_read: number;
    average_daily_pages: number;
    days_elapsed: number;
    is_current_year: boolean;
  };
  pace: {
    average_days_to_finish: number | null;
    fastest_book: BookPace | null;
    slowest_book: BookPace | null;
  };
  monthly_breakdown: { month: string; books_finished: number; pages_read: number; average_daily_pages: number }[];
}

export default function ReadingStatsPage() {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null); // null = henüz seçilmedi, backend varsayılanı (bu yıl) kullanılır

  useEffect(() => {
    setIsLoading(true);
    const query = year ? `?year=${year}` : '';
    api
      .get<ApiItemResponse<ReadingStats>>(`/reading-stats${query}`)
      .then((res) => {
        setStats(res.data);
        // İlk yüklemede backend'in seçtiği varsayılan yılı (bu yıl)
        // dropdown'a yansıtıyoruz.
        if (year === null) setYear(res.data.selected_year);
      })
      .finally(() => setIsLoading(false));
  }, [year]);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="İstatistikler" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {isLoading || !stats ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : stats.total_books_finished === 0 ? (
          <p className="text-center text-sm text-ink/40">
            Henüz &quot;Okundu&quot; olarak işaretlenmiş bir kitap yok.
          </p>
        ) : (
          <>
            {/* Genel Özet (tüm zamanlar — yıl seçiminden etkilenmez) */}
            <section className="rounded-sm border border-oak/10 bg-paper-elevated px-5 py-4">
              <p className="call-number mb-3 text-xs text-oak/60">Genel Özet (Tüm Zamanlar)</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-display text-2xl text-ink">{stats.total_books_finished}</p>
                  <p className="text-xs text-ink/50">kitap bitti</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-ink">{stats.total_pages_read.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-ink/50">sayfa okundu</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-brass">
                    {stats.average_rating ? stats.average_rating.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-ink/50">ortalama puan</p>
                </div>
              </div>
            </section>

            {/* Yıl seçici + Yıla Göre İstatistikler */}
            <section className="rounded-sm border border-oak/10 bg-paper-elevated px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="call-number text-xs text-oak/60">Yıla Göre</p>
                <select
                  value={year ?? stats.selected_year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="rounded-md border border-oak/20 bg-paper px-2 py-1 text-sm text-ink outline-none focus:border-brass"
                >
                  {stats.available_years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-display text-2xl text-ink">{stats.year_stats.books_finished}</p>
                  <p className="text-xs text-ink/50">kitap</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-ink">
                    {stats.year_stats.pages_read.toLocaleString('tr-TR')}
                  </p>
                  <p className="text-xs text-ink/50">sayfa</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-moss">{stats.year_stats.average_daily_pages}</p>
                  <p className="text-xs text-ink/50">sayfa/gün</p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-ink/40">
                {stats.year_stats.is_current_year
                  ? `Yılın başından bugüne (${stats.year_stats.days_elapsed} gün) günlük ortalama`
                  : `${stats.selected_year} yılının tamamı (${stats.year_stats.days_elapsed} gün) için günlük ortalama`}
              </p>
            </section>

            {/* Tempo (tüm zamanlar) */}
            {stats.pace.average_days_to_finish !== null && (
              <section className="rounded-sm border border-oak/10 bg-paper-elevated px-5 py-4">
                <p className="call-number mb-3 text-xs text-oak/60">Okuma Temposu (Tüm Zamanlar)</p>
                <p className="text-sm text-ink">
                  Ortalama bir kitabı{' '}
                  <span className="font-medium text-brass">{stats.pace.average_days_to_finish} günde</span>{' '}
                  bitiriyorsunuz.
                </p>
                <div className="mt-3 space-y-1 text-xs text-ink/60">
                  {stats.pace.fastest_book && (
                    <p>
                      ⚡ En hızlı: <span className="text-ink">{stats.pace.fastest_book.title}</span> (
                      {stats.pace.fastest_book.days} gün)
                    </p>
                  )}
                  {stats.pace.slowest_book && (
                    <p>
                      🐢 En uzun: <span className="text-ink">{stats.pace.slowest_book.title}</span> (
                      {stats.pace.slowest_book.days} gün)
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Aylık Dağılım (seçilen yıl) */}
            {stats.monthly_breakdown.length > 0 && (
              <section className="rounded-sm border border-oak/10 bg-paper-elevated px-5 py-4">
                <p className="call-number mb-3 text-xs text-oak/60">
                  Aylık Dağılım ({stats.selected_year})
                </p>
                <div className="space-y-2">
                  {(() => {
                    const max = Math.max(...stats.monthly_breakdown.map((m) => m.books_finished), 1);
                    return stats.monthly_breakdown.map((m, index) => (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="w-14 shrink-0 text-xs text-ink/60">{m.month}</span>
                        <div
                          className="relative h-4 flex-1 overflow-visible rounded-full bg-oak/5"
                          onMouseEnter={() => setHoveredMonth(index)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        >
                          <div
                            className="h-full cursor-default rounded-full bg-brass"
                            style={{ width: `${(m.books_finished / max) * 100}%` }}
                          />
                          {hoveredMonth === index && (
                            <div className="absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-md bg-ink px-2.5 py-1.5 text-xs text-paper shadow-lg">
                              <p className="font-medium">{m.pages_read.toLocaleString('tr-TR')} sayfa</p>
                              <p className="text-paper/70">
                                günde ~{m.average_daily_pages} sayfa ortalama
                              </p>
                              {/* küçük ok işareti */}
                              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink" />
                            </div>
                          )}
                        </div>
                        <span className="w-4 shrink-0 text-right text-xs text-ink/60">{m.books_finished}</span>
                      </div>
                    ));
                  })()}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
