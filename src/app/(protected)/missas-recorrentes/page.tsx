'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import MassFormModal from '@/components/ui/forms/MassFormModal';
import { useMassTemplates } from '@/hooks/masses/useMassTemplates';
import { useUpdateMassTemplate } from '@/hooks/masses/useUpdateMassTemplate';
import { MassTemplate } from '@/types/masses/mass-template';

const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const MASS_TYPE_LABELS: Record<string, string> = {
  COMMON: 'Comum',
  SPECIAL: 'Especial',
};

interface EditingState {
  id: number;
  title: string;
  location: string;
  dayOfWeek: number;
  time: string;
  type: string;
  notes: string;
}

export default function MissasRecorrentesPage() {
  const { data: templates, isLoading } = useMassTemplates();
  const updateTemplate = useUpdateMassTemplate();
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function startEdit(template: MassTemplate) {
    setError(null);
    setEditing({
      id: template.id,
      title: template.title,
      location: template.location,
      dayOfWeek: template.dayOfWeek,
      time: template.time,
      type: template.type,
      notes: template.notes ?? '',
    });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await updateTemplate.mutateAsync({
        id: editing.id,
        data: {
          title: editing.title,
          location: editing.location,
          dayOfWeek: editing.dayOfWeek,
          time: editing.time,
          type: editing.type as MassTemplate['type'],
          notes: editing.notes || undefined,
        },
      });
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    }
  }

  async function toggleActive(template: MassTemplate) {
    setError(null);
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        data: { active: !template.active },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    }
  }

  return (
    <>
      <Header
        title="Missas Recorrentes"
        description="Gerencie os templates de missas que se repetem semanalmente."
        actions={[{ label: 'Adicionar Missa', onClick: () => setModalOpen(true) }]}
      />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-[16px] border border-[rgba(0,0,0,0.1)]">
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
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            )}

            {!isLoading && (!templates || templates.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Nenhuma missa recorrente cadastrada. Clique em "Adicionar Missa" e ative
                  "Repetir semanalmente".
                </td>
              </tr>
            )}

            {templates?.map((template) => {
              const isEditingThis = editing?.id === template.id;

              return (
                <tr key={template.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <input
                        value={editing.title}
                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                      />
                    ) : (
                      template.title
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <select
                        value={editing.dayOfWeek}
                        onChange={(e) =>
                          setEditing({ ...editing, dayOfWeek: Number(e.target.value) })
                        }
                        className="rounded border border-gray-200 px-2 py-1 text-sm"
                      >
                        {WEEKDAY_LABELS.map((label, idx) => (
                          <option key={idx} value={idx}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      WEEKDAY_LABELS[template.dayOfWeek]
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <input
                        type="time"
                        value={editing.time}
                        onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                        className="rounded border border-gray-200 px-2 py-1 text-sm"
                      />
                    ) : (
                      template.time
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <input
                        value={editing.location}
                        onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                      />
                    ) : (
                      template.location
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <select
                        value={editing.type}
                        onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                        className="rounded border border-gray-200 px-2 py-1 text-sm"
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
                      onClick={() => toggleActive(template)}
                      disabled={updateTemplate.isPending}
                      className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
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
                          disabled={updateTemplate.isPending}
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

      <MassFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}