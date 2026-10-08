// Tiempo de uso de la app por sesión, para el informe clínico.
//
// Solo cuenta el tiempo con la app visible en pantalla dentro de un modo
// (Casa o Sala de Espera), no la pantalla de bienvenida. Una salida breve
// (cambiar de app, bloquear el móvil) de hasta SESSION_GAP_MS continúa la
// misma sesión, sin contar el tiempo fuera; una ausencia más larga abre una
// sesión nueva. Las sesiones pertenecen a la evaluación actual: al empezar
// un nuevo registro se archivan con ella (ver followup.ts).
import type { UsageMode, UsageSession } from '../types';
import { RULES_FOOTER_SEP, splitClinicalNote } from './clinical';

export const SESSION_GAP_MS = 5 * 60 * 1000;

/** Suma `seconds` de uso activo terminado en `now` a la sesión en curso o
 * abre una nueva. Función pura: devuelve un array nuevo. */
export function recordUsage(usage: UsageSession[], mode: UsageMode, seconds: number, now: Date): UsageSession[] {
  if (seconds <= 0) return usage;
  const last = usage[usage.length - 1];
  const startOfChunk = now.getTime() - seconds * 1000;
  if (last && last.mode === mode && startOfChunk - Date.parse(last.lastActive) <= SESSION_GAP_MS) {
    return [...usage.slice(0, -1), { ...last, seconds: last.seconds + seconds, lastActive: now.toISOString() }];
  }
  return [...usage, { start: new Date(startOfChunk).toISOString(), lastActive: now.toISOString(), seconds, mode }];
}

export function formatDuration(totalSec: number): string {
  const s = Math.round(totalSec);
  if (s < 60) return `${s} s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
  return sec ? `${m} min ${sec} s` : `${m} min`;
}

const MODE_LABEL: Record<UsageMode, string> = { casa: 'Modo Casa', sala: 'Sala de Espera' };

function when(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Con muchas sesiones (p. ej. una por cada micción del diario de 3 días) el
// detalle se agrupa por día para no alargar el informe.
const MAX_DETAILED = 10;

export interface UsageSummary {
  sessions: number;
  totalSec: number;
  /** Filas de detalle: [sesión o día, inicio, modo o nº sesiones, duración]. */
  header: string[];
  rows: string[][];
}

export function usageSummary(usage: UsageSession[]): UsageSummary | null {
  const valid = usage.filter((u) => u.seconds > 0);
  if (!valid.length) return null;
  const totalSec = valid.reduce((s, u) => s + u.seconds, 0);

  if (valid.length <= MAX_DETAILED) {
    return {
      sessions: valid.length,
      totalSec,
      header: ['Sesión', 'Inicio', 'Modo', 'Duración'],
      rows: valid.map((u, i) => [String(i + 1), when(u.start), MODE_LABEL[u.mode], formatDuration(u.seconds)]),
    };
  }

  const byDay = new Map<string, { n: number; sec: number; first: string }>();
  for (const u of valid) {
    const day = new Date(u.start).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const d = byDay.get(day) ?? { n: 0, sec: 0, first: u.start };
    d.n += 1;
    d.sec += u.seconds;
    byDay.set(day, d);
  }
  return {
    sessions: valid.length,
    totalSec,
    header: ['Día', 'Primera sesión', 'Sesiones', 'Duración'],
    rows: [...byDay.entries()].map(([day, d]) => [day, when(d.first), String(d.n), formatDuration(d.sec)]),
  };
}

/** Bloque de texto para la nota de Historia Clínica. */
export function usageText(usage: UsageSession[]): string {
  const s = usageSummary(usage);
  if (!s) return '';
  const avg = s.totalSec / s.sessions;
  let t = `TIEMPO DE USO DE LA APP: ${formatDuration(s.totalSec)} en ${s.sessions} ${s.sessions === 1 ? 'sesión' : 'sesiones'} (media ${formatDuration(avg)}/sesión)\n`;
  for (const r of s.rows) {
    t += s.header[0] === 'Sesión'
      ? `• Sesión ${r[0]} · ${r[1]} · ${r[2]} · ${r[3]}\n`
      : `• ${r[0]}: ${r[2]} sesiones · ${r[3]}\n`;
  }
  t += 'Solo cuenta el tiempo con la app en pantalla; una ausencia de más de 5 min abre una sesión nueva.\n';
  return t;
}

/** Inserta el bloque de tiempo de uso al final del cuerpo de la nota, antes
 * del pie de "Reglas clínicas aplicadas". */
export function noteWithUsage(note: string, usage: UsageSession[]): string {
  const block = usageText(usage);
  if (!block) return note;
  const { main, rules } = splitClinicalNote(note);
  return rules ? `${main}\n${block}${RULES_FOOTER_SEP}${rules}` : `${main}\n\n${block}`;
}
