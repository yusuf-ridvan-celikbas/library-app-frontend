'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { ApiItemResponse, Location } from '@/types/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NamedItem {
  id: string;
  name: string;
  color?: string;
}

/**
 * Not: Bu projedeki shadcn kurulumu Radix UI değil BASE UI üzerine
 * inşa edilmiş (bkz. PopoverTrigger'ın data-base-ui-* attribute'ları).
 * Base UI'da asChild, Radix'teki gibi çocuk elementin İÇİNE ERİMİYOR
 * — kendi <button>'ını ayrıca render edip sarılan elementin
 * <button>'ını içine alıyor, "button içinde button" hydration
 * hatasına yol açıyor. Çözüm: asChild hiç kullanmadan, PopoverTrigger
 * bileşenini doğrudan className ile stillendirmek (zaten kendi
 * başına bir buton render ediyor).
 */
const TRIGGER_CLASS =
  'flex w-full items-center justify-between rounded-md border border-oak/20 bg-paper px-3 py-2 text-left text-sm text-ink outline-none focus:border-brass';

/**
 * Aramalı, satır içi "yeni ekle" destekli ÇOKLU seçim (Yazarlar,
 * Etiketler). Kitap sayısı arttıkça listeler uzayacağı için basit
 * toggle pill'ler yerine filtrelenebilir bir açılır liste kullanır.
 */
export function SearchableMultiSelect<T extends NamedItem>({
  label,
  items,
  selectedIds,
  onToggle,
  createEndpoint,
  onCreated,
}: {
  label: string;
  items: T[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  createEndpoint: string;
  onCreated: (item: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const triggerLabel =
    selectedItems.length === 0
      ? `— ${label} seçin —`
      : selectedItems.length <= 2
        ? selectedItems.map((i) => i.name).join(', ')
        : `${selectedItems.length} ${label.toLowerCase()} seçili`;

  async function handleCreate() {
    if (!search.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await api.post<ApiItemResponse<T>>(createEndpoint, { name: search.trim() });
      onCreated(res.data);
      onToggle(res.data.id);
      setSearch('');
    } catch {
      // Sessizce yut; kullanıcı Command'ın boş state'inde tekrar deneyebilir.
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={TRIGGER_CLASS}>
          <span className={selectedItems.length === 0 ? 'text-ink/40' : ''}>{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-ink/40" />
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] bg-paper-elevated p-0 text-ink" align="start">
          <Command>
            <CommandInput placeholder={`${label} ara…`} value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!search.trim() || isCreating}
                  className="w-full px-3 py-2 text-left text-sm text-brass hover:bg-oak/5"
                >
                  {isCreating ? 'Ekleniyor…' : `+ "${search}" olarak ekle`}
                </button>
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => onToggle(item.id)}
                      className="flex items-center gap-2"
                    >
                      <Check className={`h-4 w-4 ${selected ? 'opacity-100 text-brass' : 'opacity-0'}`} />
                      {item.color && (
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      )}
                      {item.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Aramalı, satır içi "yeni ekle" destekli TEKLİ seçim (Yayınevi).
 * Seçim yapılınca popover otomatik kapanır.
 */
export function SearchableSingleSelect<T extends NamedItem>({
  label,
  items,
  selectedId,
  onChange,
  createEndpoint,
  onCreated,
}: {
  label: string;
  items: T[];
  selectedId: string;
  onChange: (id: string) => void;
  /** Verilmezse "+ ... olarak ekle" seçeneği gösterilmez (örn. Kitap seçiminde
   *  yanlışlıkla eksik bilgili bir kitap oluşturulmasını önlemek için). */
  createEndpoint?: string;
  onCreated?: (item: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedId);

  async function handleCreate() {
    if (!search.trim() || isCreating || !createEndpoint) return;
    setIsCreating(true);
    try {
      const res = await api.post<ApiItemResponse<T>>(createEndpoint, { name: search.trim() });
      onCreated?.(res.data);
      onChange(res.data.id);
      setSearch('');
      setOpen(false);
    } catch {
      // Sessizce yut.
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={TRIGGER_CLASS}>
          <span className={!selectedItem ? 'text-ink/40' : ''}>
            {selectedItem?.name ?? `— ${label} seçin —`}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-ink/40" />
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] bg-paper-elevated p-0 text-ink" align="start">
          <Command>
            <CommandInput placeholder={`${label} ara…`} value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {createEndpoint ? (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!search.trim() || isCreating}
                    className="w-full px-3 py-2 text-left text-sm text-brass hover:bg-oak/5"
                  >
                    {isCreating ? 'Ekleniyor…' : `+ "${search}" olarak ekle`}
                  </button>
                ) : (
                  <p className="px-3 py-2 text-sm text-ink/40">Sonuç bulunamadı.</p>
                )}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className="text-ink/50"
                >
                  — Belirtilmemiş —
                </CommandItem>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check className={`h-4 w-4 ${selectedId === item.id ? 'opacity-100 text-brass' : 'opacity-0'}`} />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Konum için özel combobox: backend'de kayıt oluşturmak için 'name'
 * yeterli değil, 'room' (Oda) VE 'shelf' (Raf) İKİSİ DE zorunlu. Bu
 * yüzden CommandEmpty'de tek bir arama kutusu yerine iki alanlı mini
 * bir form gösterir.
 */
export function LocationCombobox({
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newShelf, setNewShelf] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedId);

  async function handleCreate() {
    if (!newRoom.trim() || !newShelf.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await api.post<ApiItemResponse<Location>>('/locations', {
        room: newRoom.trim(),
        shelf: newShelf.trim(),
      });
      onCreated(res.data);
      onChange(res.data.id);
      setNewRoom('');
      setNewShelf('');
      setSearch('');
      setOpen(false);
    } catch {
      // Sessizce yut.
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-ink">Konum</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={TRIGGER_CLASS}>
          <span className={!selectedItem ? 'text-ink/40' : ''}>
            {selectedItem?.display_name ?? '— Konum seçin —'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-ink/40" />
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] bg-paper-elevated p-0 text-ink" align="start">
          <Command>
            <CommandInput placeholder="Konum ara…" value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                <div className="space-y-2 p-3">
                  <p className="text-xs text-ink/50">Yeni konum ekle:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Oda"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Raf"
                      value={newShelf}
                      onChange={(e) => setNewShelf(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreate}
                    disabled={!newRoom.trim() || !newShelf.trim() || isCreating}
                    className="w-full bg-oak hover:bg-oak/90"
                  >
                    {isCreating ? 'Ekleniyor…' : 'Konumu Ekle'}
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className="text-ink/50"
                >
                  — Belirtilmemiş —
                </CommandItem>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.display_name}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check className={`h-4 w-4 ${selectedId === item.id ? 'opacity-100 text-brass' : 'opacity-0'}`} />
                    {item.display_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
