import Link from 'next/link';
import { TopBar } from '@/components/top-bar';
import { BottomNav } from '@/components/bottom-nav';
import { DataExportButton } from '@/components/data-export-button';
import { MORE_CATEGORIES } from '@/lib/more-categories';

export default function MorePage() {
  return (
    <main className="min-h-screen bg-paper pb-24">
      <TopBar title="Kütüphanem" subtitle="Daha Fazla" />

      <div className="mx-auto max-w-md space-y-3 px-4 py-6">
        {MORE_CATEGORIES.map((cat) => (
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

        <DataExportButton />
      </div>

      <BottomNav />
    </main>
  );
}
