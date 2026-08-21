'use client';

import { useState, type FormEvent } from 'react';
import { api, ApiError } from '@/lib/api-client';
import type { ApiItemResponse, Location } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NamedItem {
  id: string;
  name: string;
  color?: string;
}

/**
 * Çoklu seçim + satır içi "yeni ekle" (Yazar, Etiket gibi tek alanlı
 * — sadece 'name' isteyen — kaynaklar için). Kullanıcı listede olmayan
 * bir yazar/etiket yazıp anında oluşturup seçebilir; formu terk etmesi
 * gerekmez.
 */
export function MultiTogglePicker<T extends NamedItem>({
  label,
  items,
  selectedIds,
  onToggle,
  createEndpoint,
  onCreated,
  emptyHint,
}: {
  label: string;
  items: T[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  createEndpoint: string;
  onCreated: (item: T) => void;
  emptyHint?: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await api.post<ApiItemResponse<T>>(createEndpoint, { name: newName.trim() });
      onCreated(res.data);
      onToggle(res.data.id); // yeni oluşturulanı otomatik seç
      setNewName('');
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Eklenemedi.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <fieldset className="space-y-3 rounded-sm border border-oak/10 bg-paper-elevated px-6 py-5">
      <div className="flex items-center justify-between">
        <legend className="call-number px-1 text-xs text-oak/60">{label}</legend>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="text-xs text-brass underline underline-offset-2"
        >
          {isAdding ? 'Vazgeç' : '+ Yeni ekle'}
        </button>
      </div>

      {items.length === 0 && !isAdding && emptyHint && <p className="text-sm text-ink/40">{emptyHint}</p>}

      {items.length > 0 && !isAdding && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onToggle(item.id)}
                style={selected && item.color ? { backgroundColor: item.color, borderColor: item.color } : undefined}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selected
                    ? item.color
                      ? 'text-paper'
                      : 'border-oak bg-oak text-paper'
                    : 'border-oak/20 bg-paper text-ink/70 hover:border-oak/40'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            autoFocus
            placeholder="İsim…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9 bg-paper text-sm"
          />
          <Button type="submit" size="sm" disabled={isCreating || !newName.trim()} className="bg-oak hover:bg-oak/90">
            Ekle
          </Button>
        </form>
      )}
      {error && <p className="text-xs text-spine">{error}</p>}
    </fieldset>
  );
}

/**
 * Tekli seçim + satır içi "yeni ekle" (Yayınevi gibi). Native <select>
 * kullanır — mobilde klavye/erişilebilirlik davranışı özel bir
 * combobox'tan daha güvenilirdir.
 */
export function SingleSelectPicker<T extends NamedItem>({
  label,
  items,
  selectedId,
  onChange,
  createEndpoint,
  onCreated,
  placeholder = '— Belirtilmemiş —',
}: {
  label: string;
  items: T[];
  selectedId: string;
  onChange: (id: string) => void;
  createEndpoint: string;
  onCreated: (item: T) => void;
  placeholder?: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await api.post<ApiItemResponse<T>>(createEndpoint, { name: newName.trim() });
      onCreated(res.data);
      onChange(res.data.id);
      setNewName('');
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Eklenemedi.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink">{label}</label>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="text-xs text-brass underline underline-offset-2"
        >
          {isAdding ? 'Vazgeç' : '+ Yeni ekle'}
        </button>
      </div>

      {!isAdding ? (
        <select
          value={selectedId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-oak/20 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brass"
        >
          <option value="">{placeholder}</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : (
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            autoFocus
            placeholder="İsim…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9 bg-paper text-sm"
          />
          <Button type="submit" size="sm" disabled={isCreating || !newName.trim()} className="bg-oak hover:bg-oak/90">
            Ekle
          </Button>
        </form>
      )}
      {error && <p className="text-xs text-spine">{error}</p>}
    </div>
  );
}

/**
 * Konum seçici özel bir durum: Location kaydı oluşturmak için tek bir
 * 'name' yetmiyor, 'room' (Oda) ve 'shelf' (Raf) İKİSİ DE zorunlu
 * (bkz. backend LocationRequest). Bu yüzden generic SingleSelectPicker
 * yerine ayrı, iki alanlı bir satır içi oluşturma formu kullanır.
 */
export function LocationPicker({
  items,
  selectedId,
  onChange,
  onCreated,
}: {
  items: Location[];
  selectedId: string;
  onChange: (id: string) => void;
  onCreated: (item: Location) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [room, setRoom] = useState('');
  const [shelf, setShelf] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!room.trim() || !shelf.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await api.post<ApiItemResponse<Location>>('/locations', {
        room: room.trim(),
        shelf: shelf.trim(),
      });
      onCreated(res.data);
      onChange(res.data.id);
      setRoom('');
      setShelf('');
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Eklenemedi.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink">Konum</label>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="text-xs text-brass underline underline-offset-2"
        >
          {isAdding ? 'Vazgeç' : '+ Yeni konum'}
        </button>
      </div>

      {!isAdding ? (
        <select
          value={selectedId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-oak/20 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brass"
        >
          <option value="">— Belirtilmemiş —</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.display_name}
            </option>
          ))}
        </select>
      ) : (
        <form onSubmit={handleCreate} className="space-y-2 rounded-md border border-oak/15 bg-paper p-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              autoFocus
              placeholder="Oda (örn. Çalışma Odası)"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="h-9 bg-paper-elevated text-sm"
            />
            <Input
              placeholder="Raf (örn. Raf-3)"
              value={shelf}
              onChange={(e) => setShelf(e.target.value)}
              className="h-9 bg-paper-elevated text-sm"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={isCreating || !room.trim() || !shelf.trim()}
            className="w-full bg-oak hover:bg-oak/90"
          >
            Konumu Ekle
          </Button>
        </form>
      )}
      {error && <p className="text-xs text-spine">{error}</p>}
    </div>
  );
}
