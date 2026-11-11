// src/app/(admin)/voluntario/registrar/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import FieldLabel from '@/components/ui/inputs/FieldLabel';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useCreateVolunteer } from '@/hooks/volunteers/useCreateVolunteer';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { errorMessage } from '@/lib/api-error';

const PHONE_REGEX = /^[0-9()+\-\s]{8,20}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default function RegistrarVoluntarioPage() {
  const router = useRouter();
  const createVolunteer = useCreateVolunteer();

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const isCoordenador = currentUser?.role.name === ROLE_NAMES.COORDENADOR;
  const ownPastoral = currentUser?.pastoralGroup ?? null;

  // Coordenador tem pastoral fixa (RN006): não precisa da lista
  const { data: pastoralGroups = [] } = usePastoralGroups({ enabled: !!currentUser && !isCoordenador });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pastoralId, setPastoralId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const effectivePastoralId = isCoordenador ? (ownPastoral ? String(ownPastoral.id) : '') : pastoralId;

  function validate(): string | null {
    if (!name.trim()) return 'Informe o nome do voluntário.';
    if (!PHONE_REGEX.test(phone.trim())) return 'Informe um telefone válido (ex: (47) 99999-9999).';
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) return 'E-mail inválido.';
    if (!effectivePastoralId) return 'Selecione a Pastoral.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await createVolunteer.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        pastoralGroupId: Number(effectivePastoralId),
      });
      router.push('/voluntario');
    } catch (err) {
      setError(errorMessage(err, 'Erro ao cadastrar voluntário.'));
    }
  }

  if (userLoading) return <p className="mt-8 text-sm text-gray-500">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-sm text-red-600">Sessão expirada. Faça login novamente.</p>;

  return (
    <>
      <Header
        title="Registrar Voluntário"
        description="Cadastre um novo voluntário para escalas da pastoral."
        onBack={() => router.back()}
      />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput label="Nome" value={name} onChange={setName} placeholder="Nome completo" required />
          <TextInput label="Telefone" type="tel" value={phone} onChange={setPhone} placeholder="(47) 99999-9999" required />
          <TextInput label="E-mail (opcional)" type="email" value={email} onChange={setEmail} placeholder="voluntario@exemplo.com" />

          {isCoordenador ? (
            <div>
              <FieldLabel label="Pastoral" />
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500">
                {ownPastoral?.name ?? '—'}
              </div>
            </div>
          ) : (
            <SelectInput
              label="Pastoral"
              value={pastoralId}
              onChange={setPastoralId}
              placeholder="Selecione a Pastoral"
              options={pastoralGroups.map((pg) => ({ value: String(pg.id), label: pg.name }))}
              required
            />
          )}

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <FormActions
            onCancel={() => router.push('/voluntario')}
            submitLabel="Registrar Voluntário"
            submitting={createVolunteer.isPending}
          />
        </form>
      </div>
    </>
  );
}