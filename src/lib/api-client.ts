import type { ApiErrorResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  // Build zamanında değil, runtime'da (tarayıcıda) fark edilsin diye
  // throw değil console.error — Next.js build'i bu yüzden kırılmasın.
  console.error(
    'NEXT_PUBLIC_API_URL tanımlı değil. .env.local dosyasını kontrol edin.'
  );
}

const TOKEN_STORAGE_KEY = 'library_app_token';

/**
 * Token'ı localStorage'da tutuyoruz (cookie tabanlı Sanctum SPA auth
 * DEĞİL). Backend Personal Access Token (Bearer) modeliyle kurulduğu
 * için frontend'in backend ile aynı origin'de olması gerekmiyor — bu,
 * mobil erişim için Tailscale/Cloudflare Tunnel/port yönlendirme
 * kararından tamamen bağımsız çalışır.
 */
export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null; // SSR güvenliği
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  set(token: string): void {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  },
  clear(): void {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};

/**
 * Backend'in ApplicationException/ValidationException JSON formatını
 * bire bir taşıyan hata sınıfı. Bileşenler bunu yakalayıp error_code'a
 * göre dallanabilir (örn. 'BOOK_ALREADY_LOANED' -> özel bir uyarı göster).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
    public fieldErrors?: Record<string, string[]>,
    public context?: Record<string, unknown> | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Belirli bir alan için ilk doğrulama hatası mesajını döner (form gösteriminde kullanışlı). */
  fieldError(field: string): string | undefined {
    return this.fieldErrors?.[field]?.[0];
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown; // otomatik JSON.stringify edilir
  auth?: boolean; // varsayılan true; login/register gibi public endpoint'lerde false verilir
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = tokenStorage.get();
    if (token) {
      (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content: gövde parse etmeye çalışma
  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = json as ApiErrorResponse | null;

    // Sanctum token süresi dolmuş/geçersizse oturumu temizle, tekrar
    // giriş ekranına düşsün — bileşenler her yerde 401 kontrolü
    // yazmak zorunda kalmasın.
    if (response.status === 401) {
      tokenStorage.clear();
    }

    throw new ApiError(
      errorBody?.message ?? 'Bilinmeyen bir hata oluştu.',
      response.status,
      errorBody?.error_code,
      errorBody?.errors,
      errorBody?.context,
    );
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
