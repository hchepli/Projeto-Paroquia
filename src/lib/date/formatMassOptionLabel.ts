// src/lib/date/formatMassOptionLabel.ts
export function formatMassOptionLabel(mass: { title: string; dateTime: string }) {
  const date = new Date(mass.dateTime);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${mass.title}, ${dd}/${mm}/${yy} ${hh}:${min}`;
}