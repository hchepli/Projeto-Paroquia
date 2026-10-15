'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/modals/Modal';
import { useMassTemplates } from '@/hooks/masses/useMassTemplates';
import { useUpdateMassTemplate } from '@/hooks/masses/useUpdateMassTemplate';
import { usePermissions } from '@/hooks/auth/usePermissions';
import { getErrorMessage } from '@/lib/errors';
import { MASS_TYPE_LABELS, WEEKDAY_LABELS } from '@/lib/masses/constants';
import { MassTemplate } from '@/types/masses/mass-template';
import { MassType } from '@/types/masses/masses';

interface EditingState {
  id: number;
  title: string;
  location: string;
  type: MassType;
  notes: string;
}

export default function MissasRecorrentesPage() {
  const router = useRouter();
  const { canManageMasses, isLoading: loadingPermissions } = usePermissions();
  const {
    data: templates,
    isLoading,
    isError,
    error: loadError,
    refetch,
  } = useMassTemplates({ enabled: canManageMasses });
  const updateTemplate = useUpdateMassTemplate();

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<MassTemplate | null>(null);
  const [removeFuture, setRemoveFuture] = useState(false);

  function startEdit(template: MassTemplate) {
    setError(null);
    setNotice(null);
    setEditing({
      id: template.id,
      title: template.title,
      location: template.location,
      type: template.type,
      notes: template.notes ?? '',
    });
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.location.trim()) {
      setError('Título e local são obrigatórios.');
      return;
    }
    setError(null);
    try {
      await updateTemplate.mutateAsync({
        id: editing.id,
        // dayOfWeek e time NÃO são enviados: o back responde 400.
        data: {
          title: editing.title.trim(),
          location: editing.location.trim(),
          type: editing.type,
          notes: editing.notes.trim(),
        },
      });
      setEditing(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar.'));
    }
  }

  async function reactivate(template: MassTemplate) {
    setError(null);
    setNotice(null);
    try {
      await updateTemplate.mutateAsync({ id: template.id, data: { active: true } });
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao reativar.'));
    }
  }

  function askDeactivate(template: MassTemplate) {
    setError(null);
    setNotice(null);
    setRemoveFuture(false);
    setDeactivating(template);
  }

  async function confirmDeactivate() {
    if (!deactivating) return;
    try {
      const result = await updateTemplate.mutateAsync({
        id: deactivating.id,
        data: { active: false },
        removeFuture,
      });
      setNotice(
        removeFuture
          ? `Template desativado. ${result.removed ?? 0} ocorrência(s) futura(s) removida(s); ${
              result.keptWithSchedule ?? 0
            } mantida(s) por já terem escala.`
          : 'Template desativado. As ocorrências já geradas foram mantidas.',
      );
      setDeactivating(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao desativar.'));
      setDeactivating(null);
    }
  }

  if (!loadingPermissions && !canManageMasses) {
    return (
      <>
        <Header title="Missas Recorrentes" description="Acesso restrito." />
        <p className="mt-6 text-sm text-gray-600">
          Seu cargo não tem permissão para gerenciar missas recorrentes.
        </p>
      </>
    );
  }

  const busy = updateTemplate.isPending;

  return (
    <>
      <Header
        title="Missas Recorrentes"
        description="Gerencie as missas que se repetem semanalmente."
        actions={[
          {
            label: 'Adicionar Missa',
            onClick: () => router.push('/calendario/nova-missa?recorrente=1'),
          },
        ]}
      />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-green-700">{notice}</p>}

      <p className="mt-4 text-xs text-gray-500">
        Para mudar o dia ou o horário de uma recorrência, crie uma nova e desative esta.
      </p>

      <div className="mt-3 overflow-hidden rounded-[16px] border border-[rgba(0,0,0,0.1)]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[13px] font-medium text-gray-600">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Dia da semana</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(isLoading || loadingPermissions) && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            )}

            {isError && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-red-600">
                  {getErrorMessage(loadError, 'Erro ao buscar missas recorrentes.')}{' '}
                  <button onClick={() => refetch()} className="underline">
                    Tentar novamente
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !isError && (!templates || templates.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Nenhuma missa recorrente cadastrada. Clique em "Adicionar Missa".
                </td>
              </tr>
            )}

            {templates?.map((template) => {
              const isEditingThis = editing?.id === template.id;

              return (
                <tr key={template.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={editing.title}
                          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                          aria-label="Título"
                        />
                        <input
                          value={editing.notes}
                          onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                          placeholder="Observações"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                          aria-label="Observações"
                        />
                      </div>
                    ) : (
                      template.title
                    )}
                  </td>
                  <td className="px-4 py-3">{WEEKDAY_LABELS[template.dayOfWeek]}</td>
                  <td className="px-4 py-3">{template.time}</td>
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <input
                        value={editing.location}
                        onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                        aria-label="Local"
                      />
                    ) : (
                      template.location
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <select
                        value={editing.type}
                        onChange={(e) =>
                          setEditing({ ...editing, type: e.target.value as MassType })
                        }
                        className="rounded border border-gray-200 px-2 py-1 text-sm"
                        aria-label="Tipo"
                      >
                        <option value="COMMON">Comum</option>
                        <option value="SPECIAL">Especial</option>
                      </select>
                    ) : (
                      MASS_TYPE_LABELS[template.type]
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        template.active ? askDeactivate(template) : reactivate(template)
                      }
                      disabled={busy}
                      title={template.active ? 'Desativar' : 'Reativar'}
                      className={`rounded-full px-2 py-0.5 text-[12px] font-medium disabled:opacity-50 ${
                        template.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {template.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditingThis ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(null)}
                          className="rounded-lg bg-gray-100 px-3 py-1 text-[13px] font-medium hover:bg-gray-200"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={busy}
                          className="rounded-lg bg-[#1a4d8f] px-3 py-1 text-[13px] font-medium text-white hover:bg-[#153e73] disabled:opacity-50"
                        >
                          Salvar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(template)}
                        className="rounded-lg bg-gray-100 px-3 py-1 text-[13px] font-medium hover:bg-gray-200"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
        title="Desativar missa recorrente"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            Desativar <span className="font-medium">"{deactivating?.title}"</span> impede que novas
            ocorrências sejam geradas.
          </p>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={removeFuture}
              onChange={(e) => setRemoveFuture(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1a4d8f]"
            />
            <span>
              Remover também as ocorrências futuras que ainda não têm escala. As que já têm escala
              são mantidas.
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeactivating(null)}
              disabled={busy}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDeactivate}
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? 'Desativando...' : 'Desativar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
