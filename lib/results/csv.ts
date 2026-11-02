/**
 * Export CSV lisible par Excel en français : séparateur « ; », BOM UTF-8 pour
 * les accents, décimales à virgule. Les cellules commençant par = + - @ sont
 * neutralisées pour empêcher l'injection de formules à l'ouverture.
 */
export type CsvCell = string | number | boolean | null | undefined | Date;

function formatCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") return Number.isFinite(value) ? String(value).replace(".", ",") : "";
  if (value instanceof Date) return value.toISOString().replace("T", " ").slice(0, 16);
  return value;
}

export function escapeCsv(value: CsvCell): string {
  let text = formatCell(value);
  // Seul le texte saisi par un utilisateur peut contenir une formule ; un nombre négatif reste un nombre.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCsv).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}
