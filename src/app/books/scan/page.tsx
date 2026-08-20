'use client';

import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { api, ApiError } from '@/lib/api-client';
import type { ApiItemResponse, Book } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ScanState = 'scanning' | 'looking-up' | 'error';
type Mode = 'camera' | 'manual';

export default function ScanBookPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('camera');
  const [state, setState] = useState<ScanState>('scanning');
  const [error, setError] = useState<{ message: string; existingBookId?: string } | null>(null);
  const [manualIsbn, setManualIsbn] = useState('');
  // Kamera her karede aynı barkodu defalarca okuyabilir; aynı ISBN için
  // API'ye tekrar tekrar istek atmayı önlemek için son işlenen kodu tutuyoruz.
  const lastCodeRef = useRef<string | null>(null);

  const lookupIsbn = useCallback(
    async (isbn: string) => {
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
    [router],
  );

  const handleDetected = useCallback(
    (isbn: string) => {
      if (lastCodeRef.current === isbn || state === 'looking-up') return;
      lastCodeRef.current = isbn;
      lookupIsbn(isbn);
    },
    [state, lookupIsbn],
  );

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = manualIsbn.replace(/[^0-9Xx]/g, ''); // tire/boşluk temizle
    if (cleaned.length < 10) {
      setError({ message: 'Geçerli bir ISBN girin (10 veya 13 haneli).' });
      setState('error');
      return;
    }
    lookupIsbn(cleaned);
  }

  function retry() {
    lastCodeRef.current = null;
    setError(null);
    setState('scanning');
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <p className="call-number text-xs text-oak/60">KİTAP EKLE</p>
          <Link href="/books" className="text-sm text-ink/60 underline underline-offset-2">
            Vazgeç
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        {/* Mod seçici: Kamera / Elle Gir */}
        <div className="mb-4 flex overflow-hidden rounded-md border border-oak/20">
          <button
            type="button"
            onClick={() => {
              setMode('camera');
              retry();
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'camera' ? 'bg-oak text-paper' : 'bg-paper-elevated text-ink/60'
            }`}
          >
            Kamera ile Tara
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('manual');
              retry();
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'manual' ? 'bg-oak text-paper' : 'bg-paper-elevated text-ink/60'
            }`}
          >
            Elle Gir
          </button>
        </div>

        {mode === 'camera' && state !== 'error' && (
          <BarcodeScanner onDetected={handleDetected} onError={(m) => setError({ message: m })} />
        )}

        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <p className="text-sm text-ink/60">
              Kitabın arka kapağındaki barkodun altında yazan 10 veya 13 haneli ISBN numarasını girin.
            </p>
            <Input
              inputMode="numeric"
              placeholder="978625..."
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              className="bg-paper-elevated font-mono"
            />
            <Button type="submit" disabled={state === 'looking-up'} className="w-full bg-oak hover:bg-oak/90">
              {state === 'looking-up' ? 'Aranıyor…' : 'Kitabı Bul'}
            </Button>
          </form>
        )}

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

        {mode === 'camera' && (
          <p className="mt-6 text-center text-xs text-ink/40">
            Kamera açılmıyorsa veya barkod okunmuyorsa &quot;Elle Gir&quot; sekmesini kullanabilirsiniz.
          </p>
        )}
      </div>
    </main>
  );
}
