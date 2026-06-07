'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/common';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('As senhas não coincidem'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return; }
    setLoading(true);
    try { await register(name, email, password); router.push('/'); }
    catch (e: unknown) {
      const err = e as { userMessage?: string };
      setError(err.userMessage ?? 'Erro ao fazer cadastro');
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Cadastre-se</h1>
          <p className="text-gray-400">Crie sua conta para avaliar filmes</p>
        </div>
        <form onSubmit={submit} className="bg-dark-100 rounded-xl p-8 border border-white/5">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {([
            { label: 'Nome', v: name, set: setName, type: 'text', placeholder: 'Seu nome' },
            { label: 'Email', v: email, set: setEmail, type: 'email', placeholder: 'seu@email.com' },
            { label: 'Senha', v: password, set: setPassword, type: 'password', placeholder: '••••••••' },
            { label: 'Confirmar Senha', v: confirm, set: setConfirm, type: 'password', placeholder: '••••••••' },
          ] as const).map((f) => (
            <div key={f.label} className="mb-6 space-y-2">
              <label className="block text-sm font-medium text-gray-400">{f.label}</label>
              <Input type={f.type} value={f.v} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} required />
            </div>
          ))}
          <Button type="submit" loading={loading} className="w-full">Cadastrar</Button>
          <p className="text-center text-gray-400 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
