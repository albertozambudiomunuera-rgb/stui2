// Genera el informe como archivo PDF real y lo entrega con el panel nativo
// de compartir (WhatsApp, Guardar en Archivos, correo…) o, en escritorio,
// como descarga.
//
// Por qué no window.print(): con la app instalada en iOS (PWA standalone)
// window.print() no hace nada, y la versión anterior con window.open()
// dejaba al usuario atrapado en una vista sin botón de volver. Generar el
// PDF en el propio dispositivo funciona igual en navegador y app instalada,
// y no envía datos a ningún servidor.
import { jsPDF } from 'jspdf';

export interface ReportPdf {
  title: string;
  subtitle: string;
  accent: [number, number, number];
  /** Filas de la tabla: [cuestionario, puntuación, severidad, notas]. */
  rows: string[][];
  /** Tabla de evolución entre visitas (seguimiento), si hay historial. */
  evolution?: { header: string[]; rows: string[][]; footnotes: string[] };
  findings: string[];
  patientNotes: { date: string; text: string }[];
  note: string;
  footer: string[];
}

// Las fuentes estándar de PDF solo cubren WinAnsi (latín + algunos signos):
// se traducen los símbolos habituales y se eliminan emojis y el resto.
const REPLACE: Record<string, string> = {
  '≥': '>=', '−': '-', '≤': '<=', '→': '->', '←': '<-', '✅': '', '⏳': '', '≈': '~', '×': 'x',
};
const WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function clean(s: string): string {
  let out = '';
  for (const ch of s.replace(/\r/g, '')) {
    const r = REPLACE[ch];
    if (r !== undefined) { out += r; continue; }
    const c = ch.codePointAt(0)!;
    if (ch === '\n' || (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WINANSI_EXTRA.includes(ch)) out += ch;
  }
  return out.replace(/ {2,}/g, ' ');
}

const PAGE_W = 210;
const PAGE_H = 297;
const M = 15;
const W = PAGE_W - 2 * M;

export function buildPdf(r: ReportPdf): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = M;

  const ensure = (h: number) => {
    if (y + h > PAGE_H - M) { doc.addPage(); y = M; }
  };
  const lineH = (size: number) => size * 0.42;
  const para = (text: string, size: number, opts: { font?: string; style?: string; color?: [number, number, number]; width?: number; x?: number } = {}) => {
    doc.setFont(opts.font ?? 'helvetica', opts.style ?? 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? [26, 26, 26]));
    const lines: string[] = doc.splitTextToSize(clean(text), opts.width ?? W);
    for (const ln of lines) {
      ensure(lineH(size));
      doc.text(ln, opts.x ?? M, y + lineH(size) * 0.8);
      y += lineH(size);
    }
  };
  const h2 = (text: string) => {
    y += 5;
    ensure(12);
    para(text, 12, { style: 'bold', color: r.accent });
    doc.setDrawColor(...r.accent);
    doc.setLineWidth(0.4);
    doc.line(M, y + 1, M + W, y + 1);
    y += 4;
  };

  para(r.title, 17, { style: 'bold', color: r.accent });
  y += 1;
  para(r.subtitle, 9.5, { color: [100, 100, 100] });

  const size = 9;
  const table = (cols: number[], header: string[], rows: string[][]) => {
    const cellLines = (row: string[], header: boolean) => row.map((c, i) => {
      doc.setFont('helvetica', header || i === 0 ? 'bold' : 'normal');
      doc.setFontSize(header ? 8 : size);
      return doc.splitTextToSize(clean(c), cols[i] - 3) as string[];
    });
    const drawRow = (row: string[], header: boolean) => {
      const lines = cellLines(row, header);
      const h = Math.max(...lines.map((l) => l.length)) * lineH(size) + 3;
      ensure(h);
      if (header) { doc.setFillColor(241, 245, 249); doc.rect(M, y, W, h, 'F'); }
      let x = M;
      lines.forEach((ls, i) => {
        doc.setFont('helvetica', header || i === 0 ? 'bold' : 'normal');
        doc.setFontSize(header ? 8 : size);
        doc.setTextColor(header ? 71 : 26, header ? 85 : 26, header ? 105 : 26);
        ls.forEach((ln, k) => doc.text(ln, x + 1.5, y + 1.5 + lineH(size) * (k + 0.8)));
        x += cols[i];
      });
      y += h;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(M, y, M + W, y);
    };
    drawRow(header, true);
    rows.forEach((row) => drawRow(row, false));
  };

  h2('Puntuaciones');
  if (r.rows.length) table([34, 28, 48, W - 34 - 28 - 48], ['CUESTIONARIO', 'PUNTUACIÓN', 'SEVERIDAD', 'NOTAS'], r.rows);
  else para('Sin datos suficientes', size, { color: [148, 163, 184] });

  if (r.evolution && r.evolution.rows.length) {
    h2('Evolución entre visitas');
    const first = 58;
    const rest = (W - first) / (r.evolution.header.length - 1);
    table([first, ...r.evolution.header.slice(1).map(() => rest)], r.evolution.header, r.evolution.rows);
    y += 1;
    para('Cambio = evaluación actual frente a la anterior. Sin interpretación clínica.', 8, { color: [100, 116, 139] });
    r.evolution.footnotes.forEach((f) => para(f, 8, { color: [100, 116, 139] }));
  }

  if (r.findings.length) {
    h2('Hallazgos registrados');
    r.findings.forEach((f) => {
      para(`•  ${f}`, 10, { color: [120, 53, 15], x: M + 2, width: W - 4 });
      y += 1;
    });
  }

  if (r.patientNotes.length) {
    h2('Notas del paciente para el médico');
    r.patientNotes.forEach((n) => {
      para(n.date, 8.5, { color: [147, 51, 234] });
      para(n.text, 10, { color: [76, 29, 149] });
      y += 2;
    });
  }

  h2('Nota para Historia Clínica');
  para(r.note.trim(), 8.5, { font: 'courier' });

  y += 6;
  doc.setDrawColor(226, 232, 240);
  ensure(4);
  doc.line(M, y, M + W, y);
  y += 3;
  r.footer.forEach((f) => { para(f, 7.5, { color: [148, 163, 184] }); y += 1; });

  return doc;
}

export async function shareReportPdf(report: ReportPdf, patientName: string): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = clean(patientName).normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  const filename = `Informe-STUI${slug ? '-' + slug : ''}-${stamp}.pdf`;

  let blob: Blob;
  try {
    blob = buildPdf(report).output('blob');
  } catch {
    alert('No se pudo generar el PDF. Usa el botón Compartir o Copiar.');
    return;
  }
  const file = new File([blob], filename, { type: 'application/pdf' });

  // En móvil: panel nativo (WhatsApp, Guardar en Archivos…). En escritorio
  // se prefiere la descarga directa.
  const mobile = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  if (mobile && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: report.title });
      return;
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return; // el usuario cerró el panel
      // otro error: se intenta la descarga
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
