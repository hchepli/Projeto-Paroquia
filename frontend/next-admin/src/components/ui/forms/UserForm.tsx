'use client';

import { useState } from 'react';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { PASSWORD_RULES, passwordProblem } from '@/lib/users/password';
import { Role } from '@/types/roles/role';
import { User } from '@/types/users/user';

export interface UserFormValues {
  name: string;
  email: string;
  password?: string;
  roleId: number;
  pastoralGroupId: number | null;
}

interface Props {
  initial?: User;
  roles: Role[];
  pastorais: { id: number; name: string }[];
  readOnly?: boolean;
  isSaving?: boolean;
  error?: string | null;
  submitLabel: string;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}

const field = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base disabled:bg-gray-100';

export default function UserForm({
  initial, roles, pastorais, readOnly, isSaving, error, submitLabel, onSubmit, onCancel,
}: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number | ''>(initial?.roleId ?? '');
  const [pastoralId, setPastoralId] = useState<number | ''>(initial?.pastoralGroupId ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const isCreate = !initial;
  const selectedRole = roles.find((r) => r.id === roleId);
  const isCoordinator = selectedRole?.name === ROLE_NAMES.COORDENADOR;

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!name.trim()) return setFormError('Escreva o nome.');
    if (!email.trim()) return setFormError('Escreva o e-mail.');
    if (roleId === '') return setFormError('Escolha a função.');
    if (isCoordinator && pastoralId === '') return setFormError('Escolha a pastoral desta pessoa.');
    if (isCreate) {
      const problem = passwordProblem(password);
      if (problem) return setFormError(problem);
    }
    setFormError(null);
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password: isCreate ? password : undefined,
      roleId,
      pastoralGroupId: isCoordinator && pastoralId !== '' ? pastoralId : null,
    });
  }

  const shownError = formError ?? error;

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-5" noValidate>
      <div>
        <label htmlFor="u-name" className="text-base font-medium">Nome</label>
        <input id="u-name" className={field} value={name} disabled={readOnly}
          onChange={(e) => setName(e.target.value)} maxLength={150} />
      </div>

      <div>
        <label htmlFor="u-email" className="text-base font-medium">E-mail</label>
        <input id="u-email" type="email" className={field} value={email} disabled={readOnly}
          onChange={(e) => setEmail(e.target.value)} maxLength={180} />
      </div>

      {isCreate && (
        <div>
          <label htmlFor="u-pass" className="text-base font-medium">Senha</label>
          <p id="u-pass-help" className="text-sm text-gray-600">{PASSWORD_RULES}</p>
          <input id="u-pass" type="password" className={field} value={password}
            aria-describedby="u-pass-help" autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)} maxLength={72} />
        </div>
      )}

      <div>
        <label htmlFor="u-role" className="text-base font-medium">Função</label>
        <select id="u-role" className={field} value={roleId} disabled={readOnly}
          onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Escolha...</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {isCoordinator && (
        <div>
          <label htmlFor="u-pastoral" className="text-base font-medium">Pastoral</label>
          <select id="u-pastoral" className={field} value={pastoralId} disabled={readOnly}
            onChange={(e) => setPastoralId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Escolha...</option>
            {pastorais.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {!!shownError && <p role="alert" className="text-base text-red-600">{shownError}</p>}

      {!readOnly && (
        <div className="flex gap-3">
          <button type="submit" disabled={isSaving}
            className="rounded-lg bg-blue-700 px-5 py-3 text-base font-medium text-white disabled:opacity-60">
            {isSaving ? 'Salvando...' : submitLabel}
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-gray-300 px-5 py-3 text-base">Cancelar</button>
        </div>
      )}
    </form>
  );
}