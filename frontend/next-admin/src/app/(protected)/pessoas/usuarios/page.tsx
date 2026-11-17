'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, UserX } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, { GenericTableColumn } from '@/components/ui/tables/GenericTable';
import PaginationControls from '@/components/ui/buttons/PaginationControls'; // ajuste o caminho real
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useUsers } from '@/hooks/users/useUsers';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { getUsersLoadError } from '@/lib/users/errors';
import { User, UserStatus } from '@/types/users/user';

const PAGE_SIZE = 10;

const columns: GenericTableColumn<User>[] = [
  { key: 'name', label: 'Nome', render: (u) => u.name },
  { key: 'email', label: 'E-mail', render: (u) => u.email },
  { key: 'role', label: 'Função', render: (u) => u.role?.name ?? '—' },
  { key: 'pastoral', label: 'Pastoral', render: (u) => u.pastoralGroup?.name ?? '—' },
  { key: 'status', label: 'Situação', render: (u) => (u.status === 'ACTIVE' ? 'Ativo' : 'Desativado') },
];

export default function PessoasUsuariosPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const allowed = currentUser?.role?.name === ROLE_NAMES.ADMIN;

  const { data: users = [], isLoading, error: loadError } = useUsers({ enabled: allowed });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | UserStatus>('');
  const [page, setPage] = useState(1);

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter && u.status !== statusFilter) return false;
      return !term || [u.name, u.email].some((f) => f.toLowerCase().includes(term));
    });
  }, [users, search, statusFilter]);

  if (userLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (!allowed) {
    return <p role="alert" className="mt-8 text-base text-red-600">Só quem tem acesso total pode ver os usuários.</p>;
  }

  const active = users.filter((u) => u.status === 'ACTIVE').length;
  const hasFilter = search.trim() !== '' || statusFilter !== '';
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function filterBy(value: '' | UserStatus) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <>
      <Header
        title="Usuários"
        description="Pessoas que entram neste painel."
        onBack={() => router.push('/pessoas')}
        actions={[
          { label: 'Cadastrar usuário', onClick: () => router.push('/pessoas/usuarios/registrar') },
          { label: 'Ver funções', kind: 'navigate', onClick: () => router.push('/pessoas/funcoes') },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card icon={Users} title="Todos" value={users.length} description="Mostrar todos"
          onClick={() => filterBy('')} />
        <Card icon={UserCheck} title="Ativos" value={active} description="Mostrar só os ativos"
          onClick={() => filterBy('ACTIVE')} />
        <Card icon={UserX} title="Desativados" value={users.length - active} description="Mostrar só os desativados"
          onClick={() => filterBy('INACTIVE')} />
      </div>

      {!!loadError && (
        <p role="alert" className="mt-4 text-base text-red-600">{getUsersLoadError(loadError)}</p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={pageItems}
          rowKey={(u) => u.id}
          isLoading={isLoading}
          emptyMessage={hasFilter
            ? 'Nenhum usuário encontrado. Tente buscar com outras palavras.'
            : 'Ainda não há usuários cadastrados.'}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Buscar por nome ou e-mail..."
          actions={[
            { label: 'Ver', onClick: (u) => router.push(`/pessoas/usuarios/${u.id}`) },
            { label: 'Editar', onClick: (u) => router.push(`/pessoas/usuarios/${u.id}?edit=1`) },
          ]}
        />
        <PaginationControls page={current} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}