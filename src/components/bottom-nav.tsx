'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Target, History, Users, Settings } from 'lucide-react';

const TABS = [
  { href: '/books', label: 'Rafım', icon: BookOpen },
  { href: '/goals', label: 'Hedefler', icon: Target },
  { href: '/reading', label: 'Okuma', icon: History },
  { href: '/loans', label: 'Emanet', icon: Users },
  { href: '/manage', label: 'Yönet', icon: Settings },
];

/**
 * Kalıcı alt navigasyon çubuğu — önceden her sayfanın kendi başlığında
 * dağınık şekilde tekrarlanan linkler (Kitap ekle, Hedeflerim, Okuma
 * Geçmişim, Emanetler, Yönet, Çıkış yap) yerine, mobil uygulama
 * deneyimine daha yakın, her zaman erişilebilir tek bir menü.
 *
 * Alt sayfalar (kitap detay, /manage/authors gibi) bu çubuğu KASITLI
 * OLARAK göstermez — onlar zaten kendi "← Geri" linkleriyle bir üst
 * seviyeye dönüyor, bottom nav'ı her derinlikte tekrar göstermek görsel
 * gürültü yaratırdı.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-oak/10 bg-paper-elevated pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => {
          // /books/[id] gibi alt rotalarda da 'Rafım' sekmesi aktif görünsün.
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
