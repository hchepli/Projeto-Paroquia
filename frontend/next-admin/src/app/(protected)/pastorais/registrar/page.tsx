// src/app/(admin)/pastorais/registrar/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useCreatePastoralGroup } from '@/hooks/pastoral-groups/usePastoralGroupMutations';
import { ROLE_NAMES } from '@/lib/constants/role-names';
import { errorMessage } from '@/lib/api-error';

export default function RegistrarPastoralPage() {
  const router = useRouter();
  const createPastoral = useCreatePastoralGroup();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [defaultRole, setDefaultRole] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Escreva o nome da pastoral.');
      return;
    }

    try {
      // "" vira null no back (trimToNull)
      await createPastoral.mutateAsync({ name, description, contact, defaultRole });
      router.push('/pastorais');
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível cadastrar. Confira os dados e tente de novo.'));
    }
  }

  if (userLoading) return <p className="mt-8 text-base text-gray-700">Carregando...</p>;
  if (!currentUser) return <p className="mt-8 text-base text-red-600">Sua sessão acabou. Entre de novo.</p>;
  if (currentUser.role?.name !== ROLE_NAMES.ADMIN) {
    return <p className="mt-8 text-base text-red-600">Só o administrador geral pode criar uma pastoral.</p>;
  }

  return (
    <>
      <Header title="Nova pastoral" description="Cadastre um novo grupo de atuação." onBack={() => router.back()} />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput label="Nome" value={name} onChange={setName} placeholder="Ex: Catequese" required />
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
            submitLabel="Cadastrar pastoral"
            submitting={createPastoral.isPending}
          />
        </form>
      </div>
    </>
  );
}