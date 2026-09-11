'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LogoIgreja from '@/assets/img/logo/logo-igreja.svg';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? 'E-mail ou senha incorretos.');
      return;
    }

    router.push('/painel');
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1C1512]">
      {/* Fundo único, tela inteira */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="bgGlow" cx="30%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#701513" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1C1512" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#bgGlow)" />
        <path
          d="M 520 900 L 520 330 A 170 170 0 0 1 860 330 L 860 900"
          fill="none"
          stroke="#C9A227"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
        <path
          d="M 420 900 L 420 250 A 270 270 0 0 1 960 250 L 960 900"
          fill="none"
          stroke="#C9A227"
          strokeOpacity="0.1"
          strokeWidth="1.5"
        />
      </svg>

      {/* Conteúdo: texto à esquerda, card à direita */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-14 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-16">
        {/* Logo + texto — só sobre o fundo, sem painel próprio */}
        <div className="flex max-w-md flex-col items-start text-left">
          <Image src={LogoIgreja} alt="Logo da paróquia" className="h-24" priority />

          <h1 className="mt-8 text-4xl font-semibold leading-tight text-white">
            A casa da comunidade, também no digital.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Acesse o painel para atualizar missas, eventos, escalas e comunicados
            vistos por toda a paróquia.
          </p>
        </div>

        {/* Card com corte diagonal, estilo do wireframe de referência */}
        <div
          className="w-full max-w-sm border border-white/15 bg-white/10 px-8 pb-10 pt-9 shadow-2xl backdrop-blur-xl"
          style={{
            clipPath:
              'polygon(0 0, 100% 0, 100% 82%, 88% 100%, 0 100%)',
          }}
        >
          <div className="flex flex-col items-center text-center">
            <Image src={LogoIgreja} alt="Logo da paróquia" className="h-24" />

            <h2 className="mt-4 text-2xl font-semibold text-white">Entrar no painel</h2>
            <p className="mt-1.5 text-sm text-white/70">
              Use as credenciais da secretaria ou da sua pastoral.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm text-white/80">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="secretaria@paroquia.org"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm text-white/80">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#ff8783]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-[#701513] py-2.5 text-sm font-medium text-white transition hover:bg-[#8a1a17] disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/50">
            Esqueceu a senha? Fale com a secretaria da paróquia.
          </p>
        </div>
      </div>
    </div>
  );
}