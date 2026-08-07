import { useState } from 'react';
import { Printer, Copy, CheckCircle, Trash2, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppData, DiaryStats } from '../../types';
import {
  ipssScore, ipssComplete, ipssSeverity, ipssPredom, IPSS_QOL,
  iiefScore, iiefComplete, iiefSeverity,
  oabScore, oabComplete, oabNoUrgency, OAB_DISCLAIMER, iciqScore, iciqComplete, iciqSeverity,
  computeStats, generateClinicalNote, padDayStats, PAD_TEST_DISCLAIMER, PERIOD_DISCLAIMER,
  CLINICAL_RULES, habitsLine,
} from '../../lib/clinical';

// Cambio 2: "Nocturia" es una ventana horaria, no un dato único. Si hay hora
// de conciliación del sueño (sleepOnset) se usa el recuento ICS; si no,
// se muestra la cuenta sobre la ventana declarada (acostarse→despertar),
// etiquetada como tal para no hacerla pasar por nocturia ICS.
function nocturiaLabel(s: DiaryStats): string {
  if (s.nocturiaCount !== null) return `Nocturia (ICS): ${s.nocturiaCount}/noche`;
  if (s.avgN !== null) return `Micciones en la ventana nocturna declarada: ${s.avgN}/noche`;
  return 'Nocturia: sin datos';
}

interface DashboardTabProps {
  data: AppData;
  onAddNote?: (text: string) => void;
  onDeleteNote?: (id: string) => void;
}

const naText = 'sin datos';

export function DashboardTab({ data, onAddNote, onDeleteNote }: DashboardTabProps) {
  const [copied, setCopied] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleAddNote = () => {
    const text = noteDraft.trim();
    if (!text || !onAddNote) return;
    onAddNote(text);
    setNoteDraft('');
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const hasDiary = data.days.some((d) => d.entries.length > 0);
  const hasIPSS = ipssComplete(data.ipss);
  const s = hasDiary ? computeStats(data) : null;
  const p = data.patient;

  const ipssVal = ipssScore(data.ipss);
  const ipssSev = ipssSeverity(ipssVal);
  const iiefVal = iiefScore(data.iief);
  const iiefSev = iiefSeverity(iiefVal);
  const oabVal = oabScore(data);
  const iciqVal = iciqScore(data);
  const iciqSev = iciqSeverity(iciqVal);
  const padStats = padDayStats(data);

  const daysCount = data.days.filter((d) => d.entries.length > 0).length;
  const hasIIEF = !!data.screening.iief && iiefComplete(data.iief);
  const hasOAB = !!data.screening.oab && oabComplete(data);
  const hasICIQ = !!data.screening.iciq && iciqComplete(data);

  const findings: string[] = [];
  if (hasIPSS) {
    if (ipssVal >= 20) findings.push(`IPSS grave (${ipssVal}/35): sintomatología obstructiva-irritativa grave. Predominio: ${ipssPredom(data.ipss)}.`);
    else if (ipssVal >= 8) findings.push(`IPSS moderado (${ipssVal}/35): sintomatología de impacto clínico significativo. Predominio: ${ipssPredom(data.ipss)}.`);
    else findings.push(`IPSS leve (${ipssVal}/35): sintomatología leve. Predominio: ${ipssPredom(data.ipss)}.`);
    findings.push('El predominio de síntomas es una regla interna de esta herramienta: no equivale a diagnóstico de obstrucción.');
    if (data.ipss.qol !== null && data.ipss.qol >= 4) findings.push(`Calidad de vida afectada (QoL ${data.ipss.qol}/6: ${IPSS_QOL[data.ipss.qol]}).`);
  }
  if (s) {
    findings.push(nocturiaLabel(s));
    if (s.npI !== null) findings.push(`Proporción de volumen nocturno: ${s.npI} %.`);
    if (s.maxV !== null && s.maxV > 0 && s.maxV < 150) findings.push(`Capacidad vesical funcional muy reducida (CVF ${s.maxV} ml).`);
    else if (s.maxV !== null && s.maxV >= 150 && s.maxV < 200) findings.push(`Capacidad vesical funcional reducida (CVF ${s.maxV} ml).`);
    if (s.ul > 0) findings.push(`Se registraron ${s.ul} episodio${s.ul > 1 ? 's' : ''} de escape asociados a urgencia.`);
    if (s.el > 0) findings.push(`Se registraron ${s.el} episodio${s.el > 1 ? 's' : ''} de escape asociados a esfuerzo.`);
    if (s.avgDV !== null) {
      findings.push(s.polyMlPerKg !== null
        ? `Volumen del día registrado: ${s.avgDV} ml = ${s.polyMlPerKg} ml/kg por día registrado.`
        : `Volumen del día registrado: ${s.avgDV} ml (ml/kg no calculable, falta el peso).`);
    }
  }
  if (hasIIEF) {
    findings.push(`IIEF-5 ${iiefVal}/25: ${iiefSev.text}.`);
  }
  if (hasOAB) {
    if (oabNoUrgency(data)) findings.push('Sin urgencia miccional (AUA OAB Assessment, pregunta 1 = 0).');
    else findings.push(`AUA OAB Assessment: ${oabVal}/25 (puntuación sintomática, sin bandas de gravedad publicadas).`);
  }
  if (hasICIQ) {
    if (iciqVal === 0) findings.push('Sin incontinencia urinaria (ICIQ-SF 0/21).');
    else findings.push(`${iciqSev.text} (ICIQ-SF ${iciqVal}/21).`);
  }
  if (!findings.length) findings.push('Completa el IPSS y los cuestionarios para ver los hallazgos registrados.');

  const note = generateClinicalNote(data);
  // El bloque "Reglas clínicas aplicadas" es la cola del texto, tras el
  // separador de guiones — se muestra aparte, desplegable, para no ocupar
  // pantalla con referencias bibliográficas que el paciente no necesita
  // leer. El texto para copiar/imprimir (note completo) no cambia.
  const RULES_SEP = '\n' + '━'.repeat(44) + '\n';
  const rulesIdx = note.indexOf(RULES_SEP);
  const noteMain = rulesIdx >= 0 ? note.slice(0, rulesIdx) : note;
  const noteRules = rulesIdx >= 0 ? note.slice(rulesIdx + RULES_SEP.length) : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { alert('Selecciona el texto manualmente.'); }
  };

  const handlePrint = () => {
    const fecha = new Date().toLocaleDateString('es-ES');
    const habits = habitsLine(p);
    const scoreRows = [
      hasIPSS ? `<tr><td><b>IPSS</b></td><td>${ipssVal}/35</td><td>${ipssSev.text}</td><td>Predominio: ${ipssPredom(data.ipss)}${data.ipss.qol !== null ? ' | QoL: ' + data.ipss.qol + '/6' : ''}</td></tr>` : `<tr><td><b>IPSS</b></td><td colspan="3">cuestionario incompleto (no interpretable)</td></tr>`,
      s ? `<tr><td><b>Diario miccional</b></td><td>${s.n} de ${s.totalDays} días</td><td>CVF ${s.maxV !== null ? s.maxV + 'ml' : naText} · Vol. nocturno ${s.npI !== null ? s.npI + '%' : 'n/d'}</td><td>${nocturiaLabel(s)} · IUU ${s.ul} ep.</td></tr>` : '',
      hasIIEF ? `<tr><td><b>IIEF-5</b></td><td>${iiefVal}/25</td><td>${iiefSev.text}</td><td></td></tr>` : data.screening.iief ? `<tr><td><b>IIEF-5</b></td><td colspan="3">cuestionario incompleto (no interpretable)</td></tr>` : '',
      hasOAB ? `<tr><td><b>AUA OAB Assessment</b></td><td>${oabVal}/25</td><td>${oabNoUrgency(data) ? 'Sin urgencia miccional' : '—'}</td><td>${OAB_DISCLAIMER}</td></tr>` : data.screening.oab ? `<tr><td><b>AUA OAB Assessment</b></td><td colspan="3">cuestionario incompleto (no interpretable)</td></tr>` : '',
      padStats.avgPerDay !== null ? `<tr><td><b>Pad Test</b></td><td>${padStats.avgPerDay}g por día</td><td>—</td><td>media de ${padStats.n} día(s) registrado(s), ${padStats.dryDays} seco(s) · ${PAD_TEST_DISCLAIMER}</td></tr>` : '',
      hasICIQ ? `<tr><td><b>ICIQ-SF</b></td><td>${iciqVal}/21</td><td>${iciqSev.text}</td><td></td></tr>` : data.screening.iciq ? `<tr><td><b>ICIQ-SF</b></td><td colspan="3">cuestionario incompleto (no interpretable)</td></tr>` : '',
    ].filter(Boolean).join('');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Informe STUI — ${p.name || 'Paciente'}</title>
<style>
body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1a1a1a;font-size:14px}
h1{color:#0f766e;font-size:22px;margin-bottom:4px}.sub{color:#666;font-size:13px;margin-bottom:24px}
h2{color:#115e59;font-size:15px;border-bottom:2px solid #99f6e4;padding-bottom:6px;margin:24px 0 12px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#f0fdfa;padding:8px 10px;text-align:left;font-size:11px;color:#475569;border-bottom:2px solid #99f6e4;text-transform:uppercase}
td{padding:8px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
.algo{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:16px}
.algo h3{color:#92400e;font-size:14px;margin:0 0 10px}
.algo li{color:#78350f;margin-bottom:6px;line-height:1.5}
.note{background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:14px;font-family:monospace;font-size:12px;white-space:pre-wrap;line-height:1.8}
.footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;line-height:1.45}
@media print{body{margin:20px auto}}
</style></head><body>
<h1>Resumen Clínico STUI</h1>
<div class="sub">Paciente: <b>${p.name || '—'}</b>${p.age ? ' · ' + p.age : ''}${p.sex ? ' · ' + (p.sex === 'M' ? 'Varón' : 'Mujer') : ''}${p.weight ? ' · ' + p.weight + ' kg' : ''}${p.med ? ' · Medicación: ' + p.med : ''}${habits ? ' · ' + habits : ''} &nbsp;|&nbsp; Fecha: ${fecha}</div>
<h2>Puntuaciones</h2>
<table><thead><tr><th>Cuestionario</th><th>Puntuación</th><th>Severidad</th><th>Notas</th></tr></thead><tbody>${scoreRows || '<tr><td colspan="4" style="color:#94a3b8">Sin datos suficientes</td></tr>'}</tbody></table>
${findings.length ? `<div class="algo"><h3>📊 Hallazgos registrados</h3><ul>${findings.map((f) => `<li>${f}</li>`).join('')}</ul></div>` : ''}
${data.notes?.length ? `<h2>💬 Notas del Paciente para el Médico</h2>${data.notes.map((n) => `<div style="background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:12px;margin-bottom:8px;font-size:13px;color:#4c1d95;line-height:1.7"><div style="font-size:11px;color:#9333ea;margin-bottom:4px">${new Date(n.date).toLocaleString('es-ES')}</div><div style="white-space:pre-wrap">${n.text}</div></div>`).join('')}` : ''}
<h2>Nota para Historia Clínica</h2>
<div class="note">${note}</div>
<div class="footer"><p style="margin:0 0 6px">Documento generado automáticamente a partir de las respuestas introducidas por el paciente. Reproduce las reglas de puntuación publicadas de cada instrumento (reglas clínicas v${CLINICAL_RULES.version}). No constituye un diagnóstico ni una recomendación terapéutica: requiere interpretación por un profesional sanitario.</p><p style="margin:0">Generado con STUI App · Oficina de Salud Digital · AEU · ${fecha}</p></div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
    else alert('Tu navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio.');
  };

  // Completion badges
  const badges = [
    { label: `Diario (${daysCount}/3 días)`, done: daysCount > 0, na: false },
    { label: hasIPSS ? `IPSS ${ipssVal}/35` : 'IPSS', done: hasIPSS, na: false },
    { label: 'IIEF-5', done: !!hasIIEF, na: !data.screening.iief },
    { label: 'OAB (AUA)', done: !!hasOAB, na: !data.screening.oab },
    { label: 'ICIQ-SF', done: !!hasICIQ, na: !data.screening.iciq },
    { label: 'Pad Test', done: padStats.n > 0, na: false },
  ];

  const scoreCards = [
    hasIPSS && { title: 'IPSS', val: ipssVal, max: '/35', sev: ipssSev, accent: 'teal', extra: `${ipssPredom(data.ipss)}${data.ipss.qol !== null ? ' · QoL: ' + IPSS_QOL[data.ipss.qol] : ''}` },
    s && { title: 'Diario', val: s.avgD ?? '—', max: '/día', sev: { text: `CVF: ${s.maxV !== null ? s.maxV + 'ml' : naText}`, colorClass: 'text-slate-600 dark:text-slate-400' }, accent: 'sky', extra: `${nocturiaLabel(s)}${s.npI !== null ? ` · Vol. nocturno: ${s.npI}%` : ''} · n=${s.n} de ${s.totalDays} días válidos` },
    hasIIEF && { title: 'IIEF-5', val: iiefVal, max: '/25', sev: iiefSev, accent: 'sky', extra: null },
    hasOAB && { title: 'OAB (AUA)', val: oabVal, max: '/25', sev: oabNoUrgency(data) ? { text: 'Sin urgencia miccional', colorClass: 'text-emerald-500' } : { text: 'puntuación sintomática', colorClass: 'text-slate-500 dark:text-slate-400' }, accent: 'slate', extra: OAB_DISCLAIMER },
    padStats.avgPerDay !== null && { title: 'Pad Test', val: `${padStats.avgPerDay}g`, max: '/día', sev: { text: `media de ${padStats.n} día(s) reg., ${padStats.dryDays} seco(s)`, colorClass: 'text-slate-600 dark:text-slate-400' }, accent: 'slate', extra: PAD_TEST_DISCLAIMER },
    hasICIQ && { title: 'ICIQ-SF', val: iciqVal, max: '/21', sev: iciqSev, accent: 'teal', extra: null },
  ].filter(Boolean) as Array<{ title: string; val: number | string; max: string; sev: { text: string; colorClass: string }; accent: string; extra: string | null }>;

  const accentMap: Record<string, string> = {
    teal: 'border-teal-500',
    sky: 'border-sky-500',
    slate: 'border-slate-500',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      {/* Patient summary card */}
      {p.name && (
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-2xl p-5 text-white">
          <div className="text-lg font-black">{p.name}</div>
          <div className="text-sm text-teal-200 mt-1">{[p.age, p.sex ? (p.sex === 'M' ? '♂ Varón' : '♀ Mujer') : null, p.weight ? `${p.weight} kg` : null, p.med ? `Medicación: ${p.med}` : null, habitsLine(p) || null].filter(Boolean).join(' · ')}</div>
        </div>
      )}

      {/* Completion badges */}
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span key={b.label} className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border ${
            b.na ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
            : b.done ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800'
          }`}>
            {b.na ? '—' : b.done ? '✅' : '⏳'} {b.label}
          </span>
        ))}
      </div>

      {/* Score cards grid */}
      {scoreCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {scoreCards.map((c) => (
            <div key={c.title} className={`bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 border-t-4 ${accentMap[c.accent]}`}>
              <div className="text-sm font-black uppercase tracking-wider text-slate-600 mb-2">{c.title}</div>
              <div className="font-mono text-3xl font-black text-slate-800 dark:text-slate-100">{c.val}<span className="text-sm text-slate-600 font-normal">{c.max}</span></div>
              <div className={`text-xs font-black mt-1 ${c.sev.colorClass}`}>{c.sev.text}</div>
              {c.extra && <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-tight">{c.extra}</div>}
            </div>
          ))}
        </div>
      )}
      {s && <p className="text-xs text-slate-500 -mt-2">{PERIOD_DISCLAIMER}</p>}

      {/* Findings */}
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-2xl p-5">
        <h3 className="font-black text-sky-800 dark:text-sky-300 text-sm mb-3 flex items-center gap-2">📊 Hallazgos registrados</h3>
        <div className="space-y-2">
          {findings.map((sg, i) => (
            <div key={i} className="flex gap-2 text-sm text-sky-800 dark:text-sky-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
              {sg}
            </div>
          ))}
        </div>
      </div>

      {/* Patient notes */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-black text-purple-800 dark:text-purple-300 text-sm flex items-center gap-2">
          💬 Mis notas para el médico
          {data.notes.length > 0 && (
            <span className="text-sm bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">
              {data.notes.length}
            </span>
          )}
        </h3>

        {data.notes.length === 0 && (
          <p className="text-xs text-purple-500 dark:text-purple-400 italic">Aún no hay notas guardadas. Añade una desde aquí o desde la pantalla de inicio.</p>
        )}

        {data.notes.map((note) => (
          <div key={note.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-purple-100 dark:border-purple-800 flex gap-2 items-start">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-purple-400 font-semibold mb-1">
                {new Date(note.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
            </div>
            {onDeleteNote && (
              <button
                onClick={() => onDeleteNote(note.id)}
                className="flex-shrink-0 p-1.5 text-purple-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Eliminar nota"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}

        {/* Add new note */}
        {onAddNote && (
          <div className="pt-1 border-t border-purple-100 dark:border-purple-800">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Añadir nueva nota…"
              rows={2}
              className="w-full text-xs rounded-xl p-3 border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-purple-300 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 leading-relaxed mb-2"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteDraft.trim()}
              className="flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: noteSaved ? '#059669' : '#7c3aed', color: 'white' }}
            >
              <PlusCircle size={13} />
              {noteSaved ? '✅ Guardada' : 'Añadir nota'}
            </button>
          </div>
        )}
      </div>

      {/* Clinical note */}
      <div>
        <h3 className="font-black text-slate-700 dark:text-slate-300 text-sm mb-3 flex items-center gap-2">
          <span className="w-px h-4 bg-teal-400" />
          Nota para Historia Clínica
        </h3>
        <pre className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-2xl p-4 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">
          {noteMain}
        </pre>

        {noteRules && (
          <div className="mt-2 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRules((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-slate-500 dark:text-slate-400"
            >
              <span className="text-xs font-bold">Reglas clínicas aplicadas</span>
              {showRules ? <ChevronUp size={14} className="flex-shrink-0" /> : <ChevronDown size={14} className="flex-shrink-0" />}
            </button>
            {showRules && (
              <pre className="bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 p-4 text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {noteRules}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 no-print pb-8">
        <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-lg shadow-teal-700/25 active:scale-[0.98] min-h-[56px]">
          <Printer size={18} />
          Generar PDF para el urólogo
        </button>
        <button onClick={handleCopy} className="flex items-center justify-center gap-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold py-4 px-5 rounded-2xl text-sm transition-all border border-teal-100 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 min-h-[56px]">
          {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
