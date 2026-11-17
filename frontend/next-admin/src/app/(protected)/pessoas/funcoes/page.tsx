'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import ConfirmDialog from '@/components/ui/forms/ConfirmDialog';
import GenericTable, { GenericTableColumn } from '@/components/ui/tables/GenericTable';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useDeleteRole, useRoles, useSaveRole } from '@/hooks/roles/useRoles';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { getRoleDeleteError, getRoleSaveError, getUsersLoadError } from '@/lib/users/errors';
import { Role } from '@/types/roles/role';

const columns: GenericTableColumn<Role>[] = [
  { key: 'name', label: 'Função', render: (r) => r.name },
  { key: 'desc', label: 'O que faz', render: (r) => r.description ?? '—' },
  { key: 'users', label: 'Pessoas', render: (r) => String(r._count.users) },
  { key: 'base', label: 'Tipo', render: (r) => (r.isBase ? 'Original do sistema' : 'Criada por você') },
];

const field = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base disabled:bg-gray-100';

export default function FuncoesPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const allowed = me?.role?.name === ROLE_NAMES.ADMIN;
  const { data: roles = [], isLoading, error: loadError } = useRoles({ enabled: allowed });
  const save = useSaveRole();
  const remove = useDeleteRole();

  const [editing, setEditing] = useState<Role | 'new' | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  if (meLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!me) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (!allowed) return <p role="alert" className="mt-8 text-base text-red-600">Você não tem acesso a esta página.</p>;

  function open(target: Role | 'new') {
    setEditing(target);
    setName(target === 'new' ? '' : target.name);
    setDescription(target === 'new' ? '' : target.description ?? '');
    setFormError(null);
  }

  function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    const isBase = editing !== 'new' && editing?.isBase;
    if (!name.trim()) return setFormError('Escreva o nome da função.');
    setFormError(null);
    save.mutate(
      {
        id: editing && editing !== 'new' ? editing.id : undefined,
        input: { ...(isBase ? {} : { name: name.trim() }), description: description.trim() },
      },
      { onSuccess: () => setEditing(null), onError: (err) => setFormError(getRoleSaveError(err)) },
    );
  }

  function askDelete(r: Role) {
    setDeleteError(null);
    if (r._count.users > 0) {
      setBlocked(`A função "${r.name}" ainda tem ${r._count.users} pessoa(s). Mude a função delas antes de apagar.`);
      return;
    }
    setBlocked(null);
    setToDelete(r);
  }

  function confirmDelete() {
    if (!toDelete) return;
    remove.mutate(
      { id: toDelete.id, confirmBase: toDelete.isBase },
      { onSuccess: () => setToDelete(null), onError: (err) => setDeleteError(getRoleDeleteError(err)) },
    );
  }

  const baseEdit = editing && editing !== 'new' && editing.isBase;

  return (
    <>
      <Header
        title="Funções"
        description="O que cada pessoa pode fazer no painel."
        onBack={() => router.push('/pessoas/usuarios')}
        actions={[{ label: 'Criar função', onClick: () => open('new') }]}
      />

      <p className="mt-4 max-w-2xl text-base text-gray-700">
        Atenção: uma função nova ainda não dá acesso a nenhuma área. Peça ao responsável pelo sistema para liberar o que ela pode fazer.
      </p>

      {!!loadError && <p role="alert" className="mt-4 text-base text-red-600">{getUsersLoadError(loadError)}</p>}
      {!!blocked && <p role="alert" className="mt-4 text-base text-red-600">{blocked}</p>}

      {editing && (
        <form onSubmit={submit} className="mt-6 max-w-xl space-y-4 rounded-lg border border-gray-200 p-4" noValidate>
          <h2 className="text-lg font-semibold">{editing === 'new' ? 'Criar função' : 'Editar função'}</h2>
          <div>
            <label htmlFor="r-name" className="text-base font-medium">Nome</label>
            <input id="r-name" className={field} value={name} maxLength={60} disabled={!!baseEdit}
              onChange={(e) => setName(e.target.value)} />
            {baseEdit && <p className="text-sm text-gray-600">Funções originais do sistema não mudam de nome.</p>}
          </div>
          <div>
            <label htmlFor="r-desc" className="text-base font-medium">O que esta função faz</label>
            <input id="r-desc" className={field} value={description} maxLength={255}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
          {!!formError && <p role="alert" className="text-base text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={save.isPending}
              className="rounded-lg bg-blue-700 px-5 py-3 text-base font-medium text-white disabled:opacity-60">
              {save.isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setEditing(null)}
              className="rounded-lg border border-gray-300 px-5 py-3 text-base">Cancelar</button>
          </div>
        </form>
      )}

      <div className="my-6">
        <GenericTable
          columns={columns}
          items={roles}
          rowKey={(r) => String(r.id)}
          isLoading={isLoading}
          emptyMessage="Ainda não há funções."
          actions={[
            { label: 'Editar', onClick: (r) => open(r) },
            { label: 'Apagar', onClick: (r) => askDelete(r) },
          ]}
        />
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Apagar esta função?"
          message={toDelete.isBase
            ? `"${toDelete.name}" é uma função original do sistema. Se você apagar, o painel pode parar de funcionar para quem depende dela. Tem certeza?`
            : `A função "${toDelete.name}" será apagada.`}
          confirmLabel="Apagar"
          cancelLabel="Voltar"
          danger
          isLoading={remove.isPending}
          loadingLabel="Apagando..."
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}