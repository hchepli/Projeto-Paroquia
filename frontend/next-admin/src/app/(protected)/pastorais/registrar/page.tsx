// src/app/(admin)/pastorais/registrar/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/inputs/TextInput';
import TextareaInput from '@/components/ui/inputs/TextareaInput';
import FormActions from '@/components/ui/buttons/FormActions';
import { useCreatePastoralGroup } from '@/hooks/pastoral-groups/usePastoralGroupMutations';
import { errorMessage } from '@/lib/api-error';

export default function RegistrarPastoralPage() {
  const router = useRouter();
  const createPastoral = useCreatePastoralGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [defaultRole, setDefaultRole] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Informe o nome da pastoral.');
      return;
    }

    try {
      // "" vira null no back (trimToNull)
      await createPastoral.mutateAsync({ name, description, contact, defaultRole });
      router.push('/pastorais');
    } catch (err) {
      setError(errorMessage(err, 'Erro ao cadastrar pastoral.'));
    }
  }

  return (
    <>
      <Header title="Nova Pastoral" description="Cadastre um novo grupo de atuação." onBack={() => router.back()} />

      <div className="py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput label="Nome" value={name} onChange={setName} placeholder="Ex: Catequese" required />
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
            submitLabel="Registrar Pastoral"
            submitting={createPastoral.isPending}
          />
        </form>
      </div>
    </>
  );
}