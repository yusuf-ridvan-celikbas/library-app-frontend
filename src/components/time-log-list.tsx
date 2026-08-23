'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface TimeLog {
  id: string;
  log_date: string;
  duration_minutes: number;
  pages_read: number | null;
  notes: string | null;
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} dk`;
  if (minutes === 0) return `${hours} sa`;
  return `${hours} sa ${minutes} dk`;
}

/**
 * Faz 4: kullanıcının kendi ölçtüğü (harici bir kronometreyle) okuma
 * oturumlarının günlüğü. Canlı bir kronometre DEĞİL — sadece "bu
 * oturumda X dakika okudum" şeklinde geriye dönük kayıt girişi.
 *
 * Hem ReadingSession (kendi kitaplığınız) hem BorrowedBook (ödünç
 * aldıklarınız) için ortak kullanılabilsin diye `endpoint` prop'u
 * üzerinden hangi kaynağa POST edileceği dışarıdan belirleniyor.
 */
export function TimeLogList({
  endpoint,
  logs,
  totalMinutes,
  onChanged,
}: {
  endpoint: string; // örn. /reading-sessions/{id}/time-logs veya /borrowed-books/{id}/time-logs
  logs: TimeLog[];
  totalMinutes: number;
  onChanged: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  async function handleDelete(logId: string) {
    if (!window.confirm('Bu oturum kaydı silinsin mi?')) return;
    try {
      await api.delete(`/time-logs/${logId}`);
      onChanged();
    } catch {
      // sessizce yut
    }
  }

  return (
    <div className="mt-2 border-t border-oak/10 pt-2">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="text-xs text-brass underline underline-offset-2"
      >
        {isOpen
          ? 'Oturumları gizle'
          : totalMinutes > 0
            ? `Oturumlar (${logs.length}) · toplam ${formatMinutes(totalMinutes)}`
            : `+ Oturum kaydı ekle`}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {logs.length > 0 && (
            <ul className="space-y-1">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center justify-between text-xs text-ink/60">
                  <span>
                    {log.log_date} · {formatMinutes(log.duration_minutes)}
                    {log.pages_read && ` · ${log.pages_read} sayfa`}
                    {log.notes && ` · ${log.notes}`}
                  </span>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="ml-2 shrink-0 text-spine underline underline-offset-2"
                  >
                    Sil
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isAdding ? (
            <TimeLogForm
              endpoint={endpoint}
              onDone={() => {
                setIsAdding(false);
                onChanged();
              }}
              onCancel={() => setIsAdding(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="text-xs text-brass underline underline-offset-2"
            >
              + Yeni oturum
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TimeLogForm({
  endpoint,
  onDone,
  onCancel,
}: {
  endpoint: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [pagesRead, setPagesRead] = useState('');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    if (totalMinutes <= 0) {
      setError('Süre 0 dakikadan büyük olmalı.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await api.post(endpoint, {
        duration_minutes: totalMinutes,
        pages_read: pagesRead ? Number(pagesRead) : null,
        log_date: logDate,
        notes: notes || null,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-oak/15 bg-paper p-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Saat</Label>
          <Input
            type="number"
            min="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="h-8 bg-paper-elevated text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dakika</Label>
          <Input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="h-8 bg-paper-elevated text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sayfa (opsiyonel)</Label>
          <Input
            type="number"
            min="1"
            value={pagesRead}
            onChange={(e) => setPagesRead(e.target.value)}
            className="h-8 bg-paper-elevated text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Tarih</Label>
          <Input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="h-8 bg-paper-elevated text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Not (opsiyonel)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8 bg-paper-elevated text-sm"
          />
        </div>
      </div>
      {error && <p className="text-xs text-spine">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="h-7 bg-oak text-xs hover:bg-oak/90">
          Kaydet
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
