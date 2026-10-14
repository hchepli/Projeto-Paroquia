import PDFDocument from 'pdfkit';

type ScheduleExportRow = {
    mass: { title: string; dateTime: Date } | null;
    event: { name: string; startDate: Date } | null;
    pastoralGroup: { name: string } | null;
    assignments: {
        role: string;
        volunteer: { name: string };
    }[];
};

type ExportFilters = {
    startDate?: string;
    endDate?: string;
};

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Achata as Escalas em linhas (1 por atribuição), igual ao CSV,
// pra manter os dois formatos consistentes entre si.
function flattenRows(schedules: ScheduleExportRow[]) {
    const rows: {
        data: string;
        tipo: string;
        titulo: string;
        pastoral: string;
        voluntario: string;
        funcao: string;
    }[] = [];

    for (const schedule of schedules) {
        const tipo = schedule.mass ? 'Missa' : 'Evento';
        const titulo = schedule.mass?.title ?? schedule.event?.name ?? '';
        const data = schedule.mass
            ? formatDate(schedule.mass.dateTime)
            : schedule.event
                ? formatDate(schedule.event.startDate)
                : '';
        const pastoral = schedule.pastoralGroup?.name ?? '';

        if (schedule.assignments.length === 0) {
            rows.push({ data, tipo, titulo, pastoral, voluntario: '', funcao: '' });
        } else {
            for (const assignment of schedule.assignments) {
                rows.push({
                    data,
                    tipo,
                    titulo,
                    pastoral,
                    voluntario: assignment.volunteer.name,
                    funcao: assignment.role,
                });
            }
        }
    }

    return rows;
}

export function buildSchedulesPdf(
    schedules: ScheduleExportRow[],
    filters: ExportFilters,
): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const rows = flattenRows(schedules);

    // Cabeçalho
    doc.fontSize(16).text('Paróquia — Relatório de Escalas', { align: 'center' });
    doc.moveDown(0.3);

    const periodoTexto =
        filters.startDate || filters.endDate
            ? `Período: ${filters.startDate ?? '(início)'} a ${filters.endDate ?? '(fim)'}`
            : 'Período: todas as escalas (sem filtro de data)';
    doc.fontSize(10).fillColor('#555').text(periodoTexto, { align: 'center' });
    doc.moveDown(1);
    doc.fillColor('#000');

    // Tabela — larguras fixas por coluna (soma ~515, cabe em A4 com margem 40)
    const columns = [
        { key: 'data', label: 'Data', width: 70 },
        { key: 'tipo', label: 'Tipo', width: 60 },
        { key: 'titulo', label: 'Título', width: 130 },
        { key: 'pastoral', label: 'Pastoral', width: 100 },
        { key: 'voluntario', label: 'Voluntário', width: 100 },
        { key: 'funcao', label: 'Função', width: 55 },
    ] as const;

    const startX = doc.page.margins.left;
    let y = doc.y;
    const rowHeight = 20;

    function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(9);
        for (const col of columns) {
            doc.text(col.label, x, y, { width: col.width });
            x += col.width;
        }
        y += rowHeight;
        doc.font('Helvetica').fontSize(9);
        doc
            .moveTo(startX, y - 4)
            .lineTo(startX + columns.reduce((s, c) => s + c.width, 0), y - 4)
            .strokeColor('#ccc')
            .stroke();
    }

    drawHeader();

    for (const row of rows) {
        // Quebra de página quando chega perto do final
        if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
            doc.addPage();
            y = doc.page.margins.top;
            drawHeader();
        }

        let x = startX;
        for (const col of columns) {
            doc.text((row as any)[col.key] || '-', x, y, { width: col.width });
            x += col.width;
        }
        y += rowHeight;
    }

    // Rodapé com data de geração — em cada página
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
            .fontSize(8)
            .fillColor('#888')
            .text(
                `Gerado em ${new Date().toLocaleString('pt-BR')}`,
                startX,
                doc.page.height - doc.page.margins.bottom + 10,
                { align: 'left' },
            );
    }

    return doc;
}