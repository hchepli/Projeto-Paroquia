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
import { ApiError, errorMessage } from '@/lib/api-error';
import { formatPhone, isValidPhone } from '@/lib/phone-mask';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default function RegistrarVoluntarioPage() {
  const router = useRouter();
  const createVolunteer = useCreateVolunteer();

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const isCoordenador = currentUser?.role?.name === ROLE_NAMES.COORDENADOR;
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
    if (!name.trim()) return 'Escreva o nome do voluntário.';
    if (!isValidPhone(phone)) return 'Escreva o telefone com DDD. Exemplo: (47) 99999-9999.';
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) return 'Confira o e-mail. Exemplo: nome@exemplo.com.';
    if (!effectivePastoralId) return 'Escolha a pastoral do voluntário.';
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
      if (err instanceof ApiError && err.status === 403) {
        setError('Você só pode cadastrar voluntários da sua pastoral.');
        return;
      }
      setError(errorMessage(err, 'Não foi possível cadastrar. Confira os dados e tente de novo.'));
    }
  }

  if (userLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (isCoordenador && !ownPastoral) {
    return (
      <p className="mt-8 text-base text-red-600">
        Seu acesso ainda não está ligado a uma pastoral. Peça ao administrador para ligar.
      </p>
    );
  }

  return (
    <>
      <Header
        title="Cadastrar voluntário"
        description="Cadastre alguém que pode ser colocado nas escalas da pastoral."
        onBack={() => router.back()}
      />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput label="Nome" value={name} onChange={setName} placeholder="Nome completo" required />
          <TextInput
            label="Telefone"
            type="tel"
            value={phone}
            onChange={(v) => setPhone(formatPhone(v))}
            placeholder="(47) 99999-9999"
            required
          />
          <TextInput
            label="E-mail (não é obrigatório)"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="nome@exemplo.com"
          />

          {isCoordenador ? (
            <div>
              <FieldLabel label="Pastoral" />
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-base text-gray-700">
                {ownPastoral?.name ?? '—'}
              </div>
              <p className="mt-1 text-base text-gray-600">Você só pode cadastrar voluntários da sua pastoral.</p>
            </div>
          ) : (
            <SelectInput
              label="Pastoral"
              value={pastoralId}
              onChange={setPastoralId}
              placeholder="Escolha a pastoral"
              options={pastoralGroups.map((pg) => ({ value: String(pg.id), label: pg.name }))}
              required
            />
          )}

          {error && (
            <p role="alert" className="whitespace-pre-line text-base text-red-600">
              {error}
            </p>
          )}

          <FormActions
            onCancel={() => router.push('/voluntario')}
            submitLabel="Cadastrar voluntário"
            submitting={createVolunteer.isPending}
          />
        </form>
      </div>
    </>
  );
}