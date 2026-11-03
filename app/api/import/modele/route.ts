import { IMPORT_COLUMNS, TEMPLATE_EXAMPLES } from "@/lib/imports/rows";
import { toCsv } from "@/lib/results/csv";

/** Modèle d'import CSV (aucune donnée personnelle) : en-têtes et exemples commentés. */
export function GET() {
  const header = IMPORT_COLUMNS.map((c) => c.label);
  const rows = TEMPLATE_EXAMPLES.map((row) => IMPORT_COLUMNS.map((c) => row[c.key] ?? ""));
  return new Response(toCsv(header, rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="modele-import-questions.csv"',
      "cache-control": "public, max-age=3600",
    },
  });
}
