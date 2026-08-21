'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCrudList } from '@/lib/use-crud-list';
import type { Borrower } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManageBorrowersPage() {
  const { items, isLoading, error, create, update, remove } = useCrudList<Borrower>('/borrowers', true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <p className="call-number text-xs text-oak/60">KİŞİLER</p>
          <Link href="/manage" className="text-sm text-ink/60 underline underline-offset-2">
            ← Geri
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        <Button onClick={() => setIsAdding((v) => !v)} className="mb-4 w-full bg-oak hover:bg-oak/90">
          {isAdding ? 'Vazgeç' : '+ Yeni Kişi'}
        </Button>

        {isAdding && (
          <BorrowerForm
            onCancel={() => setIsAdding(false)}
            onSubmit={async (data) => {
              await create(data);
              setIsAdding(false);
            }}
          />
        )}

        {error && <p className="mb-4 text-sm text-spine">{error}</p>}

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Henüz kişi eklenmemiş.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((borrower) =>
              editingId === borrower.id ? (
                <li key={borrower.id} className="rounded-sm border border-oak/10 bg-paper-elevated p-4">
                  <BorrowerForm
                    initial={borrower}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (data) => {
                      await update(borrower.id, data);
                      setEditingId(null);
                    }}
                  />
                </li>
              ) : (
                <li
                  key={borrower.id}
                  className="flex items-center justify-between rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3"
                >
                  <div>
                    <p className="text-ink">{borrower.name}</p>
                    {borrower.phone && <p className="text-xs text-ink/40">{borrower.phone}</p>}
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => setEditingId(borrower.id)}
                      className="text-brass underline underline-offset-2"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`"${borrower.name}" silinsin mi?`)) remove(borrower.id);
                      }}
                      className="text-spine underline underline-offset-2"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </main>
  );
}

function BorrowerForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Borrower;
  onSubmit: (data: { name: string; phone: string | null; email: string | null; notes: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), phone: phone || null, email: email || null, notes: null });
    } catch {
      setError('Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-sm border border-oak/15 bg-paper-elevated p-4">
      <div className="space-y-1">
        <Label>İsim</Label>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Telefon (opsiyonel)</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>E-posta (opsiyonel)</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="text-xs text-spine">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSaving} className="bg-oak hover:bg-oak/90">
          Kaydet
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
