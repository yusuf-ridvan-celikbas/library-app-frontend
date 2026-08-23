'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

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

const PREVIEW_LIMIT = 5;

/** Her ana sayfanın üstünde: kısa başlık + hatırlatıcı rozeti + çıkış ikonu. */
export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { logout } = useAuth();
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    api
      .get<RemindersResponse>('/reminders')
      .then((res) => {
        setItems(res.items);
        setOverdueCount(res.overdue_count);
      })
      .catch(() => {});
  }, []);

  const totalCount = items.length;
  const hasOverdue = overdueCount > 0;

  return (
    <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div>
          <p className="call-number text-xs text-oak/60">{title.toUpperCase()}</p>
          {subtitle && <h1 className="font-display text-2xl font-medium text-ink">{subtitle}</h1>}
        </div>
        <div className="flex items-center gap-1">
          {/* relative + onMouseEnter/Leave: masaüstünde fare ile gelince
              önizleme paneli açılır (Popover/portal gerekmeden basit bir
              absolute-positioned panel). Dokunmatik cihazlarda hover
              tetiklenmez — orada Link'in normal tıklama davranışı
              (/reminders'a gitmek) zaten çalışır, bu yüzden mobilde bir
              şey kaybedilmiyor. */}
          <div
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Link
              href="/reminders"
              aria-label="Hatırlatıcılar"
              className="relative block rounded-md p-2 text-ink/50 transition-colors hover:bg-oak/5 hover:text-brass"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} />
              {totalCount > 0 && (
                <span
                  className={`absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-paper ${
                    hasOverdue ? 'bg-spine' : 'bg-brass'
                  }`}
                >
                  {totalCount}
                </span>
              )}
            </Link>

            {isHovering && totalCount > 0 && (
              <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border border-oak/10 bg-paper-elevated shadow-lg">
                <ul className="max-h-72 overflow-y-auto py-1">
                  {items.slice(0, PREVIEW_LIMIT).map((item) => (
                    <li key={`${item.type}-${item.record_id}`} className="px-3 py-2 text-sm">
                      <p className="truncate text-ink">{item.title}</p>
                      <p className="text-xs text-ink/50">
                        {item.type === 'loan' ? 'Kimde: ' : 'Kimden: '}
                        {item.person_name} ·{' '}
                        <span className={item.is_overdue ? 'text-spine' : 'text-brass'}>
                          {item.is_overdue ? `${Math.abs(item.days_diff)} gün gecikti` : `${item.days_diff} gün kaldı`}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
                {totalCount > PREVIEW_LIMIT && (
                  <p className="border-t border-oak/10 px-3 py-1.5 text-xs text-ink/40">
                    +{totalCount - PREVIEW_LIMIT} kayıt daha
                  </p>
                )}
                <Link
                  href="/reminders"
                  className="block border-t border-oak/10 px-3 py-2 text-center text-xs font-medium text-brass hover:bg-oak/5"
                >
                  Tümünü Gör →
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => logout()}
            aria-label="Çıkış yap"
            className="rounded-md p-2 text-ink/50 transition-colors hover:bg-oak/5 hover:text-spine"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
