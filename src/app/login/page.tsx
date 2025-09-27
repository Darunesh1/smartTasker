'use client';

import { useAuth } from '@/components/auth/auth-provider';
import LoginForm from '@/components/auth/login-form';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Logo from '@/components/logo';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
            <Logo />
        </div>
        <h1 className="text-center text-3xl font-bold font-headline">Welcome to TaskWise</h1>
        <p className="text-center text-muted-foreground">Log in or create an account to manage your tasks.</p>
        <LoginForm />
      </div>
    </div>
  );
}
