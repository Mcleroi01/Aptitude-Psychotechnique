import "server-only";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { siteConfig } from "@/lib/site";

/**
 * Générateur de rapports PDF minimaliste (pdf-lib, sans navigateur : adapté au
 * serverless). Polices standard : le texte est ramené au jeu Windows-1252.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const INK = rgb(0.043, 0.078, 0.157);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.86, 0.87, 0.89);
const CP1252_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

/** Remplace les caractères absents des polices standard. */
export function pdfSafe(text: string): string {
  return text
    .replace(/[   ]/g, " ")
    .replace(/[−‐‑]/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/[^\n\t\x20-\xff]/g, (c) => (CP1252_EXTRA.includes(c) ? c : "?"));
}

export type Column = { header: string; width: number; align?: "left" | "right" };

export class PdfReport {
  private constructor(
    private doc: PDFDocument,
    private regular: PDFFont,
    private bold: PDFFont,
  ) {}

  private page!: PDFPage;
  private y = 0;

  static async create(title: string) {
    const doc = await PDFDocument.create();
    doc.setTitle(pdfSafe(title));
    doc.setProducer(siteConfig.name);
    doc.setCreator(siteConfig.name);
    const report = new PdfReport(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold));
    report.addPage();
    return report;
  }

  private addPage() {
    this.page = this.doc.addPage([A4.width, A4.height]);
    this.y = A4.height - MARGIN;
  }

  private ensure(space: number) {
    if (this.y - space < MARGIN + 24) this.addPage();
  }

  private wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const lines: string[] = [];
    for (const paragraph of pdfSafe(text).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width || !line) line = candidate;
        else {
          lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  private fit(text: string, font: PDFFont, size: number, width: number) {
    let value = pdfSafe(text);
    while (value.length > 1 && font.widthOfTextAtSize(value, size) > width) value = value.slice(0, -2) + "…";
    return value;
  }

  title(text: string, subtitle?: string) {
    this.page.drawText(pdfSafe(siteConfig.name).toUpperCase(), { x: MARGIN, y: this.y, size: 8, font: this.bold, color: MUTED });
    this.y -= 26;
    for (const line of this.wrap(text, this.bold, 20, A4.width - 2 * MARGIN)) {
      this.ensure(26);
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 20, font: this.bold, color: INK });
      this.y -= 26;
    }
    if (subtitle) this.paragraph(subtitle, { color: MUTED });
    this.y -= 6;
  }

  heading(text: string) {
    this.ensure(40);
    this.y -= 10;
    this.page.drawText(pdfSafe(text), { x: MARGIN, y: this.y, size: 12, font: this.bold, color: INK });
    this.y -= 8;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: A4.width - MARGIN, y: this.y }, thickness: 0.6, color: RULE });
    this.y -= 16;
  }

  paragraph(text: string, options: { size?: number; color?: typeof INK } = {}) {
    const size = options.size ?? 10;
    for (const line of this.wrap(text, this.regular, size, A4.width - 2 * MARGIN)) {
      this.ensure(size + 5);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.regular, color: options.color ?? INK });
      this.y -= size + 5;
    }
  }

  /** Paires libellé / valeur sur deux colonnes. */
  facts(items: [string, string][]) {
    const colWidth = (A4.width - 2 * MARGIN) / 2;
    for (let i = 0; i < items.length; i += 2) {
      this.ensure(32);
      items.slice(i, i + 2).forEach(([label, value], j) => {
        const x = MARGIN + j * colWidth;
        this.page.drawText(pdfSafe(label), { x, y: this.y, size: 8.5, font: this.regular, color: MUTED });
        this.page.drawText(this.fit(value, this.bold, 13, colWidth - 12), { x, y: this.y - 15, size: 13, font: this.bold, color: INK });
      });
      this.y -= 34;
    }
  }

  table(columns: Column[], rows: string[][]) {
    const total = columns.reduce((s, c) => s + c.width, 0);
    const scale = (A4.width - 2 * MARGIN) / total;
    const widths = columns.map((c) => c.width * scale);
    const drawRow = (cells: string[], font: PDFFont, color: typeof INK) => {
      let x = MARGIN;
      cells.forEach((cell, i) => {
        // Marge intérieure : une colonne alignée à gauche ne touche jamais la précédente.
        const padding = i === 0 ? 0 : 10;
        const text = this.fit(cell, font, 9, widths[i] - padding - 4);
        const offset = columns[i].align === "right" ? widths[i] - 4 - font.widthOfTextAtSize(text, 9) : padding;
        this.page.drawText(text, { x: x + offset, y: this.y, size: 9, font, color });
        x += widths[i];
      });
      this.y -= 6;
      this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: A4.width - MARGIN, y: this.y }, thickness: 0.4, color: RULE });
      this.y -= 12;
    };
    const header = () => drawRow(columns.map((c) => c.header), this.bold, MUTED);
    this.ensure(40);
    header();
    for (const row of rows) {
      if (this.y < MARGIN + 40) {
        this.addPage();
        header();
      }
      drawRow(row, this.regular, INK);
    }
    this.y -= 4;
  }

  async toBytes(): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    const footer = pdfSafe(`${siteConfig.name} - document généré le ${new Date().toLocaleDateString("fr-FR")}`);
    pages.forEach((page, i) => {
      page.drawText(footer, { x: MARGIN, y: 28, size: 7.5, font: this.regular, color: MUTED });
      const label = `${i + 1} / ${pages.length}`;
      page.drawText(label, { x: A4.width - MARGIN - this.regular.widthOfTextAtSize(label, 7.5), y: 28, size: 7.5, font: this.regular, color: MUTED });
    });
    return this.doc.save();
  }
}
