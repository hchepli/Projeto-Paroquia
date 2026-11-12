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
import { ApiError, errorMessage } from '@/lib/api-error';
import { formatPhone, isValidPhone, onlyDigits } from '@/lib/phone-mask';
import { VolunteerAssignment, describeAssignments } from '@/lib/volunteer-assignments';
import { Volunteer } from '@/types/volunteers/volunteer';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default function EditarVoluntarioPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: volunteer, isLoading, error: loadError } = useVolunteer(id);

  if (userLoading || isLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (loadError || !volunteer) {
    return <p className="mt-8 text-base text-red-600">{errorMessage(loadError, 'Voluntário não encontrado.')}</p>;
  }

  return (
    <EditarVoluntarioConteudo
      volunteer={volunteer}
      isCoordenador={currentUser.role?.name === ROLE_NAMES.COORDENADOR}
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
  // Número antigo com mais de 11 dígitos (ex: +55...) fica como está até a pessoa mexer nele
  const [phone, setPhone] = useState(
    onlyDigits(volunteer.phone).length <= 11 ? formatPhone(volunteer.phone) : volunteer.phone,
  );
  const [email, setEmail] = useState(volunteer.email ?? '');
  const [pastoralId, setPastoralId] = useState(String(volunteer.pastoralGroupId));
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return 'Escreva o nome do voluntário.';
    if (!isValidPhone(phone)) return 'Escreva o telefone com DDD. Exemplo: (47) 99999-9999.';
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) return 'Confira o e-mail. Exemplo: nome@exemplo.com.';
    if (!pastoralId) return 'Escolha a pastoral do voluntário.';
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
        // Coordenador nunca muda a pastoral (RN006): nem envia o campo
        ...(isCoordenador ? {} : { pastoralGroupId: Number(pastoralId) }),
      });
      router.push('/voluntario');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Você só pode mexer em voluntários da sua pastoral.');
        return;
      }
      // 409: voluntário em escalas futuras, não pode trocar de pastoral
      if (err instanceof ApiError && err.status === 409 && Array.isArray(err.body?.assignments)) {
        const list = err.body.assignments as VolunteerAssignment[];
        setError(
          `Não dá para mudar a pastoral enquanto a pessoa estiver em escalas que ainda vão acontecer. Tire ${volunteer.name} destas escalas primeiro:\n\n${describeAssignments(list)}`,
        );
        return;
      }
      setError(errorMessage(err, 'Não foi possível salvar. Confira os dados e tente de novo.'));
    }
  }

  return (
    <>
      <Header title="Editar voluntário" description={volunteer.name} onBack={() => router.back()} />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput label="Nome" value={name} onChange={setName} required />
          <TextInput
            label="Telefone"
            type="tel"
            value={phone}
            onChange={(v) => setPhone(formatPhone(v))}
            placeholder="(47) 99999-9999"
            required
          />
          <TextInput label="E-mail (não é obrigatório)" type="email" value={email} onChange={setEmail} />

          {isCoordenador ? (
            <div>
              <FieldLabel label="Pastoral" />
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-base text-gray-700">
                {volunteer.pastoralGroup?.name ?? '—'}
              </div>
            </div>
          ) : (
            <div>
              <SelectInput
                label="Pastoral"
                value={pastoralId}
                onChange={setPastoralId}
                placeholder="Escolha a pastoral"
                options={pastoralGroups.map((pg) => ({ value: String(pg.id), label: pg.name }))}
                required
              />
              <p className="mt-1 text-base text-gray-600">
                Só dá para mudar a pastoral se a pessoa não estiver em escalas que ainda vão acontecer.
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="whitespace-pre-line text-base text-red-600">
              {error}
            </p>
          )}

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