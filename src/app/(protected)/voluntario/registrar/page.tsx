// src/app/(admin)/voluntario/registrar/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useCreateVolunteer } from '@/hooks/volunteers/useCreateVolunteer';

const COORDENADOR_ROLE = 'Coordenador de Pastoral';

export default function RegistrarVoluntarioPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: pastoralGroups = [] } = usePastoralGroups();
  const { mutateAsync: createVolunteer, isPending } = useCreateVolunteer();

  const isCoordenador = currentUser?.role.name === COORDENADOR_ROLE;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pastoralGroupId, setPastoralGroupId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // RN006: Coordenador só cadastra para a própria pastoral — trava o valor
  // assim que o usuário logado carrega.
  useEffect(() => {
    if (isCoordenador && currentUser?.pastoralGroup?.id) {
      setPastoralGroupId(String(currentUser.pastoralGroup.id));
    }
  }, [isCoordenador, currentUser]);

  function resetForm() {
    setName('');
    setPhone('');
    setEmail('');
    if (!isCoordenador) setPastoralGroupId('');
    setError(null);
  }

  function validate(): string | null {
    if (!name.trim()) return 'Informe o nome do voluntário.';
    if (!phone.trim()) return 'Informe o telefone do voluntário.';
    if (!pastoralGroupId) return 'Selecione a Pastoral.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await createVolunteer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        pastoralGroupId: Number(pastoralGroupId),
      });
      setSuccess(true);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar voluntário.');
    }
  }

  if (userLoading || !currentUser) {
    return null;
  }

  return (
    <>
      <Header
        title="Registrar Voluntário"
        description="Cadastre um novo voluntário para escalas da pastoral."
        actions={[
          {
            label: 'Voltar',
            onClick: () => router.back(),
          },
        ]}
      />

      <div className="mx-auto mt-8 max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">Telefone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">E-mail (opcional)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voluntario@exemplo.com"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">Pastoral</label>
            {isCoordenador ? (
              <input
                value={currentUser.pastoralGroup?.name ?? '—'}
                disabled
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            ) : (
              <select
                value={pastoralGroupId}
                onChange={(e) => setPastoralGroupId(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a4d8f]"
              >
                <option value="">Selecione a Pastoral</option>
                {pastoralGroups.map((pg) => (
                  <option key={pg.id} value={pg.id}>
                    {pg.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && (
            <p className="text-sm text-green-700">Voluntário cadastrado com sucesso.</p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-[#1a4d8f] px-4 py-2 text-sm font-medium text-white hover:bg-[#153e73] disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : 'Registrar Voluntário'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
