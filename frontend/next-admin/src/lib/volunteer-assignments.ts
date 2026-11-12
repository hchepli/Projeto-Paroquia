// src/lib/volunteer-assignments.ts
// Formato devolvido pelo back no 409 de UC009 (volunteers.service → findAssignments).
export interface VolunteerAssignment {
  scheduleId: string;
  sourceType: 'MASS' | 'EVENT';
  title: string;
  role: string;
  date: string | null;
  isFuture: boolean;
}

export function describeAssignments(list: VolunteerAssignment[], max = 8): string {
  const lines = list.slice(0, max).map((a) => {
    const date = a.date ? ` — ${new Date(a.date).toLocaleDateString('pt-BR')}` : '';
    return `• ${a.title}${date} (${a.role})`;
  });
  if (list.length > max) lines.push(`… e mais ${list.length - max}.`);
  return lines.join('\n');
}