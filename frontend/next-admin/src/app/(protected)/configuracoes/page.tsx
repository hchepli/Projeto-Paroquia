'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { ROUTES } from '@/config/routes';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { canViewSettings, isLoading } = usePermissions();

  if (isLoading) return <p className="py-6 text-sm text-gray-500">Carregando...</p>;

  return (
    <>
      <Header
        title="Configurações"
        actions={[{ label: 'Voltar ao início', onClick: () => router.push(ROUTES.inicio) }]}
      />
      <p role={canViewSettings ? undefined : 'alert'} className="mt-8 text-base text-[rgba(0,0,0,0.7)]">
        {canViewSettings
          ? 'Esta área está sendo preparada. Em breve você poderá ajustar as opções do sistema por aqui.'
          : 'Esta página é só para o administrador geral.'}
      </p>
    </>
  );
}