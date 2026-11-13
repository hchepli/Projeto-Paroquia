// src/components/pessoas/UsersSection.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import GenericTable, { GenericTableColumn } from '@/components/ui/tables/GenericTable';
import { errorMessage } from '@/lib/api-error';
import { User } from '../../../types/users/user';

const columns: GenericTableColumn<User>[] = [
  { key: 'name', label: 'Nome', render: (u) => u.name },
  { key: 'email', label: 'E-mail', render: (u) => u.email },
  { key: 'role', label: 'Função', render: (u) => u.role?.name ?? '—' },
  { key: 'pastoral', label: 'Pastoral', render: (u) => u.pastoralGroup?.name ?? '—' },
  { key: 'status', label: 'Situação', render: (u) => (u.status === 'ATIVO' ? 'Ativo' : 'Desativado') },
];

interface Props {
  users: User[];
  isLoading: boolean;
  error: unknown;
}

export default function UsersSection({ users, isLoading, error }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => [u.name, u.email].some((f) => f.toLowerCase().includes(term)));
  }, [users, search]);

  return (
    <section className="my-8">
      <h2 className="mb-3 text-xl font-semibold text-gray-900">Usuários do painel</h2>

      {!!error && (
        <p role="alert" className="mb-3 text-base text-red-600">
          {errorMessage(error, 'Não foi possível carregar os usuários. Tente de novo em instantes.')}
        </p>
      )}

      <GenericTable
        columns={columns}
        items={items}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        emptyMessage={
          search.trim()
            ? 'Nenhum usuário encontrado. Tente buscar com outras palavras.'
            : 'Ainda não há usuários cadastrados.'
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou e-mail..."
        actions={[{ label: 'Editar', onClick: (u) => router.push(`/usuarios/${u.id}/editar`) }]}
      />
    </section>
  );
}