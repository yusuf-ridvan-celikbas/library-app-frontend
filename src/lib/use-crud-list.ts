'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import type { ApiItemResponse, PaginatedResponse } from '@/types/api';

/**
 * Author/Publisher gibi paginate() dönen, Location/Tag gibi düz get()
 * dönen kaynaklar için ortak liste + oluştur + güncelle + sil mantığı.
 * Her yönetim sayfası (manage/authors, manage/tags vb.) bu hook'u
 * kullanıp sadece form alanlarını kendine özgü tutar.
 */
export function useCrudList<T extends { id: string }>(endpoint: string, paginated: boolean) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const request = paginated
      ? api.get<PaginatedResponse<T>>(`${endpoint}?per_page=100`).then((r) => r.data)
      : api.get<{ data: T[] }>(endpoint).then((r) => r.data);

    request
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Liste yüklenemedi.'))
      .finally(() => setIsLoading(false));
  }, [endpoint, paginated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function create(payload: Record<string, unknown>): Promise<T> {
    const res = await api.post<ApiItemResponse<T>>(endpoint, payload);
    setItems((prev) => [...prev, res.data]);
    return res.data;
  }

  async function update(id: string, payload: Record<string, unknown>): Promise<T> {
    const res = await api.put<ApiItemResponse<T>>(`${endpoint}/${id}`, payload);
    setItems((prev) => prev.map((item) => (item.id === id ? res.data : item)));
    return res.data;
  }

  async function remove(id: string): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return { items, isLoading, error, create, update, remove, refresh };
}
