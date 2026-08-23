'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';

interface ReminderItem {
  type: 'loan' | 'borrowed';
  record_id: string;
  title: string;
  person_name: string;
  due_at: string;
  days_diff: number;
  is_overdue: boolean;
}

interface RemindersResponse {
  items: ReminderItem[];
  overdue_count: number;
  upcoming_count: number;
}

export default function RemindersPage() {
  const [data, setData] = useState<RemindersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<RemindersResponse>('/reminders')
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Hatırlatıcılar" />

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {isLoading || !data ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : data.items.length === 0 ? (
          <p className="text-center text-sm text-ink/40">
            Gecikmiş ya da yaklaşan son tarihli bir kaydınız yok. 👍
          </p>
        ) : (
          <>
            <p className="text-sm text-ink/50">
              <span className="text-spine">{data.overdue_count} gecikmiş</span> ·{' '}
              <span className="text-brass">{data.upcoming_count} yaklaşan</span>
            </p>

            <ul className="space-y-2">
              {data.items.map((item) => (
                <li
                  key={`${item.type}-${item.record_id}`}
                  className={`rounded-sm border px-4 py-3 ${
                    item.is_overdue ? 'border-spine/30 bg-spine/5' : 'border-oak/10 bg-paper-elevated'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{item.title}</p>
                      <p className="text-sm text-ink/60">
                        {item.type === 'loan' ? 'Kimde: ' : 'Kimden: '}
                        {item.person_name}
                      </p>
                      <p className="text-xs text-ink/40">Son tarih: {item.due_at}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                        item.is_overdue ? 'bg-spine/15 text-spine' : 'bg-brass/20 text-brass'
                      }`}
                    >
                      {item.is_overdue ? `${Math.abs(item.days_diff)} gün gecikti` : `${item.days_diff} gün kaldı`}
                    </span>
                  </div>
                  <Link
                    href={item.type === 'loan' ? '/loans' : '/borrowed-books'}
                    className="mt-1 inline-block text-xs text-brass underline underline-offset-2"
                  >
                    {item.type === 'loan' ? 'Emanetler sayfasına git' : 'Ödünç Aldıklarım sayfasına git'}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
