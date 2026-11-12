'use client';

import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import AnnouncementForm from '@/components/ui/forms/AnnouncementForm';
import { useAnnouncement } from '@/hooks/announcements/useAnnouncement';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { announcementToFormValues, getAnnouncementLoadError } from '@/lib/announcements/form';

function safeBackPath(value: string | null, fallback: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

function EditarAvisoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const { canManageAnnouncements, isLoading: permissionsLoading } = usePermissions();

  const backPath = safeBackPath(searchParams.get('voltar'), '/avisos');
  const numericId = Number(params.id);
  const validId = Number.isInteger(numericId) && numericId > 0 ? numericId : null;

  const {
    data: announcement,
    isLoading,
    isError,
    error,
  } = useAnnouncement(validId, canManageAnnouncements);

  let body: React.ReactNode;
  if (permissionsLoading) {
    body = <p className="text-sm text-[rgba(0,0,0,0.5)]">Carregando...</p>;
  } else if (!canManageAnnouncements) {
    body = (
      <p className="text-sm text-[rgba(0,0,0,0.7)]" role="alert">
        Você não tem permissão para editar avisos. Fale com o Admin Geral ou com a Secretaria.
      </p>
    );
  } else if (validId === null) {
    body = (
      <p className="text-sm text-red-600" role="alert">
        Este aviso não existe. Volte para a lista e escolha outro.
      </p>
    );
  } else if (isLoading) {
    body = <p className="text-sm text-[rgba(0,0,0,0.5)]">Carregando o aviso...</p>;
  } else if (isError || !announcement) {
    body = (
      <p className="text-sm text-red-600" role="alert">
        {getAnnouncementLoadError(error, 'Não foi possível abrir o aviso.')}{' '}
        <button type="button" onClick={() => router.push(backPath)} className="underline">
          Voltar para a lista
        </button>
      </p>
    );
  } else {
    body = (
      <AnnouncementForm
        key={announcement.updatedAt}
        mode="edit"
        announcementId={announcement.id}
        initialValues={announcementToFormValues(announcement)}
        backPath={backPath}
      />
    );
  }

  return (
    <>
      <Header
        title="Editar aviso"
        description="Mude o que precisar e clique em Salvar."
        onBack={() => router.push(backPath)}
      />
      <div className="py-6">{body}</div>
    </>
  );
}

export default function EditarAvisoPage() {
  return (
    <Suspense fallback={null}>
      <EditarAvisoContent />
    </Suspense>
  );
}