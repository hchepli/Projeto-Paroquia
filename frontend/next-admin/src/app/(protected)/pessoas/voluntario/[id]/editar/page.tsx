// src/app/(admin)/voluntario/[id]/editar/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import SelectInput from '@/components/ui/inputs/SelectInput';
import FieldLabel from '@/components/ui/inputs/FieldLabel';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { usePastoralGroups } from '@/hooks/pastoral-groups/usePastoralGroups';
import { useVolunteer } from '@/hooks/volunteers/useVolunteer';
import { useUpdateVolunteer } from '@/hooks/volunteers/useVolunteerMutations';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { errorMessage } from '@/lib/api-error';
import { Volunteer } from '@/types/volunteers/volunteer';

const PHONE_REGEX = /^[0-9()+\-\s]{8,20}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default function EditarVoluntarioPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: volunteer, isLoading, error: loadError } = useVolunteer(id);

  if (userLoading || isLoading) return <p className="mt-8 text-sm text-gray-500">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-sm text-red-600">Sessão expirada. Faça login novamente.</p>;
  if (loadError || !volunteer) {
    return <p className="mt-8 text-sm text-red-600">{errorMessage(loadError, 'Voluntário não encontrado.')}</p>;
  }

  return (
    <EditarVoluntarioConteudo
      volunteer={volunteer}
      isCoordenador={currentUser.role.name === ROLE_NAMES.COORDENADOR}
    />
  );
}

// Só roda depois que os dados chegaram, então os campos já nascem preenchidos.
function EditarVoluntarioConteudo({
  volunteer,
  isCoordenador,
}: {
  volunteer: Volunteer;
  isCoordenador: boolean;
}) {
  const router = useRouter();
  const updateVolunteer = useUpdateVolunteer(volunteer.id);
  const { data: pastoralGroups = [] } = usePastoralGroups({ enabled: !isCoordenador });

  const [name, setName] = useState(volunteer.name);
  const [phone, setPhone] = useState(volunteer.phone);
  const [email, setEmail] = useState(volunteer.email ?? '');
  const [pastoralId, setPastoralId] = useState(String(volunteer.pastoralGroupId));
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return 'Informe o nome do voluntário.';
    if (!PHONE_REGEX.test(phone.trim())) return 'Informe um telefone válido (ex: (47) 99999-9999).';
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) return 'E-mail inválido.';
    if (!pastoralId) return 'Selecione a Pastoral.';
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
      await updateVolunteer.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null, // null limpa o campo no back
        pastoralGroupId: Number(pastoralId),
      });
      router.push('/voluntario');
    } catch (err) {
      // 409 de "escala futura" já vem com a mensagem pronta do back
      setError(errorMessage(err, 'Erro ao atualizar voluntário.'));
    }
  }

  return (
    <>
      <Header title="Editar Voluntário" description={volunteer.name} onBack={() => router.back()} />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput label="Nome" value={name} onChange={setName} required />
          <TextInput label="Telefone" type="tel" value={phone} onChange={setPhone} required />
          <TextInput label="E-mail (opcional)" type="email" value={email} onChange={setEmail} />

          {isCoordenador ? (
            <div>
              <FieldLabel label="Pastoral" />
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500">
                {volunteer.pastoralGroup?.name ?? '—'}
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
            submitLabel="Salvar alterações"
            submitting={updateVolunteer.isPending}
          />
        </form>
      </div>
    </>
  );
}