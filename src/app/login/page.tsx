'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth, ApiError } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Giriş yapılamadı.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        {/* İmza öge: katalog kartı üst şeridi — kitap sırtı rengiyle */}
        <div className="h-2 rounded-t-sm bg-spine" />
        <div className="rounded-b-sm border border-oak/15 bg-paper-elevated px-8 py-10 shadow-sm">
          <p className="call-number text-xs text-oak/60">KÜTÜPHANEM · GİRİŞ</p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">
            Rafına dön.
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-spine">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full bg-oak hover:bg-oak/90">
              {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            Hesabın yok mu?{' '}
            <Link href="/register" className="font-medium text-spine underline underline-offset-2">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
