import Link from 'next/link';

const CATEGORIES = [
  { href: '/manage/authors', label: 'Yazarlar', desc: 'Yazar bilgilerini düzenle, sil' },
  { href: '/manage/publishers', label: 'Yayınevleri', desc: 'Yayınevi bilgilerini düzenle, sil' },
  { href: '/manage/locations', label: 'Konumlar', desc: 'Oda/raf tanımlarını düzenle, sil' },
  { href: '/manage/tags', label: 'Etiketler', desc: 'Etiket adı ve rengini düzenle, sil' },
];

export default function ManageHubPage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <p className="call-number text-xs text-oak/60">RAF YÖNETİMİ</p>
          <Link href="/books" className="text-sm text-ink/60 underline underline-offset-2">
            ← Rafa dön
          </Link>
        </div>
      </header>

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
    </main>
  );
}
