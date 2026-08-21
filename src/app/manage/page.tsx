import Link from 'next/link';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';

const CATEGORIES = [
  { href: '/manage/authors', label: 'Yazarlar', desc: 'Yazar bilgilerini düzenle, sil' },
  { href: '/manage/publishers', label: 'Yayınevleri', desc: 'Yayınevi bilgilerini düzenle, sil' },
  { href: '/manage/locations', label: 'Konumlar', desc: 'Oda/raf tanımlarını düzenle, sil' },
  { href: '/manage/tags', label: 'Etiketler', desc: 'Etiket adı ve rengini düzenle, sil' },
  { href: '/manage/borrowers', label: 'Kişiler', desc: 'Emanet verilen kişileri düzenle, sil' },
];

export default function ManageHubPage() {
  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Yönet" />

      <div className="mx-auto max-w-md space-y-3 px-4 py-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="flex items-center justify-between rounded-sm border border-oak/10 bg-paper-elevated px-4 py-4 transition-colors hover:bg-oak/5"
          >
            <div>
              <p className="font-display text-lg text-ink">{cat.label}</p>
              <p className="text-sm text-ink/50">{cat.desc}</p>
            </div>
            <span className="text-brass">→</span>
          </Link>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
