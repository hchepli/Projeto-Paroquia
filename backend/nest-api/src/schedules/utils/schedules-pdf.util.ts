import PDFDocument from 'pdfkit';
import { flattenRows, formatDateBR, formatDateTimeBR, ScheduleExportRow } from './schedule-export.util';

type ExportFilters = { startDate?: string; endDate?: string };

const COLUMNS = [
  { key: 'data', label: 'Data', width: 62 },
  { key: 'hora', label: 'Hora', width: 36 },
  { key: 'tipo', label: 'Tipo', width: 42 },
  { key: 'titulo', label: 'Título', width: 128 },
  { key: 'pastoral', label: 'Pastoral', width: 100 },
  { key: 'voluntario', label: 'Voluntário', width: 100 },
  { key: 'funcao', label: 'Função', width: 47 },
] as const;
const TABLE_WIDTH = 515;
const PAD = 6;

function fmt(s?: string) {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : formatDateBR(d);
}

export function buildSchedulesPdf(schedules: ScheduleExportRow[], filters: ExportFilters): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
  const rows = flattenRows(schedules);
  const left = doc.page.margins.left;

  doc.font('Helvetica-Bold').fontSize(16).text('Paróquia — Relatório de Escalas', { align: 'center' });
  doc.moveDown(0.3);
  const periodo =
    filters.startDate || filters.endDate
      ? `Período: ${fmt(filters.startDate) ?? '(início)'} a ${fmt(filters.endDate) ?? '(fim)'}`
      : 'Período: todas as escalas (sem filtro de data)';
  doc.font('Helvetica').fontSize(10).fillColor('#555').text(periodo, { align: 'center' });
  doc.moveDown(1).fillColor('#000');

  let y = doc.y;
  const limit = () => doc.page.height - doc.page.margins.bottom - 24;

  const drawHeader = () => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000');
    let x = left;
    for (const c of COLUMNS) {
      doc.text(c.label, x, y, { width: c.width - 4, lineBreak: false });
      x += c.width;
    }
    y += 14;
    doc.moveTo(left, y - 2).lineTo(left + TABLE_WIDTH, y - 2).strokeColor('#ccc').stroke();
    doc.font('Helvetica').fontSize(9);
  };
  drawHeader();

  if (rows.length === 0) doc.text('Nenhuma escala no período.', left, y);

  for (const row of rows) {
    const cells = COLUMNS.map((c) => row[c.key] || '-');
    doc.font('Helvetica').fontSize(9);
    // Altura real do conteúdo: título longo quebra linha sem invadir a próxima
    const h = Math.max(...cells.map((t, i) => doc.heightOfString(t, { width: COLUMNS[i].width - 4 }))) + PAD;
    if (y + h > limit()) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }
    let x = left;
    cells.forEach((t, i) => {
      doc.fillColor('#000').text(t, x, y, { width: COLUMNS[i].width - 4 });
      x += COLUMNS[i].width;
    });
    y += h;
  }

  // Rodapé: margem inferior zerada para o PDFKit não criar página em branco ao escrever abaixo dela.
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const m = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.fontSize(8).fillColor('#888').text(
      `Gerado em ${formatDateTimeBR(new Date())} — Página ${i + 1} de ${range.count}`,
      left, doc.page.height - 30, { width: TABLE_WIDTH, lineBreak: false },
    );
    doc.page.margins.bottom = m;
  }
  return doc;
}