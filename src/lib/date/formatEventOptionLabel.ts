// src/lib/date/formatEventOptionLabel.ts
export function formatEventOptionLabel(event: { name: string; startDate: string }) {
  const date = new Date(event.startDate);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${event.name}, ${dd}/${mm}/${yy} ${hh}:${min}`;
}