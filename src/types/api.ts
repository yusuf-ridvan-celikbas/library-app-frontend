/**
 * Bu dosyadaki her tip, backend'deki karşılık gelen bir
 * App\Http\Resources\*Resource sınıfının çıktısıyla BİREBİR eşleşir.
 * Backend'de bir Resource değişirse bu dosya da elle güncellenmeli
 * (otomatik senkronizasyon yok — küçük bir proje için OpenAPI/Zod
 * codegen kurmak fazla mühendislik olurdu).
 */

export type BookStatus = 'available' | 'reading' | 'loaned' | 'lost' | 'archived';
export type LoanStatus = 'active' | 'returned' | 'overdue' | 'lost';
export type ReadingStatus = 'planned' | 'in_progress' | 'finished' | 'abandoned';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  birth_country: string | null;
  bio: string | null;
}

export interface Publisher {
  id: string;
  name: string;
  slug: string;
  country: string | null;
}

export interface Location {
  id: string;
  room: string;
  shelf: string;
  position: string | null;
  label: string | null;
  display_name: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface Borrower {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: BookStatus;
  status_label: string;
  isbn10: string | null;
  isbn13: string | null;
  language: string | null;
  page_count: number | null;
  published_at: string | null;
  edition: string | null;
  cover_image_source_url: string | null;
  publisher: Pick<Publisher, 'id' | 'name'> | null;
  location: Pick<Location, 'id' | 'display_name'> | null;
  authors: Pick<Author, 'id' | 'name'>[];
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  status: LoanStatus;
  status_label: string;
  loaned_at: string;
  due_at: string | null;
  returned_at: string | null;
  is_overdue: boolean;
  notes: string | null;
  book: Pick<Book, 'id' | 'title'>;
  borrower: Pick<Borrower, 'id' | 'name'> | null;
  created_at: string;
}

export interface ReadingSession {
  id: string;
  status: ReadingStatus;
  status_label: string;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  notes: string | null;
  book: Pick<Book, 'id' | 'title' | 'page_count'>;
  created_at: string;
}

/**
 * Laravel'in native paginated resource response formatı — Controller'da
 * `XResource::collection($paginator)->response()` şeklinde DOĞRUDAN
 * dönüldüğünde üretilir. ($this->ok() ile elle sarmak bu formatı BOZAR,
 * bu yüzden backend'deki tüm sayfalanan index() endpoint'leri bu şekle
 * dönecek şekilde düzeltildi — bkz. BookController, AuthorController vb.)
 */
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/** get() ile dönen, paginate edilmemiş listeler için (Location, Tag gibi). */
export interface ApiArrayResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  message?: string;
  data: T;
}

/**
 * bootstrap/app.php içindeki merkezi exception handler'ın ürettiği
 * hata formatı (ApplicationException::render() ve ValidationException).
 */
export interface ApiErrorResponse {
  message: string;
  error_code?: string;
  context?: Record<string, unknown> | null;
  errors?: Record<string, string[]>; // sadece VALIDATION_FAILED'da dolu
}
