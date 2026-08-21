'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/** Her ana sayfanın üstünde: kısa başlık + tek bir çıkış ikonu. */
export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { logout } = useAuth();

  return (
    <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div>
          <p className="call-number text-xs text-oak/60">{title.toUpperCase()}</p>
          {subtitle && <h1 className="font-display text-2xl font-medium text-ink">{subtitle}</h1>}
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
    </header>
  );
}
