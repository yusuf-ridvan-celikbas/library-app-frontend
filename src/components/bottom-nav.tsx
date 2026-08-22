'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Target, History, Users, Menu } from 'lucide-react';

const TABS = [
  { href: '/books', label: 'Rafım', icon: BookOpen, matchPrefixes: ['/books'] },
  { href: '/goals', label: 'Hedefler', icon: Target, matchPrefixes: ['/goals'] },
  { href: '/reading', label: 'Okuma', icon: History, matchPrefixes: ['/reading'] },
  { href: '/loans', label: 'Emanet', icon: Users, matchPrefixes: ['/loans'] },
  // 'Daha Fazla' altındaki hub sayfalarında da (Yönet, Hediyeler) bu
  // sekmenin aktif görünmesi için ek yol önekleri.
  { href: '/more', label: 'Daha Fazla', icon: Menu, matchPrefixes: ['/more', '/manage', '/gifts'] },
];

/**
 * Kalıcı alt navigasyon çubuğu. 'Yönet' artık kendi sekmesi değil —
 * 'Daha Fazla' (/more) hub'ının içine taşındı (Hediyeler ve
 * İstatistikler ile birlikte). Mobil bottom nav'da 5'ten fazla sekme
 * kalabalık ve dokunması zor hale geldiği için, yeni eklenen sayfalar
 * (Hediyeler, İstatistikler) doğrudan sekme olarak eklenmek yerine bu
 * hub altında toplandı — bu desen, gelecekte yeni sayfalar eklenirken
 * de bottom nav'ı 5 sekmede sabit tutmamızı sağlar.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-oak/10 bg-paper-elevated pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => {
          const isActive = tab.matchPrefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
          );
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                isActive ? 'text-oak' : 'text-ink/40'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
