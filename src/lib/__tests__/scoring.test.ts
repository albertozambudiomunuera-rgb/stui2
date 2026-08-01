/**
 * scoring.test.ts — Verificación de los algoritmos de puntuación de STUIapp.
 *
 * PROPÓSITO
 * El manuscrito afirma que la puntuación automática elimina los errores
 * aritméticos del cálculo manual en papel. Esa afirmación no puede sostenerse
 * sin verificación formal. Esta batería es esa verificación.
 *
 * MÉTODO
 * Casos sintéticos con puntuaciones esperadas calculadas manualmente a partir
 * de las instrucciones publicadas de cada instrumento. Se cubren:
 *   · valores mínimos y máximos de cada escala
 *   · los umbrales de gravedad y sus dos lados (n y n+1)
 *   · campos vacíos y valores nulos
 *   · casos límite del diario miccional (cruce de medianoche, sondaje,
 *     primera micción matutina, poliuria nocturna)
 *
 * Ningún dato procede de pacientes reales.
 */

import { describe, it, expect } from 'vitest';
import {
  ipssScore, ipssComplete, ipssSeverity, ipssPredom,
  iiefScore, iiefSeverity,
  oabScore,
  iciqScore, iciqSeverity,
  padSeverity,
  toMin, isNight,
  computeStats,
} from '../clinical';
import { appData, emptyDay, entry, pad, ipss, iief, oab, iciq } from './fixtures';

// ═══════════════════════════════════════════════════════════════════
// IPSS — International Prostate Symptom Score
// 7 ítems, 0-5 cada uno. Total 0-35.
// Leve 0-7 · Moderado 8-19 · Grave 20-35
// ═══════════════════════════════════════════════════════════════════

describe('IPSS', () => {
  it('mínimo: todos los ítems a 0 → 0', () => {
    expect(ipssScore(ipss([0, 0, 0, 0, 0, 0, 0]))).toBe(0);
  });

  it('máximo: todos los ítems a 5 → 35', () => {
    expect(ipssScore(ipss([5, 5, 5, 5, 5, 5, 5]))).toBe(35);
  });

  it('caso intermedio calculado a mano: 3+0+2+4+1+5+2 = 17', () => {
    expect(ipssScore(ipss([3, 0, 2, 4, 1, 5, 2]))).toBe(17);
  });

  it('trata los nulos como 0 sin romper la suma', () => {
    expect(ipssScore(ipss([3, null, 2, null, 1, null, 2]))).toBe(8);
  });

  describe('umbrales de gravedad', () => {
    it('7 → Leve (límite superior)', () => {
      expect(ipssSeverity(7).text).toBe('Leve');
    });
    it('8 → Moderado (límite inferior)', () => {
      expect(ipssSeverity(8).text).toBe('Moderado');
    });
    it('19 → Moderado (límite superior)', () => {
      expect(ipssSeverity(19).text).toBe('Moderado');
    });
    it('20 → Grave (límite inferior)', () => {
      expect(ipssSeverity(20).text).toBe('Grave');
    });
    it('0 → Leve', () => expect(ipssSeverity(0).text).toBe('Leve'));
    it('35 → Grave', () => expect(ipssSeverity(35).text).toBe('Grave'));
  });

  describe('completitud', () => {
    it('detecta cuestionario completo', () => {
      expect(ipssComplete(ipss([0, 1, 2, 3, 4, 5, 0]))).toBe(true);
    });
    it('detecta un solo ítem sin responder', () => {
      expect(ipssComplete(ipss([0, 1, 2, null, 4, 5, 0]))).toBe(false);
    });
    it('un 0 es respuesta válida, no ausencia', () => {
      expect(ipssComplete(ipss([0, 0, 0, 0, 0, 0, 0]))).toBe(true);
    });
  });

  describe('predominio sintomático', () => {
    // Llenado (irritativo)  = Q2 frecuencia + Q4 urgencia + Q7 nicturia
    // Vaciado (obstructivo) = Q1 vaciado incompleto + Q3 intermitencia
    //                       + Q5 chorro débil + Q6 esfuerzo
    it('llenado puro → Llenado (Irritativo)', () => {
      expect(ipssPredom(ipss([0, 5, 0, 5, 0, 0, 5]))).toBe('Llenado (Irritativo)');
    });
    it('vaciado puro → Vaciado (Obstructivo)', () => {
      expect(ipssPredom(ipss([5, 0, 5, 0, 5, 5, 0]))).toBe('Vaciado (Obstructivo)');
    });
    it('empate exacto → Mixto', () => {
      // llenado 2+2+2=6 · vaciado 2+2+1+1=6
      expect(ipssPredom(ipss([2, 2, 2, 2, 1, 1, 2]))).toBe('Mixto');
    });
    it('todo a cero → Mixto', () => {
      expect(ipssPredom(ipss([0, 0, 0, 0, 0, 0, 0]))).toBe('Mixto');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// IIEF-5 — 5 ítems, 0-5. Total 0-25.
// Sin DE 22-25 · Leve 17-21 · Leve-moderada 12-16 · Moderada 8-11 · Severa 0-7
// ═══════════════════════════════════════════════════════════════════

describe('IIEF-5', () => {
  it('mínimo → 0', () => expect(iiefScore(iief([0, 0, 0, 0, 0]))).toBe(0));
  it('máximo → 25', () => expect(iiefScore(iief([5, 5, 5, 5, 5]))).toBe(25));
  it('caso a mano: 4+3+5+2+1 = 15', () => {
    expect(iiefScore(iief([4, 3, 5, 2, 1]))).toBe(15);
  });
  it('nulos como 0', () => {
    expect(iiefScore(iief([4, null, 5, null, 1]))).toBe(10);
  });

  describe('umbrales de gravedad', () => {
    const casos: [number, string][] = [
      [25, 'Sin disfunción eréctil'],
      [22, 'Sin disfunción eréctil'],
      [21, 'DE leve'],
      [17, 'DE leve'],
      [16, 'DE leve-moderada'],
      [12, 'DE leve-moderada'],
      [11, 'DE moderada'],
      [8, 'DE moderada'],
      [7, 'DE severa'],
      [0, 'DE severa'],
    ];
    casos.forEach(([sc, esperado]) => {
      it(`${sc} → ${esperado}`, () => expect(iiefSeverity(sc).text).toBe(esperado));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// AUA OAB Assessment — 5 ítems de síntomas, 0-5. Total 0-25.
// (NO es el OAB-q de Coyne et al., que es propietario)
// ═══════════════════════════════════════════════════════════════════

describe('AUA OAB Assessment', () => {
  it('mínimo → 0', () => {
    expect(oabScore(appData({ oab: oab([0, 0, 0, 0, 0]) }))).toBe(0);
  });
  it('máximo → 25', () => {
    expect(oabScore(appData({ oab: oab([5, 5, 5, 5, 5]) }))).toBe(25);
  });
  it('caso a mano: 1+2+3+4+5 = 15', () => {
    expect(oabScore(appData({ oab: oab([1, 2, 3, 4, 5]) }))).toBe(15);
  });
  it('nulos como 0', () => {
    expect(oabScore(appData({ oab: oab([1, null, 3, null, 5]) }))).toBe(9);
  });
});

// ═══════════════════════════════════════════════════════════════════
// ICIQ-SF — Q1 (0-5) + Q2 (0,2,4,6) + Q3 VAS (0-10). Total 0-21.
// Sin IU 0 · Leve 1-5 · Moderada 6-12 · Grave 13-21
// ═══════════════════════════════════════════════════════════════════

describe('ICIQ-SF', () => {
  it('mínimo → 0', () => {
    expect(iciqScore(appData({ iciq: iciq([0, 0], 0) }))).toBe(0);
  });
  it('máximo → 21 (5 + 6 + 10)', () => {
    expect(iciqScore(appData({ iciq: iciq([5, 6], 10) }))).toBe(21);
  });
  it('caso a mano: 3 + 4 + 7 = 14', () => {
    expect(iciqScore(appData({ iciq: iciq([3, 4], 7) }))).toBe(14);
  });
  it('nulos como 0', () => {
    expect(iciqScore(appData({ iciq: iciq([null, 4], 7) }))).toBe(11);
  });

  describe('umbrales de gravedad', () => {
    const casos: [number, string][] = [
      [0, 'Sin incontinencia urinaria'],
      [1, 'IU leve'],
      [5, 'IU leve'],
      [6, 'IU moderada'],
      [12, 'IU moderada'],
      [13, 'IU grave'],
      [21, 'IU grave'],
    ];
    casos.forEach(([sc, esperado]) => {
      it(`${sc} → ${esperado}`, () => expect(iciqSeverity(sc).text).toBe(esperado));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Pad test — gramos de pérdida en 24 h
// Normal <2 · Leve 2-99 · Moderada 100-199 · Grave ≥200
// ═══════════════════════════════════════════════════════════════════

describe('Pad test', () => {
  const casos: [number, string][] = [
    [0, 'Normal (<2g)'],
    [1.9, 'Normal (<2g)'],
    [2, 'IU leve'],
    [99, 'IU leve'],
    [100, 'IU moderada'],
    [199, 'IU moderada'],
    [200, 'IU grave'],
    [500, 'IU grave'],
  ];
  casos.forEach(([g, esperado]) => {
    it(`${g} g → ${esperado}`, () => expect(padSeverity(g).text).toBe(esperado));
  });
});

// ═══════════════════════════════════════════════════════════════════
// Utilidades de tiempo
// ═══════════════════════════════════════════════════════════════════

describe('utilidades de tiempo', () => {
  it('toMin convierte hh:mm a minutos', () => {
    expect(toMin('00:00')).toBe(0);
    expect(toMin('01:30')).toBe(90);
    expect(toMin('23:59')).toBe(1439);
  });

  it('toMin devuelve 0 con cadena vacía', () => {
    expect(toMin('')).toBe(0);
  });

  describe('isNight con periodo nocturno que cruza medianoche', () => {
    // Despierta 07:00, se acuesta 23:00 → noche = 23:00–07:00
    it('23:30 es noche', () => expect(isNight('23:30', '07:00', '23:00')).toBe(true));
    it('03:00 es noche', () => expect(isNight('03:00', '07:00', '23:00')).toBe(true));
    it('06:59 es noche', () => expect(isNight('06:59', '07:00', '23:00')).toBe(true));
    it('07:00 ya es día', () => expect(isNight('07:00', '07:00', '23:00')).toBe(false));
    it('12:00 es día', () => expect(isNight('12:00', '07:00', '23:00')).toBe(false));
    it('22:59 es día', () => expect(isNight('22:59', '07:00', '23:00')).toBe(false));
  });

  it('sin horarios definidos no clasifica como noche', () => {
    expect(isNight('03:00', '', '')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Diario miccional — la parte con más riesgo de error
// ═══════════════════════════════════════════════════════════════════

describe('diario miccional', () => {

  it('capacidad vesical funcional EXCLUYE la primera micción matutina', () => {
    // Práctica ICS: la primera micción del día se acumula durante el sueño
    // y sobreestimaría la capacidad funcional.
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '07:00', void: 500, firstMorning: true }),
          entry({ time: '11:00', void: 250 }),
          entry({ time: '15:00', void: 300 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.maxV).toBe(300);              // no 500
    expect(s.tvoid).toBe(1050);            // el volumen total sí la incluye
  });

  it('excluye del volumen las micciones por sondaje', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '09:00', void: 200 }),
          entry({ time: '13:00', void: 400, catheter: true }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.tvoid).toBe(200);
    expect(s.maxV).toBe(200);
  });

  it('separa micciones diurnas y nocturnas cruzando medianoche', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '08:00', void: 200 }),
          entry({ time: '14:00', void: 200 }),
          entry({ time: '20:00', void: 200 }),
          entry({ time: '23:30', void: 150 }),   // noche
          entry({ time: '04:00', void: 150 }),   // noche
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.avgD).toBe(3);
    expect(s.avgN).toBe(2);
  });

  it('calcula el índice de poliuria nocturna y activa la alerta >33 %', () => {
    // Nocturno 400 de 1000 totales → 40 %
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '10:00', void: 300 }),
          entry({ time: '16:00', void: 300 }),
          entry({ time: '01:00', void: 200 }),
          entry({ time: '05:00', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.npI).toBe(40);
    expect(s.npI! > 33).toBe(true);
  });

  it('IPN por debajo del umbral no activa alerta', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '10:00', void: 400 }),
          entry({ time: '16:00', void: 400 }),
          entry({ time: '03:00', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.npI).toBe(20);
    expect(s.npI! > 33).toBe(false);
  });

  it('cuenta episodios de urgencia y los de grado severo por separado', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '09:00', void: 200, urgency: 0 }),
          entry({ time: '11:00', void: 200, urgency: 1 }),
          entry({ time: '13:00', void: 200, urgency: 2 }),
          entry({ time: '15:00', void: 200, urgency: 3 }),
          entry({ time: '17:00', void: 200, urgency: 4 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.ue).toBe(4);                       // urgencia ≥1
    expect(s.su).toBe(2);                       // urgencia ≥3
    expect(s.ubg).toEqual([1, 1, 1, 1, 1]);     // distribución por grado
  });

  it('distingue incontinencia de urgencia y de esfuerzo', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '09:00', void: 200, leak: 'urgency' }),
          entry({ time: '11:00', void: 200, leak: 'urgency' }),
          entry({ time: '13:00', void: 200, leak: 'effort' }),
          entry({ time: '15:00', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.ul).toBe(2);
    expect(s.el).toBe(1);
  });

  it('suma la ingesta de líquidos', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '09:00', drink: 'Agua', drinkAmt: 200 }),
          entry({ time: '11:00', drink: 'Café', drinkAmt: 150 }),
          entry({ time: '13:00', void: 250 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.totalDrink).toBe(350);
  });

  it('detecta poliuria por volumen diario >2800 ml', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '09:00', void: 1500 }),
          entry({ time: '15:00', void: 1500 }),
        ],
      })],
    });
    expect(computeStats(data).poly).toBe(true);
  });

  it('no marca poliuria justo en el umbral', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '09:00', void: 1400 }),
          entry({ time: '15:00', void: 1400 }),
        ],
      })],
    });
    expect(computeStats(data).poly).toBe(false);
  });

  it('promedia entre varios días solo los que tienen registros', () => {
    const data = appData({
      days: [
        emptyDay({
          date: '2026-01-01', wake: '07:00', sleep: '23:00',
          entries: [entry({ time: '09:00', void: 200 }), entry({ time: '15:00', void: 200 })],
        }),
        emptyDay({ date: '2026-01-02', wake: '07:00', sleep: '23:00', entries: [] }),
        emptyDay({
          date: '2026-01-03', wake: '07:00', sleep: '23:00',
          entries: [entry({ time: '10:00', void: 300 })],
        }),
      ],
    });
    const s = computeStats(data);
    expect(s.n).toBe(2);                // días con registros, no 3
    expect(s.avgDV).toBe(350);          // 700 ml / 2 días
  });

  it('no lanza excepción con el diario completamente vacío', () => {
    const s = computeStats(appData({ days: [emptyDay()] }));
    expect(s.tvoid).toBe(0);
    expect(s.maxV).toBe(0);
    expect(s.npI).toBeNull();
    expect(s.avgI).toBeNull();
  });

  it('calcula el intervalo medio entre micciones', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '08:00', void: 200 }),
          entry({ time: '11:00', void: 200 }),   // +180 min
          entry({ time: '13:00', void: 200 }),   // +120 min
        ],
      })],
    });
    expect(computeStats(data).avgI).toBe(150);   // (180+120)/2
  });

  it('cuenta absorbentes y micciones con vaciado incompleto', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '09:00', void: 200, pad: 'protector', incomplete: true }),
          entry({ time: '13:00', void: 200, pad: 'pañal' }),
          entry({ time: '17:00', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.pads).toBe(2);
    expect(s.iv).toBe(1);
  });

  it('acumula el pad test a lo largo de los tres días', () => {
    const data = appData({
      days: [
        emptyDay({ date: '2026-01-01', pads: [pad({ leak: 12.5 })] }),
        emptyDay({ date: '2026-01-02', pads: [pad({ leak: 8 }), pad({ leak: 4.5 })] }),
        emptyDay({ date: '2026-01-03', pads: [] }),
      ],
    });
    const total = data.days.flatMap((d) => d.pads).reduce((s, e) => s + e.leak, 0);
    expect(+total.toFixed(1)).toBe(25);
    expect(padSeverity(25).text).toBe('IU leve');
  });
});
