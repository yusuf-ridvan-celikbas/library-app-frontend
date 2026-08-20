'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth, ApiError } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(name, email, password, passwordConfirmation);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else {
        setError('Kayıt olunamadı.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="h-2 rounded-t-sm bg-brass" />
        <div className="rounded-b-sm border border-oak/15 bg-paper-elevated px-8 py-10 shadow-sm">
          <p className="call-number text-xs text-oak/60">KÜTÜPHANEM · KAYIT</p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">Rafını kur.</h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              {fieldErrors.name && <p className="text-sm text-spine">{fieldErrors.name[0]}</p>}
            </div>
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
              {fieldErrors.email && <p className="text-sm text-spine">{fieldErrors.email[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-ink/50">En az 8 karakter, harf ve rakam içermeli.</p>
              {fieldErrors.password && <p className="text-sm text-spine">{fieldErrors.password[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation">Şifre (tekrar)</Label>
              <Input
                id="password_confirmation"
                type="password"
                required
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-spine">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full bg-oak hover:bg-oak/90">
              {isSubmitting ? 'Kayıt oluyor…' : 'Kayıt ol'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            Zaten hesabın var mı?{' '}
            <Link href="/login" className="font-medium text-spine underline underline-offset-2">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
