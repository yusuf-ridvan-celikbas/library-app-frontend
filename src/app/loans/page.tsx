'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { SearchableSingleSelect } from '@/components/searchable-select';
import type { ApiItemResponse, Book, Borrower, Loan, LoanStatus, PaginatedResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FilterStatus = LoanStatus | 'all';

const STATUS_LABELS: Record<LoanStatus, string> = {
  active: 'Aktif',
  returned: 'İade Edildi',
  overdue: 'Gecikmiş',
  lost: 'Kayıp',
};

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    // URLSearchParams kullanmak, filter='all' iken (query boş string
    // olduğunda) '/loans&per_page=50' gibi başında '?' olmayan bozuk bir
    // URL oluşma riskini tamamen ortadan kaldırır.
    const params = new URLSearchParams({ per_page: '50' });
    if (filter !== 'all') params.set('status', filter);

    api
      .get<PaginatedResponse<Loan>>(`/loans?${params.toString()}`)
      .then((res) => setLoans(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [filter]);

  async function handleReturn(loanId: string) {
    setSavingId(loanId);
    try {
      await api.patch(`/loans/${loanId}/return`);
      load();
    } catch {
      // sessizce yut, kullanıcı listeyi görüp tekrar deneyebilir
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <p className="call-number text-xs text-oak/60">EMANETLER</p>
          <Link href="/books" className="text-sm text-ink/60 underline underline-offset-2">
            ← Rafa dön
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex overflow-hidden rounded-md border border-oak/20">
            {(['active', 'returned', 'all'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f ? 'bg-oak text-paper' : 'bg-paper-elevated text-ink/60'
                }`}
              >
                {f === 'active' ? 'Aktif' : f === 'returned' ? 'İade Edilmiş' : 'Tümü'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setIsAdding((v) => !v)} className="bg-oak hover:bg-oak/90">
            {isAdding ? 'Vazgeç' : '+ Yeni Emanet'}
          </Button>
        </div>

        {isAdding && <NewLoanForm onCreated={() => { setIsAdding(false); load(); }} />}

        {isLoading ? (
          <p className="text-center text-sm text-ink/40">Yükleniyor…</p>
        ) : loans.length === 0 ? (
          <p className="text-center text-sm text-ink/40">Kayıt yok.</p>
        ) : (
          <ul className="space-y-2">
            {loans.map((loan) => (
              <li
                key={loan.id}
                className="flex items-center justify-between rounded-sm border border-oak/10 bg-paper-elevated px-4 py-3"
              >
                <div>
                  <Link href={`/books/${loan.book.id}`} className="font-medium text-ink underline underline-offset-2">
                    {loan.book.title}
                  </Link>
                  <p className="text-sm text-ink/60">{loan.borrower?.name ?? 'Silinmiş kişi'}</p>
                  <p className="text-xs text-ink/40">
                    {loan.loaned_at}
                    {loan.due_at && ` · Son: ${loan.due_at}`}
                    {loan.is_overdue && <span className="ml-1 text-spine">(Gecikmiş)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink/50">{STATUS_LABELS[loan.status]}</span>
                  {loan.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingId === loan.id}
                      onClick={() => handleReturn(loan.id)}
                    >
                      İade Al
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function NewLoanForm({ onCreated }: { onCreated: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [bookId, setBookId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<PaginatedResponse<Book>>('/books?per_page=100').then((res) => setBooks(res.data));
    api.get<PaginatedResponse<Borrower>>('/borrowers?per_page=100').then((res) => setBorrowers(res.data));
  }, []);

  // SearchableSingleSelect 'name' alanı bekler; Book'un başlık alanı
  // 'title' olduğu için burada sadece seçici için hafif bir eşleme
  // yapılır (kitap OLUŞTURMA burada kasıtlı olarak kapalı — createEndpoint
  // verilmiyor — bu form sadece VAR OLAN bir kitabı ödünç vermek için).
  const bookOptions = books.map((b) => ({ id: b.id, name: b.title }));

  async function handleSubmit() {
    if (!bookId || !borrowerId) {
      setError('Kitap ve kişi seçilmelidir.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await api.post('/loans', { book_id: bookId, borrower_id: borrowerId, due_at: dueAt || null });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mb-4 space-y-3 rounded-sm border border-oak/15 bg-paper-elevated p-4">
      <SearchableSingleSelect label="Kitap" items={bookOptions} selectedId={bookId} onChange={setBookId} />
      <SearchableSingleSelect
        label="Kime verilecek"
        items={borrowers}
        selectedId={borrowerId}
        onChange={setBorrowerId}
        createEndpoint="/borrowers"
        onCreated={(item) => setBorrowers((prev) => [...prev, item])}
      />
      <div className="space-y-1">
        <Label>Son iade tarihi (opsiyonel)</Label>
        <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
      </div>
      {error && <p className="text-xs text-spine">{error}</p>}
      <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="bg-oak hover:bg-oak/90">
        {isSaving ? 'Kaydediliyor…' : 'Ödünç Ver'}
      </Button>
    </div>
  );
}
