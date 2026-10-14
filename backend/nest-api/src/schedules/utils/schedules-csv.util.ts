type ScheduleExportRow = {
  mass: { title: string; dateTime: Date } | null;
  event: { name: string; startDate: Date } | null;
  pastoralGroup: { name: string } | null;
  assignments: {
    role: string;
    volunteer: { name: string };
  }[];
};

// Escapa valores pra CSV: envolve em aspas se tiver vírgula, aspas ou quebra de linha.
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function buildSchedulesCsv(schedules: ScheduleExportRow[]): string {
  const header = ['data', 'tipo', 'titulo', 'pastoral', 'voluntario', 'funcao'];
  const lines: string[] = [header.join(',')];

  for (const schedule of schedules) {
    const tipo = schedule.mass ? 'Missa' : 'Evento';
    const titulo = schedule.mass?.title ?? schedule.event?.name ?? '';
    const data = schedule.mass
      ? formatDate(schedule.mass.dateTime)
      : schedule.event
        ? formatDate(schedule.event.startDate)
        : '';
    const pastoral = schedule.pastoralGroup?.name ?? '';

    // Uma linha por atribuição, já que uma Escala pode ter várias.
    if (schedule.assignments.length === 0) {
      // Escala sem atribuições ainda - gera 1 linha com voluntário/função vazios,
      // pra não "sumir" do relatório.
      lines.push(
        [data, tipo, titulo, pastoral, '', '']
          .map(escapeCsvValue)
          .join(','),
      );
    } else {
      for (const assignment of schedule.assignments) {
        lines.push(
          [
            data,
            tipo,
            titulo,
            pastoral,
            assignment.volunteer.name,
            assignment.role,
          ]
            .map(escapeCsvValue)
            .join(','),
        );
      }
    }
  }

  return lines.join('\n');
}