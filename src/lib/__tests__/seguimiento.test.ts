/**
 * Seguimiento entre visitas: archivo de la evaluación, comparación y
 * migración de datos antiguos. Casos sintéticos (ver fixtures.ts).
 */
import { describe, it, expect } from 'vitest';
import { appData, ipss, iief, emptyDay, entry } from './fixtures';
import {
  visitMetrics, archiveCurrentVisit, resetCurrentEvaluation, hasCurrentEvaluation,
  formatDelta, evolutionTable, evolutionText, noteWithEvolution,
} from '../followup';
import { generateClinicalNote, splitClinicalNote, CLINICAL_RULES } from '../clinical';
import { emptyData } from '../storage';

const patient = { name: 'Paciente Prueba', age: '70', sex: 'M' as const, med: 'tamsulosina', weight: '80', coffeePerDay: '2', colaPerDay: '', smoker: 'no' as const, cigarettesPerDay: '' };

// IPSS 18/35 (QoL 4) e IIEF-5 15/25
const visit1 = () => appData({
  patient,
  screening: { iief: true, oab: false, iciq: false, diary: true },
  ipss: ipss([3, 3, 2, 3, 2, 3, 2], 4),
  iief: iief([3, 3, 3, 3, 3]),
  days: [emptyDay({ wake: '08:00', sleep: '23:00', dayComplete: true, entries: [
    entry({ time: '09:00', void: 200 }), entry({ time: '13:00', void: 250 }), entry({ time: '18:00', void: 300 }),
  ] })],
});

describe('visitMetrics', () => {
  it('calcula IPSS, QoL, IIEF y diario; null en lo no realizado', () => {
    const m = visitMetrics(visit1());
    expect(m.ipss).toBe(18);
    expect(m.ipssQol).toBe(4);
    expect(m.iief).toBe(15);
    expect(m.oab).toBeNull();   // cribado "No"
    expect(m.iciq).toBeNull();
    expect(m.diaryDays).toBe(1);
    expect(m.dayFreq).toBe(3);
    expect(m.cvf).toBe(300);
    expect(m.padAvg).toBeNull();
  });
  it('un cuestionario incompleto no se archiva como puntuación', () => {
    const m = visitMetrics(appData({ ipss: ipss([3, 3, null, 3, 2, 3, 2], 4) }));
    expect(m.ipss).toBeNull();
    expect(m.ipssQol).toBeNull();
  });
  it('IIEF completo pero con cribado "No" no cuenta (misma regla que el Resumen)', () => {
    const m = visitMetrics(appData({ screening: { iief: false, oab: null, iciq: null, diary: null }, iief: iief([3, 3, 3, 3, 3]) }));
    expect(m.iief).toBeNull();
  });
  it('sin diario, las métricas del diario son null (no 0)', () => {
    const m = visitMetrics(appData({ ipss: ipss([1, 1, 1, 1, 1, 1, 1], 2) }));
    expect(m.diaryDays).toBeNull();
    expect(m.uui).toBeNull();
    expect(m.sui).toBeNull();
  });
});

describe('archiveCurrentVisit', () => {
  const now = new Date('2026-03-12T10:00:00Z');
  const after = archiveCurrentVisit(visit1(), now);

  it('añade la visita al historial con fecha, versión de reglas y métricas', () => {
    expect(after.history).toHaveLength(1);
    expect(after.history[0].closedAt).toBe(now.toISOString());
    expect(after.history[0].rulesVersion).toBe(CLINICAL_RULES.version);
    expect(after.history[0].metrics.ipss).toBe(18);
    expect(after.history[0].snapshot.ipss.q).toEqual([3, 3, 2, 3, 2, 3, 2]);
  });
  it('conserva el perfil y vacía la evaluación', () => {
    expect(after.patient).toEqual(patient);
    const empty = emptyData();
    expect(after.ipss).toEqual(empty.ipss);
    expect(after.iief).toEqual(empty.iief);
    expect(after.screening).toEqual(empty.screening);
    expect(after.days).toEqual(empty.days);
    expect(after.notes).toEqual([]);
    expect(hasCurrentEvaluation(after)).toBe(false);
  });
  it('el snapshot es una copia: cambiar la evaluación nueva no altera la archivada', () => {
    const src = visit1();
    const a = archiveCurrentVisit(src, now);
    src.ipss.q[0] = 0;
    expect(a.history[0].snapshot.ipss.q[0]).toBe(3);
  });
  it('el snapshot no anida el historial anterior', () => {
    const twice = archiveCurrentVisit({ ...visit1(), history: after.history }, now);
    expect(twice.history).toHaveLength(2);
    expect('history' in twice.history[1].snapshot).toBe(false);
  });
});

describe('resetCurrentEvaluation (Sala de Espera, paciente nuevo)', () => {
  it('vacía todo, perfil incluido, pero conserva el historial', () => {
    const withHistory = { ...visit1(), history: archiveCurrentVisit(visit1()).history };
    const r = resetCurrentEvaluation(withHistory);
    expect(r.history).toHaveLength(1);
    expect(r.patient.name).toBe('');
    expect(hasCurrentEvaluation(r)).toBe(false);
  });
});

describe('formatDelta', () => {
  it('diferencias neutras con signo', () => {
    expect(formatDelta(18, 11)).toBe('−7');
    expect(formatDelta(11, 13)).toBe('+2');
    expect(formatDelta(5, 5)).toBe('=');
    expect(formatDelta(8.3, 6.1)).toBe('−2.2');
  });
  it('— si falta el dato en cualquiera de las dos', () => {
    expect(formatDelta(null, 5)).toBe('—');
    expect(formatDelta(5, null)).toBe('—');
  });
});

describe('evolutionTable / evolutionText', () => {
  const v1 = archiveCurrentVisit(visit1(), new Date('2026-03-12T10:00:00Z'));
  const current = { ...v1, screening: { iief: true, oab: false, iciq: false, diary: false }, ipss: ipss([2, 2, 1, 2, 1, 2, 1], 3), iief: iief([4, 4, 4, 4, 4]) };

  it('una columna por visita + Actual + Cambio frente a la anterior', () => {
    const t = evolutionTable(current);
    expect(t.header).toEqual(['Medida', '12/03/26', 'Actual', 'Cambio']);
    expect(t.rows.find((r) => r[0].startsWith('IPSS ('))).toEqual(['IPSS (0-35)', '18', '11', '−7']);
    expect(t.rows.find((r) => r[0].startsWith('IIEF'))).toEqual(['IIEF-5 (máx. 25)', '15', '20', '+5']);
    // diario hecho antes y no ahora → fila presente, cambio "—"
    expect(t.rows.find((r) => r[0] === 'CVF (ml)')).toEqual(['CVF (ml)', '300', '—', '—']);
    // métricas sin datos en ninguna visita no aparecen
    expect(t.rows.some((r) => r[0].startsWith('ICIQ'))).toBe(false);
  });
  it('maxVisits limita las columnas a las visitas más recientes', () => {
    const many = { ...current, history: [v1.history[0], v1.history[0], v1.history[0], v1.history[0], v1.history[0], v1.history[0]] };
    expect(evolutionTable(many, 4).header).toHaveLength(1 + 4 + 2);
  });
  it('sin historial no hay bloque de evolución en la nota', () => {
    const d = visit1();
    const note = generateClinicalNote(d);
    expect(evolutionText(d)).toBe('');
    expect(noteWithEvolution(note, d)).toBe(note);
  });
  it('la evolución va en el cuerpo de la nota, antes del pie de reglas clínicas', () => {
    const note = noteWithEvolution(generateClinicalNote(current), current);
    const { main, rules } = splitClinicalNote(note);
    expect(main).toContain('EVOLUCIÓN (1 evaluación anterior)');
    expect(main).toContain('• IPSS (0-35): 18 (12/03/26) → 11 (Actual) | cambio: −7');
    expect(rules).toContain('Reglas clínicas aplicadas');
    expect(rules).not.toContain('EVOLUCIÓN');
  });
});

describe('migración', () => {
  it('datos guardados antes del seguimiento (sin history) reciben history vacío', async () => {
    const { importBackup } = await import('../storage');
    const old = visit1() as Partial<ReturnType<typeof visit1>>;
    delete old.history;
    const file = new File([JSON.stringify({ version: 2, app: 'STUI_App', data: old })], 'b.json');
    const restored = await importBackup(file);
    expect(restored.history).toEqual([]);
    expect(restored.ipss.q).toEqual([3, 3, 2, 3, 2, 3, 2]);
  });
});
