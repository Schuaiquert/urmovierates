'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/common';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); router.push('/'); }
    catch (e: unknown) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Erro ao fazer login');
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Entrar</h1>
          <p className="text-gray-400">Faça login para avaliar filmes</p>
        </div>
        <form onSubmit={submit} className="bg-dark-100 rounded-xl p-8 border border-white/5">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="mb-6 space-y-2">
            <label className="block text-sm font-medium text-gray-400">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className="mb-6 space-y-2">
            <label className="block text-sm font-medium text-gray-400">Senha</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" loading={loading} className="w-full">Entrar</Button>
          <p className="text-center text-gray-400 mt-6">
            Não tem conta?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
