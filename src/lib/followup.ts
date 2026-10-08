// Seguimiento entre visitas (Modo Casa).
//
// El paciente rellena una evaluación, la lleva a consulta y, después, empieza
// un nuevo registro: la evaluación actual se archiva en data.history con sus
// valores ya calculados, y en la siguiente revisión se comparan sin hacer
// cálculos a mano. Como el resto de la app, solo se muestran valores y
// diferencias: no hay umbrales ni juicios de mejor/peor.
import type { AppData, Visit, VisitMetrics } from '../types';
import { emptyData } from './storage';
import {
  CLINICAL_RULES, RULES_FOOTER_SEP, splitClinicalNote, uid,
  ipssComplete, ipssScore, iiefComplete, iiefScore, oabComplete, oabScore,
  iciqComplete, iciqScore, computeStats, padDayStats,
} from './clinical';

export function visitMetrics(data: AppData): VisitMetrics {
  const s = data.days.some((d) => d.entries.length > 0) ? computeStats(data) : null;
  const pad = padDayStats(data);
  return {
    ipss: ipssComplete(data.ipss) ? ipssScore(data.ipss) : null,
    ipssQol: ipssComplete(data.ipss) ? data.ipss.qol : null,
    iief: data.screening.iief && iiefComplete(data.iief) ? iiefScore(data.iief) : null,
    oab: data.screening.oab && oabComplete(data) ? oabScore(data) : null,
    iciq: data.screening.iciq && iciqComplete(data) ? iciqScore(data) : null,
    diaryDays: s ? s.n : null,
    dayFreq: s?.avgD ?? null,
    nocturia: s ? (s.nocturiaCount ?? s.avgN) : null,
    nocturiaKind: s ? (s.nocturiaCount !== null ? 'ics' : s.avgN !== null ? 'ventana' : null) : null,
    cvf: s?.maxV ?? null,
    avgVoid: s?.avgV ?? null,
    nocturnalPct: s?.npI ?? null,
    dayVolume: s?.avgDV ?? null,
    urgencyPerDay: s?.avgS ?? null,
    uui: s ? s.ul : null,
    sui: s ? s.el : null,
    padAvg: pad.avgPerDay,
  };
}

/** ¿Hay algo rellenado en la evaluación actual que merezca archivarse? */
export function hasCurrentEvaluation(data: AppData): boolean {
  return data.ipss.q.some((v) => v !== null)
    || data.ipss.qol !== null
    || data.iief.q.some((v) => v !== null)
    || data.oab.q.some((v) => v !== null)
    || data.iciq.q.some((v) => v !== null)
    || data.days.some((d) => d.entries.length > 0 || (d.pads?.length ?? 0) > 0)
    || data.notes.length > 0;
}

/**
 * Archiva la evaluación actual en el historial y deja una evaluación nueva
 * vacía. El perfil (nombre, edad, sexo, medicación, peso, hábitos) se
 * conserva: el paciente puede actualizarlo en el nuevo registro.
 */
export function archiveCurrentVisit(data: AppData, now: Date = new Date()): AppData {
  const { history, ...snapshot } = data;
  const visit: Visit = {
    id: uid(),
    closedAt: now.toISOString(),
    rulesVersion: CLINICAL_RULES.version,
    snapshot: structuredClone(snapshot),
    metrics: visitMetrics(data),
  };
  return { ...emptyData(), patient: { ...data.patient }, history: [...history, visit] };
}

/** Vacía la evaluación actual (paciente nuevo) sin tocar el historial. */
export function resetCurrentEvaluation(data: AppData): AppData {
  return { ...emptyData(), history: data.history };
}

// ─── Comparación ────────────────────────────────────────────────────────

interface MetricDef {
  key: Exclude<keyof VisitMetrics, 'nocturiaKind'>;
  label: string;
}

export const EVOLUTION_METRICS: MetricDef[] = [
  { key: 'ipss', label: 'IPSS (0-35)' },
  { key: 'ipssQol', label: 'IPSS · Calidad de vida (0-6)' },
  { key: 'iief', label: 'IIEF-5 (máx. 25)' },
  { key: 'oab', label: 'AUA OAB (0-25)' },
  { key: 'iciq', label: 'ICIQ-SF (0-21)' },
  { key: 'diaryDays', label: 'Diario · días válidos' },
  { key: 'dayFreq', label: 'Micciones diurnas/día' },
  { key: 'nocturia', label: 'Nocturia/noche' },
  { key: 'cvf', label: 'CVF (ml)' },
  { key: 'avgVoid', label: 'Volumen miccional medio (ml)' },
  { key: 'nocturnalPct', label: 'Volumen nocturno (%)' },
  { key: 'dayVolume', label: 'Volumen del día registrado (ml)' },
  { key: 'urgencyPerDay', label: 'Urgencia intensa/día' },
  { key: 'uui', label: 'Escapes por urgencia' },
  { key: 'sui', label: 'Escapes por esfuerzo' },
  { key: 'padAvg', label: 'Pad test (g/día)' },
];

export function formatDelta(prev: number | null, cur: number | null): string {
  if (prev === null || cur === null) return '—';
  const d = Math.round((cur - prev) * 10) / 10;
  if (d === 0) return '=';
  return d > 0 ? `+${d}` : `−${Math.abs(d)}`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export interface EvolutionTable {
  header: string[];
  rows: string[][];
  /** Nota a pie si la nocturia mezcla definición ICS y ventana declarada. */
  footnotes: string[];
}

/**
 * Tabla de evolución: una fila por métrica con algún dato, una columna por
 * visita archivada (las `maxVisits` más recientes), "Actual" y "Cambio"
 * (actual frente a la última visita archivada).
 */
export function evolutionTable(data: AppData, maxVisits = Infinity): EvolutionTable {
  const visits = data.history.slice(-maxVisits);
  const cur = visitMetrics(data);
  const cols = [...visits.map((v) => v.metrics), cur];
  const prev = data.history.length ? data.history[data.history.length - 1].metrics : null;

  const rows = EVOLUTION_METRICS
    .filter((m) => cols.some((c) => c[m.key] !== null))
    .map((m) => [
      m.label,
      ...cols.map((c) => (c[m.key] === null ? '—' : String(c[m.key]))),
      prev ? formatDelta(prev[m.key], cur[m.key]) : '—',
    ]);

  const footnotes: string[] = [];
  const kinds = new Set(cols.map((c) => c.nocturiaKind).filter(Boolean));
  if (kinds.size > 1) {
    footnotes.push('Nocturia: algunas visitas usan la definición ICS (desde la hora de conciliación del sueño) y otras la ventana nocturna declarada; no son directamente comparables.');
  }
  const versions = new Set(visits.map((v) => v.rulesVersion).concat(CLINICAL_RULES.version));
  if (versions.size > 1) {
    footnotes.push(`Los valores de cada visita se calcularon con las reglas clínicas vigentes en su momento (${[...versions].map((v) => 'v' + v).join(', ')}).`);
  }

  return {
    header: ['Medida', ...visits.map((v) => shortDate(v.closedAt)), 'Actual', 'Cambio'],
    rows,
    footnotes,
  };
}

/** Bloque de texto "EVOLUCIÓN" para la nota de Historia Clínica. */
export function evolutionText(data: AppData): string {
  if (!data.history.length) return '';
  const t = evolutionTable(data);
  const dates = t.header.slice(1, -1);
  const n = data.history.length;
  let out = `EVOLUCIÓN (${n} ${n === 1 ? 'evaluación anterior' : 'evaluaciones anteriores'})\n`;
  for (const r of t.rows) {
    const values = r.slice(1, -1).map((v, i) => `${v} (${dates[i]})`).join(' → ');
    out += `• ${r[0]}: ${values} | cambio: ${r[r.length - 1]}\n`;
  }
  for (const f of t.footnotes) out += `${f}\n`;
  out += 'Cambio = evaluación actual frente a la anterior. Sin interpretación clínica.\n';
  return out;
}

/** Inserta el bloque de evolución al final del cuerpo de la nota, antes del
 * pie de "Reglas clínicas aplicadas". */
export function noteWithEvolution(note: string, data: AppData): string {
  const evo = evolutionText(data);
  if (!evo) return note;
  const { main, rules } = splitClinicalNote(note);
  return rules ? `${main}\n${evo}${RULES_FOOTER_SEP}${rules}` : `${main}\n\n${evo}`;
}
