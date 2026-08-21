'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useReferenceLists } from '@/lib/reference-data';
import { SearchableMultiSelect, SearchableSingleSelect, LocationCombobox } from '@/components/searchable-select';
import type { ApiItemResponse, Book, BookStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
  { value: 'available', label: 'Müsait' },
  { value: 'reading', label: 'Okunuyor' },
  { value: 'loaned', label: 'Ödünçte' },
  { value: 'lost', label: 'Kayıp' },
  { value: 'archived', label: 'Arşivlendi' },
];

/**
 * ISBN taraması / arama başarısız olduğunda (örn. çok eski, yerel ya da
 * kendi yayınladığınız bir kitap) devreye giren tam manuel giriş formu.
 * Referans veriler (yazar, yayınevi, konum, etiket) formu terk etmeden
 * satır içi oluşturulabilir — bkz. reference-pickers.tsx.
 */
export function ManualBookForm() {
  const router = useRouter();
  const { authors, publishers, locations, tags, isLoading, addAuthor, addPublisher, addLocation, addTag } =
    useReferenceLists();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<BookStatus>('available');
  const [language, setLanguage] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAuthor(id: string) {
    setAuthorIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Başlık zorunludur.');
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const res = await api.post<ApiItemResponse<Book>>('/books', {
        title: title.trim(),
        subtitle: subtitle || null,
        description: description || null,
        status,
        language: language || null,
        page_count: pageCount ? Number(pageCount) : null,
        publisher_id: publisherId || null,
        location_id: locationId || null,
        author_ids: authorIds,
        tag_ids: tagIds,
      });
      router.push(`/books/${res.data.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kitap eklenemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="m-title">Başlık *</Label>
        <Input id="m-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="m-subtitle">Alt başlık</Label>
        <Input id="m-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="m-description">Açıklama</Label>
        <textarea
          id="m-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-oak/20 bg-paper-elevated px-3 py-2 text-sm text-ink outline-none focus:border-brass"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="m-status">Durum</Label>
          <select
            id="m-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as BookStatus)}
            className="w-full rounded-md border border-oak/20 bg-paper-elevated px-3 py-2 text-sm text-ink outline-none focus:border-brass"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-language">Dil</Label>
          <Input id="m-language" placeholder="tr, en…" value={language} onChange={(e) => setLanguage(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="m-pages">Sayfa sayısı</Label>
        <Input
          id="m-pages"
          type="number"
          min="1"
          value={pageCount}
          onChange={(e) => setPageCount(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-ink/40">Referans veriler yükleniyor…</p>
      ) : (
        <>
          <LocationCombobox items={locations} selectedId={locationId} onChange={setLocationId} onCreated={addLocation} />

          <SearchableSingleSelect
            label="Yayınevi"
            items={publishers}
            selectedId={publisherId}
            onChange={setPublisherId}
            createEndpoint="/publishers"
            onCreated={addPublisher}
          />

          <SearchableMultiSelect
            label="Yazarlar"
            items={authors}
            selectedIds={authorIds}
            onToggle={toggleAuthor}
            createEndpoint="/authors"
            onCreated={addAuthor}
          />

          <SearchableMultiSelect
            label="Etiketler"
            items={tags}
            selectedIds={tagIds}
            onToggle={toggleTag}
            createEndpoint="/tags"
            onCreated={addTag}
          />
        </>
      )}

      {error && <p className="text-sm text-spine">{error}</p>}

      <Button type="submit" disabled={isSaving} className="w-full bg-oak hover:bg-oak/90">
        {isSaving ? 'Ekleniyor…' : 'Kitabı Ekle'}
      </Button>
    </form>
  );
}
