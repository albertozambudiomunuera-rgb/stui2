// ESTUDIO-VALIDACION — puntuación de SUS y uMARS. Solo valores, sin
// adjetivos ni bandas: la interpretación la hace el equipo en el análisis.
import type { StudySurvey, UmarsAnswer } from '../types';
import { SUS_ITEMS, UMARS_SECTIONS, UMARS_ITEM_COUNT, type UmarsSection } from './instruments';

export function emptyStudy(): StudySurvey {
  return { sus: SUS_ITEMS.map(() => null), umars: Array(UMARS_ITEM_COUNT).fill(null), prompted: false, completedAt: null };
}

/** Normaliza una encuesta guardada (p. ej. si cambia el número de ítems). */
export function normalizeStudy(s: StudySurvey | undefined): StudySurvey {
  const base = emptyStudy();
  if (!s) return base;
  return {
    ...base,
    ...s,
    sus: base.sus.map((_, i) => s.sus?.[i] ?? null),
    umars: base.umars.map((_, i) => s.umars?.[i] ?? null),
  };
}

/** SUS 0-100: impares (r − 1), pares (5 − r), suma × 2,5. null si falta algún ítem. */
export function susScore(sus: (number | null)[]): number | null {
  if (sus.length !== 10 || sus.some((v) => v === null)) return null;
  const sum = (sus as number[]).reduce((acc, r, i) => acc + (i % 2 === 0 ? r - 1 : 5 - r), 0);
  return sum * 2.5;
}

function sectionOffset(section: UmarsSection): number {
  let off = 0;
  for (const s of UMARS_SECTIONS) {
    if (s === section) return off;
    off += s.items.length;
  }
  return off;
}

/** Media de una subescala uMARS excluyendo "No aplica". null si falta algún
 * ítem o si todos son "No aplica". */
export function umarsSectionMean(answers: UmarsAnswer[], section: UmarsSection): number | null {
  const off = sectionOffset(section);
  const vals = section.items.map((_, i) => answers[off + i] ?? null);
  if (!vals.length || vals.some((v) => v === null)) return null;
  const nums = vals.filter((v): v is number => typeof v === 'number');
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

export interface UmarsScores {
  sections: { id: UmarsSection['id']; title: string; mean: number | null }[];
  /** Calidad de la app: media de las 4 subescalas objetivas (Stoyanov 2016). */
  appQuality: number | null;
}

export function umarsScores(answers: UmarsAnswer[]): UmarsScores {
  const sections = UMARS_SECTIONS.map((s) => ({ id: s.id, title: s.title, mean: umarsSectionMean(answers, s) }));
  const obj = UMARS_SECTIONS.map((s, i) => (s.objective ? sections[i].mean : undefined)).filter((m) => m !== undefined);
  const appQuality = obj.length && obj.every((m) => m !== null)
    ? Math.round(((obj as number[]).reduce((a, b) => a + b, 0) / obj.length) * 100) / 100
    : null;
  return { sections, appQuality };
}

export function answeredCount(s: StudySurvey): number {
  return s.sus.filter((v) => v !== null).length + s.umars.filter((v) => v !== null).length;
}

export function totalItems(): number {
  return SUS_ITEMS.length + UMARS_ITEM_COUNT;
}

export function isStudyComplete(s: StudySurvey): boolean {
  return answeredCount(s) === totalItems();
}
