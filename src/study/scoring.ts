// ESTUDIO-VALIDACION — puntuación del SUS. Solo el valor, sin adjetivos ni
// bandas: la interpretación la hace el equipo en el análisis.
import type { StudySurvey } from '../types';
import { SUS_ITEMS } from './instruments';

export function emptyStudy(): StudySurvey {
  return { sus: SUS_ITEMS.map(() => null), prompted: false, completedAt: null };
}

/** Normaliza una encuesta guardada (versiones anteriores podían incluir más campos). */
export function normalizeStudy(s: StudySurvey | undefined): StudySurvey {
  const base = emptyStudy();
  if (!s) return base;
  return { sus: base.sus.map((_, i) => s.sus?.[i] ?? null), prompted: !!s.prompted, completedAt: s.completedAt ?? null };
}

/** SUS 0-100: impares (r − 1), pares (5 − r), suma × 2,5. null si falta algún ítem. */
export function susScore(sus: (number | null)[]): number | null {
  if (sus.length !== 10 || sus.some((v) => v === null)) return null;
  const sum = (sus as number[]).reduce((acc, r, i) => acc + (i % 2 === 0 ? r - 1 : 5 - r), 0);
  return sum * 2.5;
}

export function answeredCount(s: StudySurvey): number {
  return s.sus.filter((v) => v !== null).length;
}

export function totalItems(): number {
  return SUS_ITEMS.length;
}

export function isStudyComplete(s: StudySurvey): boolean {
  return answeredCount(s) === totalItems();
}
