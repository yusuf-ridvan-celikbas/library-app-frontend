'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

/** Formun yönettiği tüm alanlar — her submit'te TAMAMI gönderilir (kısmi
 *  güncelleme belirsizliğine düşmemek için, bkz. backend'deki partial-update
 *  veri kaybı düzeltmesi). */
interface FormState {
  title: string;
  subtitle: string;
  description: string;
  status: BookStatus;
  language: string;
  pageCount: string;
  edition: string;
  publisherId: string;
  locationId: string;
  authorIds: string[];
  tagIds: string[];
}

function bookToForm(book: Book): FormState {
  return {
    title: book.title,
    subtitle: book.subtitle ?? '',
    description: book.description ?? '',
    status: book.status,
    language: book.language ?? '',
    pageCount: book.page_count?.toString() ?? '',
    edition: book.edition ?? '',
    publisherId: book.publisher?.id ?? '',
    locationId: book.location?.id ?? '',
    authorIds: book.authors.map((a) => a.id),
    tagIds: book.tags.map((t) => t.id),
  };
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authors, publishers, locations, tags, isLoading: refsLoading, addAuthor, addPublisher, addLocation, addTag } =
    useReferenceLists();

  const [book, setBook] = useState<Book | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ApiItemResponse<Book>>(`/books/${id}`)
      .then((res) => {
        setBook(res.data);
        setForm(bookToForm(res.data));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Kitap yüklenemedi.'));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setIsSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      const res = await api.put<ApiItemResponse<Book>>(`/books/${id}`, {
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        status: form.status,
        language: form.language || null,
        page_count: form.pageCount ? Number(form.pageCount) : null,
        edition: form.edition || null,
        publisher_id: form.publisherId || null,
        location_id: form.locationId || null,
        author_ids: form.authorIds,
        tag_ids: form.tagIds,
      });
      setBook(res.data);
      setForm(bookToForm(res.data));
      setSavedMessage('Kaydedildi.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`"${book?.title}" silinsin mi?`)) return;
    try {
      await api.delete(`/books/${id}`);
      router.push('/books');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silinemedi.');
    }
  }

  function toggleId(field: 'authorIds' | 'tagIds', value: string) {
    if (!form) return;
    const current = form[field];
    setForm({
      ...form,
      [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  }

  if (error && !book) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <p className="text-spine">{error}</p>
      </main>
    );
  }

  if (!book || !form) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-ink/50">Yükleniyor…</div>;
  }

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-oak/10 bg-paper-elevated px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/books" className="text-sm text-ink/60 underline underline-offset-2">
            ← Rafa dön
          </Link>
          <Button variant="ghost" onClick={handleDelete} className="text-spine hover:bg-spine/10 hover:text-spine">
            Sil
          </Button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="flex overflow-hidden rounded-sm border border-oak/10 bg-paper-elevated">
          <div className="w-1.5 shrink-0 bg-spine" />
          <div className="flex-1 space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="font-display text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitle">Alt başlık</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border border-oak/20 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brass"
              />
            </div>
          </div>
        </div>

        <fieldset className="space-y-4 rounded-sm border border-oak/10 bg-paper-elevated px-6 py-5">
          <legend className="call-number px-1 text-xs text-oak/60">Durum &amp; Konum</legend>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Durum</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })}
                className="w-full rounded-md border border-oak/20 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brass"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {!refsLoading && (
              <LocationCombobox
                items={locations}
                selectedId={form.locationId}
                onChange={(id) => setForm({ ...form, locationId: id })}
                onCreated={addLocation}
              />
            )}
          </div>

          {!refsLoading && (
            <SearchableSingleSelect
              label="Yayınevi"
              items={publishers}
              selectedId={form.publisherId}
              onChange={(id) => setForm({ ...form, publisherId: id })}
              createEndpoint="/publishers"
              onCreated={addPublisher}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="language">Dil</Label>
              <Input
                id="language"
                placeholder="tr, en…"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pageCount">Sayfa sayısı</Label>
              <Input
                id="pageCount"
                type="number"
                min="1"
                value={form.pageCount}
                onChange={(e) => setForm({ ...form, pageCount: e.target.value })}
              />
            </div>
          </div>
        </fieldset>

        {!refsLoading && (
          <SearchableMultiSelect
            label="Yazarlar"
            items={authors}
            selectedIds={form.authorIds}
            onToggle={(id) => toggleId('authorIds', id)}
            createEndpoint="/authors"
            onCreated={addAuthor}
          />
        )}

        {!refsLoading && (
          <SearchableMultiSelect
            label="Etiketler"
            items={tags}
            selectedIds={form.tagIds}
            onToggle={(id) => toggleId('tagIds', id)}
            createEndpoint="/tags"
            onCreated={addTag}
          />
        )}

        {error && <p className="text-sm text-spine">{error}</p>}
        {savedMessage && <p className="text-sm text-moss">{savedMessage}</p>}

        <Button type="submit" disabled={isSaving} className="w-full bg-oak hover:bg-oak/90">
          {isSaving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </form>
    </main>
  );
}
