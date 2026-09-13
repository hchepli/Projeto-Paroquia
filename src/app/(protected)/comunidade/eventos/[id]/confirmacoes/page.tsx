// src/app/comunidade/eventos/[id]/confirmacoes/page.tsx
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useEvent } from '@/hooks/events/useEvent';
import { useAttendanceConfirmations } from '@/hooks/attendance-confirmations/useAttendanceConfirmations';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConfirmacoesPresencaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = Number(params.id);

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: allConfirmations = [], isLoading: confirmationsLoading } =
    useAttendanceConfirmations();

  const confirmations = useMemo(
    () => allConfirmations.filter((c) => c.eventId === eventId),
    [allConfirmations, eventId],
  );

  if (eventLoading || !event) {
    return null;
  }

  return (
    <>
      <Header
        title={`Confirmações de presença — ${event.name}`}
        description="RN012: registro informativo, não garante lugar reservado."
        actions={[
          { label: 'Voltar para o evento', onClick: () => router.push(`/comunidade/eventos/${eventId}`) },
        ]}
      />

      <div className="mt-6 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700">
            {confirmationsLoading ? 'Confirmações' : `${confirmations.length} confirmação(ões)`}
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Contato</th>
              <th className="px-4 py-2 font-medium">Confirmado em</th>
            </tr>
          </thead>
          <tbody>
            {confirmationsLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Carregando confirmações...
                </td>
              </tr>
            )}

            {!confirmationsLoading && confirmations.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Nenhuma confirmação de presença registrada para este evento.
                </td>
              </tr>
            )}

            {!confirmationsLoading &&
              confirmations.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.contact}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDateTime(c.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}