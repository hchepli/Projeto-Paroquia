'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import ConfirmDialog from '@/components/ui/forms/ConfirmDialog';
import UserForm, { UserFormValues } from '@/components/ui/forms/UserForm';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useUser } from '@/hooks/users/useUser';
import { useChangePassword, useUpdateUser } from '@/hooks/users/useUserMutations';
import { useRoles } from '@/hooks/roles/useRoles';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups'; // confirmar caminho
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { PASSWORD_RULES, passwordProblem } from '@/lib/users/password';
import {
  getPasswordSaveError, getUserSaveError, getUserStatusError, getUsersLoadError,
} from '@/lib/users/errors';

function Content() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const edit = useSearchParams().get('edit') === '1';

  const { data: me, isLoading: meLoading } = useCurrentUser();
  const allowed = me?.role?.name === ROLE_NAMES.ADMIN;
  const { data: user, isLoading, error: loadError } = useUser(allowed ? id : '');
  const { data: roles = [] } = useRoles({ enabled: allowed });
  const { data: pastorais = [] } = usePastoralGroups();

  const update = useUpdateUser(id);
  const changePassword = useChangePassword(id);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [askStatus, setAskStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passOk, setPassOk] = useState(false);

  if (meLoading || (allowed && isLoading)) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!me) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (!allowed) return <p role="alert" className="mt-8 text-base text-red-600">Você não tem acesso a esta página.</p>;
  if (loadError || !user) {
    return <p role="alert" className="mt-8 text-base text-red-600">{getUsersLoadError(loadError)}</p>;
  }

  const isActive = user.status === 'ACTIVE';
  const wasAdmin = user.role?.name === ROLE_NAMES.ADMIN;

  function save(v: UserFormValues) {
    setSaveError(null);
    const demoting = wasAdmin && roles.find((r) => r.id === v.roleId)?.name !== ROLE_NAMES.ADMIN;
    update.mutate(
      { name: v.name, email: v.email, roleId: v.roleId, pastoralGroupId: v.pastoralGroupId },
      {
        onSuccess: () => router.push(`/pessoas/usuarios/${id}`),
        onError: (e) => setSaveError(getUserSaveError(e, { demotingAdmin: demoting })),
      },
    );
  }

  function toggleStatus() {
    setStatusError(null);
    update.mutate(
      { status: isActive ? 'INACTIVE' : 'ACTIVE' },
      {
        onSuccess: () => setAskStatus(false),
        onError: (e) => setStatusError(getUserStatusError(e)),
      },
    );
  }

  function savePassword(e: React.SyntheticEvent) {
    e.preventDefault();
    setPassOk(false);
    const problem = passwordProblem(newPassword);
    if (problem) return setPassError(problem);
    setPassError(null);
    changePassword.mutate(newPassword, {
      onSuccess: () => { setNewPassword(''); setPassOk(true); },
      onError: (err) => setPassError(getPasswordSaveError(err)),
    });
  }

  return (
    <>
      <Header
        title={user.name}
        description={isActive ? 'Esta pessoa pode entrar no painel.' : 'Esta pessoa está desativada e não pode entrar.'}
        onBack={() => router.push('/pessoas/usuarios')}
        actions={[
          ...(!edit ? [{ label: 'Editar', onClick: () => router.push(`/pessoas/usuarios/${id}?edit=1`) }] : []),
          { label: isActive ? 'Desativar' : 'Reativar', onClick: () => { setStatusError(null); setAskStatus(true); } },
        ]}
      />

      <UserForm
        key={user.updatedAt}
        initial={user}
        roles={roles}
        pastorais={pastorais}
        readOnly={!edit}
        isSaving={update.isPending}
        error={saveError}
        submitLabel="Salvar"
        onSubmit={save}
        onCancel={() => router.push(`/pessoas/usuarios/${id}`)}
      />

      {edit && (
        <form onSubmit={savePassword} className="mt-10 max-w-xl space-y-3 border-t pt-6" noValidate>
          <h2 className="text-lg font-semibold">Trocar a senha</h2>
          <p id="np-help" className="text-sm text-gray-600">{PASSWORD_RULES}</p>
          <label htmlFor="np" className="text-base font-medium">Nova senha</label>
          <input id="np" type="password" autoComplete="new-password" aria-describedby="np-help"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} maxLength={72} />
          {!!passError && <p role="alert" className="text-base text-red-600">{passError}</p>}
          {passOk && <p role="status" className="text-base text-green-700">Senha trocada.</p>}
          <button type="submit" disabled={changePassword.isPending}
            className="rounded-lg border border-gray-300 px-5 py-3 text-base disabled:opacity-60">
            {changePassword.isPending ? 'Salvando...' : 'Trocar senha'}
          </button>
        </form>
      )}

      {askStatus && (
        <ConfirmDialog
          title={isActive ? 'Desativar esta pessoa?' : 'Reativar esta pessoa?'}
          message={isActive
            ? `${user.name} não vai mais conseguir entrar no painel. Você pode reativar depois.`
            : `${user.name} vai poder entrar no painel de novo.`}
          confirmLabel={isActive ? 'Desativar' : 'Reativar'}
          cancelLabel="Voltar"
          danger={isActive}
          isLoading={update.isPending}
          loadingLabel="Salvando..."
          error={statusError}
          onConfirm={toggleStatus}
          onCancel={() => setAskStatus(false)}
        />
      )}
    </>
  );
}

export default function UsuarioDetalhePage() {
  return (
    <Suspense fallback={<p className="mt-8 text-base text-gray-700">Carregando...</p>}>
      <Content />
    </Suspense>
  );
}