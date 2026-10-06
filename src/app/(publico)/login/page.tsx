import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/');
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Entrar</h1>
      <LoginForm />
    </main>
  );
}
