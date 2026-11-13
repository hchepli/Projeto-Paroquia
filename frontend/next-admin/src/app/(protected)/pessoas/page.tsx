// src/app/(admin)/pessoas/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandHeart, Church, UserCog, UserCheck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/cards/Card';
import GenericTable, { GenericTableColumn } from '@/components/ui/tables/GenericTable';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useVolunteers } from '@/hooks/volunteers/useVolunteers';
import { useUsers } from '@/hooks/users/useUsers';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { errorMessage } from '@/lib/api-error';
import { HeaderAction } from '@/components/ui/buttons/ActionButton';

// Quem vê Usuários. O users.controller do back precisa liberar os mesmos cargos.
const USERS_ROLES: string[] = [ROLE_NAMES.ADMIN, ROLE_NAMES.SECRETARIA];

type Kind = 'VOLUNTARIO' | 'USUARIO';

interface PersonRow {
  key: string;
  id: string | number;
  kind: Kind;
  name: string;
  contact: string;
  pastoral: string;
}

const columns: GenericTableColumn<PersonRow>[] = [
  { key: 'name', label: 'Nome', render: (p) => p.name },
  { key: 'kind', label: 'Tipo', render: (p) => (p.kind === 'VOLUNTARIO' ? 'Voluntário' : 'Usuário') },
  { key: 'contact', label: 'Contato', render: (p) => p.contact },
  { key: 'pastoral', label: 'Pastoral', render: (p) => p.pastoral },
];

export default function PessoasPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const roleName = currentUser?.role?.name;

  const isCoordenador = roleName === ROLE_NAMES.COORDENADOR;
  const canSeeUsers = !!roleName && USERS_ROLES.includes(roleName);
  const coordenadorSemPastoral = isCoordenador && !currentUser?.pastoralGroup;

  const { data: volunteers = [], isLoading: volLoading, error: volError } = useVolunteers();
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers({
    enabled: !!currentUser && canSeeUsers,
  });

  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('');

  const rows = useMemo<PersonRow[]>(() => {
    const vols: PersonRow[] = volunteers.map((v) => ({
      key: `v-${v.id}`,
      id: v.id,
      kind: 'VOLUNTARIO',
      name: v.name,
      contact: v.phone,
      pastoral: v.pastoralGroup?.name ?? '—',
    }));
    const usrs: PersonRow[] = canSeeUsers
      ? users.map((u) => ({
          key: `u-${u.id}`,
          id: u.id,
          kind: 'USUARIO',
          name: u.name,
          contact: u.email,
          pastoral: u.pastoralGroup?.name ?? '—',
        }))
      : [];

    const term = search.trim().toLowerCase();
    return [...vols, ...usrs]
      .filter((r) => !kindFilter || r.kind === kindFilter)
      .filter((r) => !term || [r.name, r.contact, r.pastoral].some((f) => f.toLowerCase().includes(term)))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [volunteers, users, canSeeUsers, search, kindFilter]);

  if (userLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;

  const pastoraisComVoluntarios = new Set(volunteers.map((v) => v.pastoralGroupId)).size;
  const usuariosAtivos = users.filter((u) => u.status === 'ATIVO').length;

const actions: HeaderAction[] = [
  ...(coordenadorSemPastoral
    ? []
    : [{ label: 'Cadastrar voluntário', onClick: () => router.push('/voluntario/registrar') }]),
  ...(canSeeUsers ? [{ label: 'Cadastrar usuário', onClick: () => router.push('/usuarios/registrar') }] : []),
  { label: 'Ver voluntários', kind: 'navigate', onClick: () => router.push('/pessoas/voluntarios') },
  ...(canSeeUsers
    ? [{ label: 'Ver usuários', kind: 'navigate' as const, onClick: () => router.push('/pessoas/usuarios') }]
    : []),
];

  const loadError = volError ?? usersError;
  const emptyMessage = coordenadorSemPastoral
    ? 'Seu acesso ainda não está ligado a uma pastoral. Peça ao administrador para ligar.'
    : search.trim() || kindFilter
      ? 'Ninguém encontrado. Tente buscar com outras palavras.'
      : 'Ainda não há pessoas cadastradas.';

  return (
    <>
      <Header
        title="Pessoas"
        description={
          canSeeUsers
            ? 'Quem ajuda na paróquia e quem tem acesso a este painel.'
            : 'Quem ajuda nas missas e eventos.'
        }
        actions={actions}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          icon={HandHeart}
          title={isCoordenador ? `Voluntários de ${currentUser.pastoralGroup?.name ?? '—'}` : 'Voluntários'}
          value={volunteers.length}
          description="Pessoas que entram nas escalas"
          onClick={() => router.push('/pessoas/voluntarios')}
          actionLabel="Ver voluntários"
        />
        {!isCoordenador && (
          <Card
            icon={Church}
            title="Pastorais com voluntários"
            value={pastoraisComVoluntarios}
            description="Pastorais que já têm gente cadastrada"
          />
        )}
        {canSeeUsers && (
          <>
            <Card
              icon={UserCog}
              title="Usuários"
              value={users.length}
              description="Pessoas que entram neste painel"
              onClick={() => router.push('/pessoas/usuarios')}
              actionLabel="Ver usuários"
            />
            <Card
              icon={UserCheck}
              title="Usuários ativos"
              value={usuariosAtivos}
              badge={`${users.length - usuariosAtivos} desativado(s)`}
              badgeColor={users.length - usuariosAtivos > 0 ? 'yellow' : 'green'}
            />
          </>
        )}
      </div>

      {!!loadError && (
        <p role="alert" className="mt-4 text-base text-red-600">
          {errorMessage(loadError, 'Não foi possível carregar a lista. Tente de novo em instantes.')}
        </p>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={rows}
          rowKey={(r) => r.key}
          isLoading={volLoading || (canSeeUsers && usersLoading)}
          emptyMessage={emptyMessage}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nome, contato ou pastoral..."
          filters={
            canSeeUsers
              ? [
                  {
                    key: 'kind',
                    placeholder: 'Todos',
                    value: kindFilter,
                    onChange: setKindFilter,
                    options: [
                      { value: '', label: 'Todos' },
                      { value: 'VOLUNTARIO', label: 'Só voluntários' },
                      { value: 'USUARIO', label: 'Só usuários' },
                    ],
                  },
                ]
              : undefined
          }
          actions={[
            {
              label: 'Editar',
              onClick: (r) =>
                router.push(r.kind === 'VOLUNTARIO' ? `/voluntario/${r.id}/editar` : `/usuarios/${r.id}/editar`),
            },
          ]}
        />
      </div>
    </>
  );
}