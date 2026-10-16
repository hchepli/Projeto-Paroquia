// src/components/ui/badges/EventStatusBadge.tsx
import { EventStatus } from '@/types/events/events';

export default function EventStatusBadge({ status }: { status: EventStatus }) {
  const active = status === 'ACTIVE';
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? 'Ativo' : 'Cancelado'}
    </span>
  );
}