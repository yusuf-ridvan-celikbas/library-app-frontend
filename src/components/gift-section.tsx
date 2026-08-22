'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { SearchableSingleSelect } from '@/components/searchable-select';
import type { ApiItemResponse, Book, Borrower, PaginatedResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Loan'dan farkı: kalıcı ve tek seferliktir — "iade alma" değil "geri
 * alma/undo" var (yanlışlıkla işaretlendiyse). book.gift zaten kitabın
 * kendi verisiyle geliyor (ayrı bir liste sorgusu gerekmiyor, Loan'ın
 * aksine — çünkü hediye 1:1 bir ilişki, geçmişi çoğullanmıyor).
 */
export function GiftSection({ book, onChanged }: { book: Book; onChanged: (updated: Book) => void }) {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [borrowerId, setBorrowerId] = useState('');
  const [giftedAt, setGiftedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isFormOpen && borrowers.length === 0) {
      api.get<PaginatedResponse<Borrower>>('/borrowers?per_page=100').then((res) => setBorrowers(res.data));
    }
  }, [isFormOpen, borrowers.length]);

  async function handleCreateGift() {
    if (!borrowerId) {
      setError('Bir kişi seçin.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await api.post<ApiItemResponse<Book>>(`/books/${book.id}/gift`, {
        borrower_id: borrowerId,
        gifted_at: giftedAt || undefined,
        notes: notes || null,
      });
      onChanged(res.data);
      setIsFormOpen(false);
      setBorrowerId('');
      setGiftedAt('');
      setNotes('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Hediye kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUndo() {
    if (!window.confirm('Hediye kaydı geri alınsın mı? Kitap tekrar "Müsait" olarak işaretlenecek.')) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await api.delete<ApiItemResponse<Book>>(`/books/${book.id}/gift`);
      onChanged(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Geri alınamadı.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <fieldset className="space-y-3 rounded-sm border border-oak/10 bg-paper-elevated px-6 py-5">
      <legend className="call-number px-1 text-xs text-oak/60">Hediye</legend>

      {book.gift ? (
        <div className="space-y-2">
          <p className="text-sm text-ink">
            <span className="font-medium">{book.gift.borrower.name}</span> kişisine hediye edildi.
          </p>
          <p className="text-xs text-ink/50">
            Tarih: {book.gift.gifted_at}
            {book.gift.notes && ` · ${book.gift.notes}`}
          </p>
          <Button size="sm" variant="outline" onClick={handleUndo} disabled={isSaving}>
            {isSaving ? 'İşleniyor…' : 'Geri Al'}
          </Button>
        </div>
      ) : isFormOpen ? (
        <div className="space-y-3">
          <SearchableSingleSelect
            label="Kime hediye edilecek"
            items={borrowers}
            selectedId={borrowerId}
            onChange={setBorrowerId}
            createEndpoint="/borrowers"
            onCreated={(item) => setBorrowers((prev) => [...prev, item])}
          />
          <div className="space-y-1">
            <Label>Tarih (opsiyonel)</Label>
            <Input type="date" value={giftedAt} onChange={(e) => setGiftedAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Not (opsiyonel)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-xs text-spine">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateGift} disabled={isSaving} className="bg-oak hover:bg-oak/90">
              Hediye Et
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsFormOpen(false)}>
              Vazgeç
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" onClick={() => setIsFormOpen(true)} variant="outline" disabled={book.status === 'loaned'}>
          {book.status === 'loaned' ? 'Önce iade alınmalı' : 'Hediye Et'}
        </Button>
      )}
    </fieldset>
  );
}
