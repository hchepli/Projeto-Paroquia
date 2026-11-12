'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import AnnouncementForm from '@/components/ui/forms/AnnouncementForm';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { EMPTY_ANNOUNCEMENT_FORM } from '@/lib/announcements/form';

function safeBackPath(value: string | null, fallback: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

function NovoAvisoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canManageAnnouncements, isLoading } = usePermissions();
  const backPath = safeBackPath(searchParams.get('voltar'), '/avisos');

  return (
    <>
      <Header
        title="Registrar aviso"
        description="Escreva um aviso para a comunidade."
        onBack={() => router.push(backPath)}
      />

      <div className="py-6">
        {isLoading ? (
          <p className="text-sm text-[rgba(0,0,0,0.5)]">Carregando...</p>
        ) : !canManageAnnouncements ? (
          <p className="text-sm text-[rgba(0,0,0,0.7)]" role="alert">
            Você não tem permissão para criar avisos. Fale com o Admin Geral ou com a Secretaria.
          </p>
        ) : (
          <AnnouncementForm
            mode="create"
            initialValues={EMPTY_ANNOUNCEMENT_FORM}
            backPath={backPath}
          />
        )}
      </div>
    </>
  );
}

export default function NovoAvisoPage() {
  return (
    <Suspense fallback={null}>
      <NovoAvisoContent />
    </Suspense>
  );
}