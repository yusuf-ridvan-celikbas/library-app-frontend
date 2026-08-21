'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { Author, Location, PaginatedResponse, Publisher, Tag } from '@/types/api';

interface ReferenceLists {
  authors: Author[];
  publishers: Publisher[];
  locations: Location[];
  tags: Tag[];
  isLoading: boolean;
  /** Satır içi "hızlı ekle" ile oluşturulan yeni bir öğeyi listeye ekler
   *  (sunucuya tekrar sorgu atmadan, anında UI'da görünür). */
  addAuthor: (item: Author) => void;
  addPublisher: (item: Publisher) => void;
  addLocation: (item: Location) => void;
  addTag: (item: Tag) => void;
}

/**
 * Kitap düzenleme formunda "yazar/yayınevi/konum/etiket seç" alanları
 * için gereken referans listelerini tek seferde çeker. Bu listeler
 * küçük olduğu için (kişisel kütüphane senaryosu — yüzlerce değil,
 * onlarca kayıt) sayfalama veya arama UI'ı gerekmiyor.
 */
export function useReferenceLists(): ReferenceLists {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Author>>('/authors?per_page=100'),
      api.get<PaginatedResponse<Publisher>>('/publishers?per_page=100'),
      api.get<{ data: Location[] }>('/locations'),
      api.get<{ data: Tag[] }>('/tags'),
    ])
      .then(([authorsRes, publishersRes, locationsRes, tagsRes]) => {
        setAuthors(authorsRes.data);
        setPublishers(publishersRes.data);
        setLocations(locationsRes.data);
        setTags(tagsRes.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return {
    authors,
    publishers,
    locations,
    tags,
    isLoading,
    addAuthor: (item: Author) => setAuthors((prev) => [...prev, item]),
    addPublisher: (item: Publisher) => setPublishers((prev) => [...prev, item]),
    addLocation: (item: Location) => setLocations((prev) => [...prev, item]),
    addTag: (item: Tag) => setTags((prev) => [...prev, item]),
  };
}
