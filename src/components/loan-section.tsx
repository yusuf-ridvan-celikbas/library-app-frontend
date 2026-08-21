'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { SearchableSingleSelect } from '@/components/searchable-select';
import type { Borrower, Loan, PaginatedResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Bir kitabın o anki emanet durumunu gösterir: müsaitse "Ödünç Ver"
 * formu, ödünçteyse kime/ne zamana kadar verildiği + "İade Al" butonu.
 * Book.status bu bileşenin dışında (BookController) senkronize
 * tutuluyor — bu bileşen sadece Loan kaydını yönetir, kitabın kendi
 * status alanını backend zaten otomatik günceller.
 */
export function LoanSection({ bookId, onBookStatusChanged }: { bookId: string; onBookStatusChanged?: () => void }) {
  const [activeLoan, setActiveLoan] = useState<Loan | null | undefined>(undefined); // undefined = yükleniyor
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [borrowerId, setBorrowerId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadActiveLoan() {
    api
      .get<PaginatedResponse<Loan>>(`/loans?book_id=${bookId}&status=active&per_page=1`)
      .then((res) => setActiveLoan(res.data[0] ?? null))
      .catch(() => setActiveLoan(null));
  }

  useEffect(() => {
    loadActiveLoan();
    api
      .get<PaginatedResponse<Borrower>>('/borrowers?per_page=100')
      .then((res) => setBorrowers(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  async function handleCreateLoan() {
    if (!borrowerId) {
      setError('Bir kişi seçin.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await api.post('/loans', {
        book_id: bookId,
        borrower_id: borrowerId,
        due_at: dueAt || null,
        notes: notes || null,
      });
      setIsFormOpen(false);
      setBorrowerId('');
      setDueAt('');
      setNotes('');
      loadActiveLoan();
      onBookStatusChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ödünç verilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReturn() {
    if (!activeLoan) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.patch(`/loans/${activeLoan.id}/return`);
      loadActiveLoan();
      onBookStatusChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İade alınamadı.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <fieldset className="space-y-3 rounded-sm border border-oak/10 bg-paper-elevated px-6 py-5">
      <legend className="call-number px-1 text-xs text-oak/60">Emanet</legend>

      {activeLoan === undefined ? (
        <p className="text-sm text-ink/40">Yükleniyor…</p>
      ) : activeLoan ? (
        <div className="space-y-2">
          <p className="text-sm text-ink">
            <span className="font-medium">{activeLoan.borrower?.name ?? 'Silinmiş kişi'}</span> kişisine ödünç verildi.
          </p>
          <p className="text-xs text-ink/50">
            Verilme: {activeLoan.loaned_at}
            {activeLoan.due_at && ` · Son tarih: ${activeLoan.due_at}`}
            {activeLoan.is_overdue && <span className="ml-2 text-spine">(Gecikmiş)</span>}
          </p>
          <Button size="sm" onClick={handleReturn} disabled={isSaving} className="bg-oak hover:bg-oak/90">
            {isSaving ? 'İşleniyor…' : 'İade Al'}
          </Button>
        </div>
      ) : isFormOpen ? (
        <div className="space-y-3">
          <SearchableSingleSelect
            label="Kime verilecek"
            items={borrowers}
            selectedId={borrowerId}
            onChange={setBorrowerId}
            createEndpoint="/borrowers"
            onCreated={(item) => setBorrowers((prev) => [...prev, item as Borrower])}
          />
          <div className="space-y-1">
            <Label>Son iade tarihi (opsiyonel)</Label>
            <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Not (opsiyonel)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-xs text-spine">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateLoan} disabled={isSaving} className="bg-oak hover:bg-oak/90">
              Ödünç Ver
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsFormOpen(false)}>
              Vazgeç
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" onClick={() => setIsFormOpen(true)} className="bg-oak hover:bg-oak/90">
          Ödünç Ver
        </Button>
      )}
    </fieldset>
  );
}
