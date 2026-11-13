// src/app/(admin)/pessoas/usuarios/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import GenericTable, { GenericTableColumn } from '@/components/ui/tables/GenericTable';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useUsers } from '@/hooks/users/useUsers';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { errorMessage } from '@/lib/api-error';
import { User } from '@/types/users/user';

const USERS_ROLES: string[] = [ROLE_NAMES.ADMIN, ROLE_NAMES.SECRETARIA];

const columns: GenericTableColumn<User>[] = [
  { key: 'name', label: 'Nome', render: (u) => u.name },
  { key: 'email', label: 'E-mail', render: (u) => u.email },
  { key: 'role', label: 'Função', render: (u) => u.role?.name ?? '—' },
  { key: 'pastoral', label: 'Pastoral', render: (u) => u.pastoralGroup?.name ?? '—' },
  { key: 'status', label: 'Situação', render: (u) => (u.status === 'ATIVO' ? 'Ativo' : 'Desativado') },
];

export default function PessoasUsuariosPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const allowed = !!currentUser?.role?.name && USERS_ROLES.includes(currentUser.role.name);

  const { data: users = [], isLoading, error: loadError } = useUsers({ enabled: allowed });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter && u.status !== statusFilter) return false;
      if (!term) return true;
      return [u.name, u.email].some((f) => f.toLowerCase().includes(term));
    });
  }, [users, search, statusFilter]);

  if (userLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (!allowed) return <p className="mt-8 text-base text-red-600">Você não tem acesso a esta página.</p>;

  const hasFilter = search.trim() !== '' || statusFilter !== '';

  return (
    <>
      <Header
        title="Usuários"
        description="Pessoas que entram neste painel."
        onBack={() => router.push('/pessoas')}
        actions={[{ label: 'Cadastrar usuário', onClick: () => router.push('/usuarios/registrar') }]}
      />

      {!!loadError && (
        <p role="alert" className="mt-4 text-base text-red-600">
          {errorMessage(loadError, 'Não foi possível carregar os usuários. Tente de novo em instantes.')}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={items}
          rowKey={(u) => u.id}
          isLoading={isLoading}
          emptyMessage={
            hasFilter
              ? 'Nenhum usuário encontrado. Tente buscar com outras palavras.'
              : 'Ainda não há usuários cadastrados.'
          }
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nome ou e-mail..."
          filters={[
            {
              key: 'status',
              placeholder: 'Todos',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: '', label: 'Todos' },
                { value: 'ATIVO', label: 'Ativos' },
                { value: 'INATIVO', label: 'Desativados' },
              ],
            },
          ]}
          actions={[{ label: 'Editar', onClick: (u) => router.push(`/usuarios/${u.id}/editar`) }]}
        />
      </div>
    </>
  );
}