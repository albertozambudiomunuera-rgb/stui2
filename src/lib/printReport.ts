// Impresión del informe en la propia página, sin ventana emergente.
//
// Antes se abría el informe con window.open() + document.write(). Con la app
// instalada (manifest "display": "standalone"), iOS abre esa ventana como una
// vista sin barra ni botón de volver: el diálogo de impresión no llegaba a
// funcionar y el usuario quedaba atrapado hasta cerrar la app desde la
// multitarea. Ahora el informe se inserta en un contenedor oculto en pantalla
// que solo se ve al imprimir, y se llama a window.print() sobre la página
// actual. El diálogo nativo (Cancelar, Compartir → WhatsApp, Guardar en
// Archivos/PDF) devuelve siempre a la app.

const ROOT_ID = 'print-root';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface ReportTheme {
  h1: string;
  h2: string;
  border: string;
  tint: string;
}

export const TEAL_THEME: ReportTheme = { h1: '#0f766e', h2: '#115e59', border: '#99f6e4', tint: '#f0fdfa' };
export const INDIGO_THEME: ReportTheme = { h1: '#4052D6', h2: '#3040b0', border: '#a5b4fc', tint: '#eef0ff' };

function reportCss(t: ReportTheme): string {
  const r = `#${ROOT_ID}`;
  return `
@media screen{${r}{display:none!important}}
@media print{
  html,body{position:static!important;overflow:visible!important;height:auto!important;background:#fff!important}
  body>*:not(${r}){display:none!important}
  ${r}{display:block!important}
}
${r}{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:0 24px;color:#1a1a1a;font-size:14px;background:#fff}
${r} h1{color:${t.h1};font-size:22px;margin:0 0 4px}
${r} .sub{color:#666;font-size:13px;margin-bottom:24px}
${r} h2{color:${t.h2};font-size:15px;border-bottom:2px solid ${t.border};padding-bottom:6px;margin:24px 0 12px}
${r} table{width:100%;border-collapse:collapse;margin-bottom:16px}
${r} th{background:${t.tint};padding:8px 10px;text-align:left;font-size:11px;color:#475569;border-bottom:2px solid ${t.border};text-transform:uppercase}
${r} td{padding:8px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
${r} .algo{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:16px}
${r} .algo h3{color:#92400e;font-size:14px;margin:0 0 10px}
${r} .algo li{color:#78350f;margin-bottom:6px;line-height:1.5}
${r} .pnote{background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:12px;margin-bottom:8px;font-size:13px;color:#4c1d95;line-height:1.7}
${r} .pnote-date{font-size:11px;color:#9333ea;margin-bottom:4px}
${r} .note{background:${t.tint};border:1px solid ${t.border};border-radius:8px;padding:14px;font-family:monospace;font-size:12px;white-space:pre-wrap;line-height:1.8}
${r} details.rules{margin-top:8px;border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;font-size:11px;color:#64748b}
${r} details.rules summary{font-weight:bold;cursor:pointer}
${r} details.rules pre{font-family:monospace;white-space:pre-wrap;line-height:1.6;margin:8px 0 0}
${r} .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;line-height:1.45}
`;
}

/** Nota clínica + desplegable (colapsado) con reglas clínicas y bibliografía. */
export function noteWithRulesHtml(main: string, rules: string): string {
  return `<div class="note">${escapeHtml(main)}</div>` +
    (rules
      ? `<details class="rules"><summary>Reglas clínicas aplicadas y bibliografía</summary><pre>${escapeHtml(rules)}</pre></details>`
      : '');
}

export function printReport({ title, bodyHtml, theme }: { title: string; bodyHtml: string; theme: ReportTheme }): void {
  if (typeof window.print !== 'function') {
    alert('Este navegador no permite generar el PDF. Usa el botón Compartir.');
    return;
  }

  if (appTitle !== null) document.title = appTitle;
  document.getElementById(ROOT_ID)?.remove();
  document.getElementById(`${ROOT_ID}-style`)?.remove();

  const style = document.createElement('style');
  style.id = `${ROOT_ID}-style`;
  style.textContent = reportCss(theme);
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = bodyHtml;
  document.head.appendChild(style);
  document.body.appendChild(root);

  // Safari y Chrome usan document.title como nombre del PDF guardado.
  if (appTitle === null) appTitle = document.title;
  document.title = title;

  // En iOS window.print() no bloquea, así que no se limpia con temporizador
  // (podría vaciar el informe antes de generar la vista previa). Si el
  // navegador no emite 'afterprint', el contenedor sigue oculto en pantalla
  // y se sustituye en la siguiente impresión.
  const cleanup = () => {
    if (appTitle !== null) document.title = appTitle;
    root.remove();
    style.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  // Deja que el navegador pinte el contenedor antes de abrir el diálogo.
  setTimeout(() => window.print(), 50);
}

let appTitle: string | null = null;
