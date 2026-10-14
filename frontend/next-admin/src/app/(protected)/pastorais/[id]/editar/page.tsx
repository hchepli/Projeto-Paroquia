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

  if (userLoading || isLoading) return <p className="mt-8 text-sm text-gray-500">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-sm text-red-600">Sessão expirada. Faça login novamente.</p>;
  if (loadError || !pastoral) {
    return <p className="mt-8 text-sm text-red-600">{errorMessage(loadError, 'Pastoral não encontrada.')}</p>;
  }

  return (
    <EditarPastoralConteudo
      pastoral={pastoral}
      isCoordenador={currentUser.role.name === ROLE_NAMES.COORDENADOR}
    />
  );
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
      setError('Informe o nome da pastoral.');
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
      setError(errorMessage(err, 'Erro ao atualizar pastoral.'));
    }
  }

  return (
    <>
      <Header title="Editar Pastoral" description={pastoral.name} onBack={() => router.back()} />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isCoordenador ? (
            <div>
              <FieldLabel label="Nome" />
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500">
                {pastoral.name}
              </div>
            </div>
          ) : (
            <TextInput label="Nome" value={name} onChange={setName} required />
          )}

          <TextareaInput label="Descrição" value={description} onChange={setDescription} rows={4} />
          <TextInput label="Contato" value={contact} onChange={setContact} placeholder="Telefone ou e-mail" />
          <TextInput
            label="Função padrão nas escalas"
            value={defaultRole}
            onChange={setDefaultRole}
            placeholder="Ex: leitor, coroinha"
          />

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

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