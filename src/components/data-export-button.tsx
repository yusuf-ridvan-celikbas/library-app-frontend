'use client';

import { useState } from 'react';
import { tokenStorage, ApiError } from '@/lib/api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * /data-export endpoint'i kimlik doğrulaması gerektirdiği için
 * doğrudan bir <a href> ile indirilemez (tarayıcı Authorization
 * header'ı eklemez) — bu yüzden authenticated bir fetch yapıp,
 * gelen JSON'u bir Blob'a çevirip tarayıcıya "indir" olarak
 * sunuyoruz.
 */
export function DataExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    try {
      const token = tokenStorage.get();
      const res = await fetch(`${API_URL}/data-export`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new ApiError('Dışa aktarım başarısız oldu.', res.status);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kutuphanem-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dışa aktarım başarısız oldu.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="rounded-sm border border-oak/10 bg-paper-elevated px-4 py-4">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="font-display text-lg text-ink">Veri Yedeği İndir</p>
          <p className="text-sm text-ink/50">
            {isExporting ? 'Hazırlanıyor…' : 'Tüm kütüphanenizi JSON dosyası olarak indirin'}
          </p>
        </div>
        <span className="text-brass">↓</span>
      </button>
      {error && <p className="mt-2 text-xs text-spine">{error}</p>}
    </div>
  );
}
