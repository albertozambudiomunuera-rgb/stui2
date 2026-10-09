// ESTUDIO-VALIDACION — bloque de la encuesta para la nota y el PDF, separado
// del contenido clínico con líneas dobles (═). No se usa ━, que es el
// separador del pie de reglas clínicas (ver splitClinicalNote).
import type { StudySurvey } from '../types';
import { RULES_FOOTER_SEP, splitClinicalNote } from '../lib/clinical';
import { STUDY_SURVEY_ENABLED } from './config';
import { SUS_ITEMS } from './instruments';
import { susScore, answeredCount, totalItems } from './scoring';

export const STUDY_TITLE = 'ESTUDIO DE VALIDACIÓN — USABILIDAD';
export const STUDY_NOTICE = 'Datos de investigación: no forman parte de la valoración clínica.';
const LINE = '═'.repeat(44);

const fmt = (n: number) => String(n).replace('.', ',');
const answersLine = (a: (number | null)[]) => a.map((v) => (v === null ? '—' : String(v))).join(',');

function hasAnswers(s: StudySurvey | undefined): s is StudySurvey {
  return !!s && answeredCount(s) > 0;
}

export interface StudyReport {
  title: string;
  notice: string;
  status: string;
  /** [escala, puntuación] */
  scores: string[][];
  /** [escala, respuestas ítem a ítem] */
  answers: string[][];
}

export function studyReport(s: StudySurvey | undefined): StudyReport | null {
  if (!STUDY_SURVEY_ENABLED || !hasAnswers(s)) return null;
  const n = answeredCount(s);
  const total = totalItems();
  const sus = susScore(s.sus);
  const scores: string[][] = [['SUS (0-100)', sus === null ? 'incompleto' : fmt(sus)]];
  const answers: string[][] = [[`SUS ítems 1-${SUS_ITEMS.length}`, answersLine(s.sus)]];
  return {
    title: STUDY_TITLE,
    notice: STUDY_NOTICE,
    status: n === total ? 'Encuesta completa' : `Encuesta incompleta (${n}/${total} respuestas)`,
    scores,
    answers,
  };
}

export function studyText(s: StudySurvey | undefined): string {
  const r = studyReport(s);
  if (!r) return '';
  let t = `${LINE}\n${r.title}\n${r.notice}\n${r.status}\n`;
  for (const [k, v] of r.scores) t += `• ${k}: ${v}\n`;
  for (const [k, v] of r.answers) t += `${k}: ${v}\n`;
  t += `${LINE}\n`;
  return t;
}

/** Inserta el bloque del estudio al final del cuerpo de la nota, antes del
 * pie de "Reglas clínicas aplicadas". */
export function noteWithStudy(note: string, s: StudySurvey | undefined): string {
  const block = studyText(s);
  if (!block) return note;
  const { main, rules } = splitClinicalNote(note);
  return rules ? `${main}\n${block}${RULES_FOOTER_SEP}${rules}` : `${main}\n\n${block}`;
}
