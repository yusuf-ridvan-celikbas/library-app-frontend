'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Target, History, Users, Menu } from 'lucide-react';
import { MORE_CATEGORIES } from '@/lib/more-categories';

const TABS = [
  { href: '/books', label: 'Rafım', icon: BookOpen, matchPrefixes: ['/books'] },
  { href: '/goals', label: 'Hedefler', icon: Target, matchPrefixes: ['/goals'] },
  { href: '/reading', label: 'Okuma', icon: History, matchPrefixes: ['/reading'] },
  { href: '/loans', label: 'Emanet', icon: Users, matchPrefixes: ['/loans'] },
  // 'Daha Fazla' altındaki hub sayfalarında da (Yönet, Hediyeler) bu
  // sekmenin aktif görünmesi için ek yol önekleri.
  { href: '/more', label: 'Daha Fazla', icon: Menu, matchPrefixes: ['/more', '/manage', '/gifts', '/borrowed-books', '/library-overview', '/reminders'] },
];

/**
 * Kalıcı alt navigasyon çubuğu. 'Yönet' artık kendi sekmesi değil —
 * 'Daha Fazla' (/more) hub'ının içine taşındı (Hediyeler ve
 * İstatistikler ile birlikte). Mobil bottom nav'da 5'ten fazla sekme
 * kalabalık ve dokunması zor hale geldiği için, yeni eklenen sayfalar
 * (Hediyeler, İstatistikler) doğrudan sekme olarak eklenmek yerine bu
 * hub altında toplandı — bu desen, gelecekte yeni sayfalar eklenirken
 * de bottom nav'ı 5 sekmede sabit tutmamızı sağlar.
 *
 * 'Daha Fazla' sekmesi masaüstünde fare ile üzerine gelince, alt
 * kategorileri doğrudan listeleyen bir panel açar (TopBar'daki
 * hatırlatıcı önizlemesiyle aynı desen) — panel YUKARI doğru açılır
 * çünkü bottom nav ekranın en altında. Dokunmatik cihazlarda hover
 * tetiklenmez, orada normal tıklama (/more'a gitmek) çalışmaya devam
 * eder.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [isHoveringMore, setIsHoveringMore] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-oak/10 bg-paper-elevated pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => {
          const isActive = tab.matchPrefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
          );
          const Icon = tab.icon;
          const isMoreTab = tab.href === '/more';

          const linkContent = (
            <Link
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                isActive ? 'text-oak' : 'text-ink/40'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
              {tab.label}
            </Link>
          );

          if (!isMoreTab) {
            return <div key={tab.href} className="flex flex-1">{linkContent}</div>;
          }

          return (
            <div
              key={tab.href}
              className="relative flex flex-1"
              onMouseEnter={() => setIsHoveringMore(true)}
              onMouseLeave={() => setIsHoveringMore(false)}
            >
              {linkContent}

              {isHoveringMore && (
                <div
                  className="absolute bottom-full right-0 z-50 w-64 rounded-md border border-oak/10 bg-paper-elevated shadow-lg before:absolute before:inset-x-0 before:top-full before:h-2 before:content-['']"
                  onMouseEnter={() => setIsHoveringMore(true)}
                  onMouseLeave={() => setIsHoveringMore(false)}
                >
                  <ul className="py-1">
                    {MORE_CATEGORIES.map((cat) => (
                      <li key={cat.href}>
                        <Link
                          href={cat.href}
                          className="block px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-oak/5"
                        >
                          <p>{cat.label}</p>
                          <p className="text-xs text-ink/40">{cat.desc}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
