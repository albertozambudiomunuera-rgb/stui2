/**
 * ESTUDIO-VALIDACION — puntuación SUS y bloque del informe.
 * Casos sintéticos calculados a mano.
 */
import { describe, it, expect } from 'vitest';
import { susScore, emptyStudy, normalizeStudy, isStudyComplete } from '../../study/scoring';
import { noteWithStudy, studyReport, studyText } from '../../study/report';
import { SUS_ITEMS } from '../../study/instruments';
import { generateClinicalNote, splitClinicalNote } from '../clinical';
import { archiveCurrentVisit, resetCurrentEvaluation } from '../followup';
import { appData, ipss } from './fixtures';

describe('SUS', () => {
  it('10 ítems literales', () => expect(SUS_ITEMS).toHaveLength(10));
  it('todo 3 → 50', () => expect(susScore(Array(10).fill(3))).toBe(50));
  it('patrón ideal (impares 5, pares 1) → 100', () => expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100));
  it('patrón peor (impares 1, pares 5) → 0', () => expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0));
  it('caso mixto calculado a mano: 4,2,5,1,4,2,4,1,5,2 → 85', () => {
    // impares: 3+4+3+3+4 = 17 · pares: 3+4+3+4+3 = 17 · 34 × 2,5 = 85
    expect(susScore([4, 2, 5, 1, 4, 2, 4, 1, 5, 2])).toBe(85);
  });
  it('incompleto → null', () => expect(susScore([4, 2, 5, 1, 4, 2, 4, 1, 5, null])).toBeNull());
});

describe('bloque del informe', () => {
  const study = { ...emptyStudy(), sus: [4, 2, 5, 1, 4, 2, 4, 1, 5, 2], prompted: true };

  it('sin respuestas no hay bloque', () => {
    expect(studyReport(undefined)).toBeNull();
    expect(studyReport(emptyStudy())).toBeNull();
    expect(studyText(emptyStudy())).toBe('');
  });
  it('va entre líneas ═ en el cuerpo de la nota y no rompe el pie de reglas', () => {
    const d = appData({ ipss: ipss([1, 1, 1, 1, 1, 1, 1], 2), study });
    const note = noteWithStudy(generateClinicalNote(d), d.study);
    const { main, rules } = splitClinicalNote(note);
    expect(main).toContain('═'.repeat(44) + '\nESTUDIO DE VALIDACIÓN — USABILIDAD');
    expect(main).toContain('• SUS (0-100): 85');
    expect(main).toContain('SUS ítems 1-10: 4,2,5,1,4,2,4,1,5,2');
    expect(rules).toContain('Reglas clínicas aplicadas');
    expect(rules).not.toContain('ESTUDIO');
  });
  it('encuesta parcial: lo indica y no puntúa la escala incompleta', () => {
    const partial = { ...emptyStudy(), sus: [4, 2, 5, null, null, null, null, null, null, null] };
    const r = studyReport(partial)!;
    expect(r.status).toBe('Encuesta incompleta (3/10 respuestas)');
    expect(r.scores[0]).toEqual(['SUS (0-100)', 'incompleto']);
    expect(isStudyComplete(normalizeStudy(partial))).toBe(false);
  });
});

describe('encuesta y seguimiento', () => {
  const study = { ...emptyStudy(), sus: Array(10).fill(3), prompted: true };
  it('un nuevo registro conserva la encuesta (es sobre la app, mismo paciente)', () => {
    const after = archiveCurrentVisit(appData({ ipss: ipss([1, 1, 1, 1, 1, 1, 1], 2), study }));
    expect(after.study).toEqual(study);
  });
  it('Sala de Espera → paciente nuevo: la encuesta se vacía', () => {
    const r = resetCurrentEvaluation(appData({ study }));
    expect(r.study).toBeUndefined();
  });
});
