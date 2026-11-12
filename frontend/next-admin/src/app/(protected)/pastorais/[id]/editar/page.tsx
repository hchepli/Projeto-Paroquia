// src/app/(admin)/pastorais/[id]/editar/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import FieldLabel from '@/components/ui/inputs/FieldLabel';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { usePastoralGroup } from '@/hooks/pastoral-groups/usePastoralGroup';
import { useUpdatePastoralGroup } from '@/hooks/pastoral-groups/usePastoralGroupMutations';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { errorMessage } from '@/lib/api-error';
import { PastoralGroup } from '@/types/pastoral-groups/pastoral-group';

export default function EditarPastoralPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: pastoral, isLoading, error: loadError } = usePastoralGroup(id);

  if (userLoading || isLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (loadError || !pastoral) {
    return <p className="mt-8 text-base text-red-600">{errorMessage(loadError, 'Pastoral não encontrada.')}</p>;
  }

  const roleName = currentUser.role?.name;
  const isAdmin = roleName === ROLE_NAMES.ADMIN;
  const isCoordenador = roleName === ROLE_NAMES.COORDENADOR;
  const isOwnPastoral = pastoral.id === currentUser.pastoralGroup?.id;

  // Mesma regra do back: Admin edita todas; Coordenador só a própria; Secretaria só consulta
  if (!isAdmin && !(isCoordenador && isOwnPastoral)) {
    return <p className="mt-8 text-base text-red-600">Você não pode editar esta pastoral.</p>;
  }

  return <EditarPastoralConteudo pastoral={pastoral} isCoordenador={isCoordenador} />;
}

function EditarPastoralConteudo({
  pastoral,
  isCoordenador,
}: {
  pastoral: PastoralGroup;
  isCoordenador: boolean;
}) {
  const router = useRouter();
  const updatePastoral = useUpdatePastoralGroup(pastoral.id);

  const [name, setName] = useState(pastoral.name);
  const [description, setDescription] = useState(pastoral.description ?? '');
  const [contact, setContact] = useState(pastoral.contact ?? '');
  const [defaultRole, setDefaultRole] = useState(pastoral.defaultRole ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isCoordenador && !name.trim()) {
      setError('Escreva o nome da pastoral.');
      return;
    }

    try {
      // Coordenador não envia o nome (UC033; o back também bloqueia)
      await updatePastoral.mutateAsync(
        isCoordenador
          ? { description, contact, defaultRole }
          : { name, description, contact, defaultRole },
      );
      router.push('/pastorais');
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível salvar. Confira os dados e tente de novo.'));
    }
  }

  return (
    <>
      <Header title="Editar pastoral" description={pastoral.name} onBack={() => router.back()} />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isCoordenador ? (
            <div>
              <FieldLabel label="Nome" />
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-base text-gray-700">
                {pastoral.name}
              </div>
              <p className="mt-1 text-base text-gray-600">Só o administrador geral pode mudar o nome.</p>
            </div>
          ) : (
            <TextInput label="Nome" value={name} onChange={setName} required />
          )}

          <TextareaInput label="Descrição" value={description} onChange={setDescription} rows={4} />
          <TextInput label="Contato" value={contact} onChange={setContact} placeholder="Telefone ou e-mail" />
          <div>
            <TextInput
              label="Função padrão"
              value={defaultRole}
              onChange={setDefaultRole}
              placeholder="Ex: leitor, coroinha"
            />
            <p className="mt-1 text-base text-gray-600">
              Aparece já preenchida quando você coloca alguém desta pastoral numa escala. Você pode trocar na hora.
            </p>
          </div>

          {error && (
            <p role="alert" className="whitespace-pre-line text-base text-red-600">
              {error}
            </p>
          )}

          <FormActions
            onCancel={() => router.push('/pastorais')}
            submitLabel="Salvar alterações"
            submitting={updatePastoral.isPending}
          />
        </form>
      </div>
    </>
  );
}