import { Suspense } from 'react';
import { LoginForm } from '@/components/panel/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">BEN-STAL</p>
        <h1 className="mb-5 text-xl font-bold text-slate-900">Logowanie do panelu</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
