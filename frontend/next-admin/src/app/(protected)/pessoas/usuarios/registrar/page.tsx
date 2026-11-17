'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import UserForm, { UserFormValues } from '@/components/ui/forms/UserForm';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useCreateUser } from '@/hooks/users/useUserMutations';
import { useRoles } from '@/hooks/roles/useRoles';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups'; // confirmar caminho
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { getUserSaveError } from '@/lib/users/errors';

export default function RegistrarUsuarioPage() {
  const router = useRouter();
  const { data: me, isLoading } = useCurrentUser();
  const allowed = me?.role?.name === ROLE_NAMES.ADMIN;
  const { data: roles = [] } = useRoles({ enabled: allowed });
  const { data: pastorais = [] } = usePastoralGroups();
  const create = useCreateUser();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!me) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (!allowed) return <p role="alert" className="mt-8 text-base text-red-600">Você não tem acesso a esta página.</p>;

  function submit(v: UserFormValues) {
    setError(null);
    create.mutate(
      { name: v.name, email: v.email, password: v.password!, roleId: v.roleId, pastoralGroupId: v.pastoralGroupId },
      {
        onSuccess: () => router.push('/pessoas/usuarios'),
        onError: (e) => setError(getUserSaveError(e)),
      },
    );
  }

  return (
    <>
      <Header title="Cadastrar usuário" description="Quem vai entrar neste painel."
        onBack={() => router.push('/pessoas/usuarios')} />
      <UserForm roles={roles} pastorais={pastorais} isSaving={create.isPending} error={error}
        submitLabel="Cadastrar usuário" onSubmit={submit} onCancel={() => router.push('/pessoas/usuarios')} />
    </>
  );
}