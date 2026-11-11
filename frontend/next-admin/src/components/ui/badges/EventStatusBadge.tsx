// src/components/ui/badges/EventStatusBadge.tsx
import { EventStatus } from '@/types/events/events';

export default function EventStatusBadge({ status }: { status: EventStatus }) {
  const active = status === 'ACTIVE';
  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-sm font-medium ${
        active ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {active ? 'Ativo' : 'Cancelado'}
    </span>
  );
}
