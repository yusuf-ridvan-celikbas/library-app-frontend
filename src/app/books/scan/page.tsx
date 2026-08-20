'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { api, ApiError } from '@/lib/api-client';
import type { ApiItemResponse, Book } from '@/types/api';
import { Button } from '@/components/ui/button';

type ScanState = 'scanning' | 'looking-up' | 'error';

export default function ScanBookPage() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>('scanning');
  const [error, setError] = useState<{ message: string; existingBookId?: string } | null>(null);
  // Kamera her karede aynı barkodu defalarca okuyabilir; aynı ISBN için
  // API'ye tekrar tekrar istek atmayı önlemek için son işlenen kodu tutuyoruz.
  const lastCodeRef = useRef<string | null>(null);

  const handleDetected = useCallback(
    async (isbn: string) => {
      if (lastCodeRef.current === isbn || state === 'looking-up') return;
      lastCodeRef.current = isbn;
      setState('looking-up');
      setError(null);

      try {
        const res = await api.post<ApiItemResponse<Book>>('/books/scan-isbn', { isbn });
        router.push(`/books/${res.data.id}`);
      } catch (err) {
        if (err instanceof ApiError) {
          setError({
            message: err.message,
            existingBookId:
              err.errorCode === 'BOOK_ALREADY_EXISTS' ? (err.context?.book_id as string) : undefined,
          });
        } else {
          setError({ message: 'Beklenmeyen bir hata oluştu.' });
        }
        setState('error');
      }
    },
    [router, state],
  );

  function retry() {
    lastCodeRef.current = null;
    setError(null);
    setState('scanning');
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <p className="call-number text-xs text-oak/60">BARKOD TARA</p>
          <Link href="/books" className="text-sm text-ink/60 underline underline-offset-2">
            Vazgeç
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        {state !== 'error' && <BarcodeScanner onDetected={handleDetected} onError={(m) => setError({ message: m })} />}

        {state === 'looking-up' && (
          <p className="mt-4 text-center text-sm text-ink/60">Kitap bilgisi aranıyor…</p>
        )}

        {error && (
          <div className="mt-4 rounded-sm border border-spine/30 bg-spine/5 px-4 py-3">
            <p className="text-sm text-spine">{error.message}</p>
            <div className="mt-3 flex gap-2">
              {error.existingBookId && (
                <Link
                  href={`/books/${error.existingBookId}`}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-oak/30 px-3 text-sm font-medium text-ink transition-colors hover:bg-oak/5"
                >
                  Kayıtlı kitabı gör
                </Link>
              )}
              <Button size="sm" onClick={retry} className="bg-oak hover:bg-oak/90">
                Tekrar dene
              </Button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink/40">
          Kamera açılmıyorsa, uygulamaya localhost veya HTTPS üzerinden eriştiğinizden emin olun.
        </p>
      </div>
    </main>
  );
}
