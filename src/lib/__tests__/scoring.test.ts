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
 *     primera micción matutina, poliuria nocturna, días incompletos)
 *   · entradas inválidas (fuera de rango, no numéricas) y su rechazo
 *
 * Ningún dato procede de pacientes reales.
 */

import { describe, it, expect } from 'vitest';
import {
  ipssScore, ipssComplete, ipssSeverity, ipssPredom,
  iiefScore, iiefComplete, iiefSeverity,
  oabScore, oabNoUrgency, OAB_DISCLAIMER,
  iciqScore, iciqSeverity,
  padDayStats,
  toMin, isNight,
  computeStats, generateClinicalNote,
  isValidScaleValue, ipssItemValid, iiefItem1Valid, iiefItemValid,
  oabItemValid, iciqQ1Valid, iciqQ2Valid, urgencyValid,
  parseDecimal, isDuplicateByClientKey,
  PERIOD_DISCLAIMER,
  CLINICAL_RULES,
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

  it('trata los nulos como 0 sin romper la suma (capa interna)', () => {
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

  describe('predominio sintomático (regla interna, no diagnóstica)', () => {
    // Llenado (irritativo)  = Q2 frecuencia + Q4 urgencia + Q7 nicturia (3 ítems, máx 15)
    // Vaciado (obstructivo) = Q1 vaciado incompleto + Q3 intermitencia
    //                       + Q5 chorro débil + Q6 esfuerzo (4 ítems, máx 20)
    // Se comparan MEDIAS por ítem, no sumas brutas: comparar sumas
    // penalizaría siempre al bloque de llenado por tener menos ítems.
    it('llenado puro → predominio de llenado', () => {
      expect(ipssPredom(ipss([0, 5, 0, 5, 0, 0, 5]))).toBe('Predominio de síntomas de llenado (regla interna)');
    });
    it('vaciado puro → predominio de vaciado', () => {
      expect(ipssPredom(ipss([5, 0, 5, 0, 5, 5, 0]))).toBe('Predominio de síntomas de vaciado (regla interna)');
    });
    it('medias iguales (todos los ítems iguales) → sin predominio claro', () => {
      // llenado 3+3+3=9 /3 = 3 · vaciado 3+3+3+3=12 /4 = 3 → empate de medias
      expect(ipssPredom(ipss([3, 3, 3, 3, 3, 3, 3]))).toBe('Sin predominio claro');
    });
    it('total 0 → sin predominio (no aplicable), no "Mixto"', () => {
      expect(ipssPredom(ipss([0, 0, 0, 0, 0, 0, 0]))).toBe('Sin predominio (no aplicable)');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// IIEF-5 — 5 ítems. Ítem 1: 1-5 (sin opción "0"). Ítems 2-5: 0-5. Total 0-25.
// Sin DE 22-25 · Leve 17-21 · Leve-moderada 12-16 · Moderada 8-11 · Severa 0-7
// ═══════════════════════════════════════════════════════════════════

describe('IIEF-5', () => {
  it('mínimo → 0', () => expect(iiefScore(iief([0, 0, 0, 0, 0]))).toBe(0));
  it('máximo → 25', () => expect(iiefScore(iief([5, 5, 5, 5, 5]))).toBe(25));
  it('caso a mano: 4+3+5+2+1 = 15', () => {
    expect(iiefScore(iief([4, 3, 5, 2, 1]))).toBe(15);
  });
  it('nulos como 0 (capa interna)', () => {
    expect(iiefScore(iief([4, null, 5, null, 1]))).toBe(10);
  });

  describe('umbrales de gravedad (validados 5-25, Rosen 1999)', () => {
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
      [5, 'DE severa'],
    ];
    casos.forEach(([sc, esperado]) => {
      it(`${sc} → ${esperado}`, () => expect(iiefSeverity(sc).text).toBe(esperado));
    });
  });

  // Cambio 6 (ronda 3 · punto 3.5): las bandas se validaron sobre 5-25. Un
  // total por debajo de 5 no se clasifica, aunque sea aritméticamente
  // alcanzable (ítems 2-5 admiten 0; el ítem 1 se puntúa 1-5).
  describe('por debajo del rango validado (Cambio 6)', () => {
    [0, 1, 4].forEach((sc) => {
      it(`${sc} → no se aplica clasificación de gravedad`, () => {
        const sev = iiefSeverity(sc);
        expect(sev.text).toMatch(/no se aplica clasificación de gravedad/);
        expect(sev.text).not.toMatch(/DE severa/);
      });
    });
  });

  describe('completitud', () => {
    it('detecta cuestionario completo', () => {
      expect(iiefComplete(iief([1, 2, 3, 4, 5]))).toBe(true);
    });
    it('detecta un ítem sin responder', () => {
      expect(iiefComplete(iief([1, 2, null, 4, 5]))).toBe(false);
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
  it('nulos como 0 (capa interna)', () => {
    expect(oabScore(appData({ oab: oab([1, null, 3, null, 5]) }))).toBe(9);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AUA OAB Assessment — Cambio 1 (tanda 3): el instrumento (Urology Care
// Foundation) no publica bandas de gravedad. No existe oabSeverity();
// solo se conserva la lectura directa de la pregunta 1 (urgencia), que
// es el ítem de cribado del propio instrumento, no una banda derivada
// del total.
// ═══════════════════════════════════════════════════════════════════

describe('AUA OAB Assessment — sin bandas de gravedad', () => {
  it('oabNoUrgency: true solo cuando la pregunta 1 (urgencia) es 0', () => {
    expect(oabNoUrgency(appData({ oab: oab([0, 3, 3, 3, 3]) }))).toBe(true);
    expect(oabNoUrgency(appData({ oab: oab([1, 0, 0, 0, 0]) }))).toBe(false);
  });

  it('un total de 18 se reporta como 18/25 en el informe, sin categoría de gravedad', () => {
    const data = appData({ screening: { iief: null, oab: true, iciq: null }, oab: oab([4, 4, 4, 3, 3]) });
    const note = generateClinicalNote(data);
    const oabLine = note.split('\n').find((l) => l.startsWith('AUA OAB Assessment'));
    expect(oabLine).toBe('AUA OAB Assessment: 18/25');
  });

  it('el informe incluye el descargo de responsabilidad del instrumento (OAB_DISCLAIMER)', () => {
    const data = appData({ screening: { iief: null, oab: true, iciq: null }, oab: oab([4, 4, 4, 3, 3]) });
    expect(generateClinicalNote(data)).toContain(OAB_DISCLAIMER);
  });

  it('con la pregunta 1 en 0, el informe muestra "Sin urgencia miccional", no una banda', () => {
    const data = appData({ screening: { iief: null, oab: true, iciq: null }, oab: oab([0, 0, 0, 0, 0]) });
    const note = generateClinicalNote(data);
    const oabLine = note.split('\n').find((l) => l.startsWith('AUA OAB Assessment'));
    expect(oabLine).toBe('AUA OAB Assessment: 0/25 (Sin urgencia miccional)');
  });

  it('ninguna variante de "Leve"/"Moderado"/"Grave" aparece asociada al AUA OAB', () => {
    const data = appData({ screening: { iief: null, oab: true, iciq: null }, oab: oab([4, 4, 4, 3, 3]) });
    const note = generateClinicalNote(data);
    const oabLine = note.split('\n').find((l) => l.startsWith('AUA OAB Assessment'));
    expect(oabLine).not.toMatch(/Leve|Moderado|Grave/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// CLINICAL_RULES.instrumentSources — Cambio 2 (tanda 3): las bandas que
// SÍ se conservan (IPSS, IIEF-5, ICIQ-SF) tienen su fuente declarada.
// ═══════════════════════════════════════════════════════════════════

describe('CLINICAL_RULES.instrumentSources', () => {
  it('declara la fuente del IPSS (Barry MJ et al. 1992)', () => {
    expect(CLINICAL_RULES.instrumentSources.ipss).toMatch(/Barry MJ/);
  });
  it('declara la fuente del IIEF-5 (Rosen RC et al. 1999) y el uso correcto del instrumento (Cambio 6)', () => {
    expect(CLINICAL_RULES.instrumentSources.iief5).toMatch(/Rosen RC/);
    expect(CLINICAL_RULES.instrumentSources.iief5).toMatch(/Otaola-Arca/);
  });
  it('declara explícitamente que el AUA OAB no publica bandas de gravedad', () => {
    expect(CLINICAL_RULES.instrumentSources.auaOab).toMatch(/sin bandas de gravedad/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Cambio 8 (ronda 3 · punto 3.9) — la fuente del ICIQ-SF se divide en
// dos citas: la validación original (Avery 2004) y la clasificación de
// gravedad, que es una publicación posterior (Klovning 2009), no parte
// de la validación inicial.
// ═══════════════════════════════════════════════════════════════════

describe('CLINICAL_RULES.instrumentSources.iciq (Cambio 8)', () => {
  it('cita la validación original (Avery K et al. 2004)', () => {
    expect(CLINICAL_RULES.instrumentSources.iciq).toMatch(/Avery K/);
    expect(CLINICAL_RULES.instrumentSources.iciq).toMatch(/2004/);
  });
  it('cita la clasificación de gravedad como publicación posterior y distinta (Klovning A et al. 2009)', () => {
    expect(CLINICAL_RULES.instrumentSources.iciq).toMatch(/Klovning A/);
    expect(CLINICAL_RULES.instrumentSources.iciq).toMatch(/posterior a la validación original/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// ICIQ-SF — Q1 (0-5) + Q2 (0,2,4,6) + Q3 VAS (0-10). Total 0-21.
// Sin IU 0 · Leve 1-5 · Moderada 6-12 · Grave 13-18 · Muy grave 19-21
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
  it('nulos como 0 (capa interna)', () => {
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
      [18, 'IU grave'],
      [19, 'IU muy grave'],
      [21, 'IU muy grave'],
    ];
    casos.forEach(([sc, esperado]) => {
      it(`${sc} → ${esperado}`, () => expect(iciqSeverity(sc).text).toBe(esperado));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Pad test — Cambio 1: la app deja de clasificar el pad test por
// gravedad. padSeverity() se elimina; solo se reportan gramos/24h y el
// número de días válidos (ver describe "pad test por día" más abajo).
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// Entradas inválidas — la capa de validación rechaza explícitamente,
// no trunca en silencio ni confunde 0/null/undefined/''.
// ═══════════════════════════════════════════════════════════════════

describe('entradas inválidas', () => {
  it('null se admite como "sin responder" (válido pero incompleto)', () => {
    expect(isValidScaleValue(null, 0, 5)).toBe(true);
  });
  it('0 es una respuesta válida, no se confunde con ausencia', () => {
    expect(isValidScaleValue(0, 0, 5)).toBe(true);
  });
  it('undefined se rechaza (no es "sin responder", es un dato corrupto)', () => {
    expect(isValidScaleValue(undefined, 0, 5)).toBe(false);
  });
  it('cadena vacía se rechaza', () => {
    expect(isValidScaleValue('' as unknown as number, 0, 5)).toBe(false);
  });
  it('texto se rechaza', () => {
    expect(isValidScaleValue(Number('abc'), 0, 5)).toBe(false);
    expect(isValidScaleValue('texto' as unknown as number, 0, 5)).toBe(false);
  });
  it('NaN se rechaza', () => {
    expect(isValidScaleValue(NaN, 0, 5)).toBe(false);
  });
  it('Infinity se rechaza', () => {
    expect(isValidScaleValue(Infinity, 0, 5)).toBe(false);
    expect(isValidScaleValue(-Infinity, 0, 5)).toBe(false);
  });
  it('valor negativo se rechaza, no se trunca a 0', () => {
    expect(isValidScaleValue(-1, 0, 5)).toBe(false);
  });
  it('valor superior al máximo del ítem se rechaza, no se trunca al máximo', () => {
    expect(isValidScaleValue(6, 0, 5)).toBe(false);
    expect(ipssItemValid(6)).toBe(false);
  });

  it('IIEF-5 ítem 1 = 0 → inválido (el ítem 1 se puntúa 1-5, sin opción "0")', () => {
    expect(iiefItem1Valid(0)).toBe(false);
    expect(iiefItem1Valid(1)).toBe(true);
  });
  it('IIEF-5 ítems 2-5 sí admiten 0 ("no intentó el coito")', () => {
    expect(iiefItemValid(0)).toBe(true);
  });
  it('OAB: ítem fuera de rango (0-5) se rechaza', () => {
    expect(oabItemValid(6)).toBe(false);
    expect(oabItemValid(-1)).toBe(false);
  });
  it('ICIQ Q1 (0-5) fuera de rango se rechaza', () => {
    expect(iciqQ1Valid(6)).toBe(false);
  });
  it('ICIQ Q2 solo admite 0, 2, 4 o 6: cualquier otro valor se rechaza', () => {
    expect(iciqQ2Valid(0)).toBe(true);
    expect(iciqQ2Valid(6)).toBe(true);
    expect(iciqQ2Valid(1)).toBe(false);
    expect(iciqQ2Valid(3)).toBe(false);
  });
  it('PPIUS / urgencia del diario: valor 5 se rechaza (la escala es 0-4)', () => {
    expect(urgencyValid(5)).toBe(false);
    expect(urgencyValid(4)).toBe(true);
    expect(urgencyValid(0)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Fronteras que faltan
// ═══════════════════════════════════════════════════════════════════

describe('fronteras que faltan', () => {
  // Cambio 6 (ronda 3 · punto 3.5): esta banda se corrige respecto a la
  // ronda anterior — totales 1-4 ya NO se clasifican como "DE severa":
  // quedan por debajo del rango validado (5-25) y no se etiquetan.
  it('IIEF-5 totales 1-4 (mínimo real, ítem 1 no puede ser 0) → sin clasificación, no "DE severa"', () => {
    expect(iiefSeverity(1).text).not.toBe('DE severa');
    expect(iiefSeverity(4).text).not.toBe('DE severa');
    expect(iiefSeverity(1).text).toMatch(/no se aplica clasificación de gravedad/);
  });
  it('IIEF-5 total 5 (frontera inferior del rango validado) → DE severa', () => {
    expect(iiefSeverity(5).text).toBe('DE severa');
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

  it('hora vacía → null, no 00:00', () => {
    expect(toMin('')).toBeNull();
  });

  it('24:00, 23:60 y una fecha inválida se rechazan explícitamente', () => {
    expect(toMin('24:00')).toBeNull();
    expect(toMin('23:60')).toBeNull();
    expect(toMin('no-es-una-hora')).toBeNull();
    expect(toMin('2026-01-01')).toBeNull();
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

  // Cambio 4 (ronda 3 · punto 3.3): esta prueba se corrige respecto a la
  // ronda anterior — un día sin wake/sleep informados ya NO se trata como
  // "día" (false): la ausencia de límites no es un dato, y devuelve null
  // igual que una hora inválida.
  it('sin horarios definidos → no clasificable (null), no "día" por defecto', () => {
    expect(isNight('03:00', '', '')).toBeNull();
  });

  it('hora vacía/inválida → no clasificable (null), no "día" por defecto', () => {
    expect(isNight('', '07:00', '23:00')).toBeNull();
    expect(isNight('25:99', '07:00', '23:00')).toBeNull();
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

  it('excluye del volumen espontáneo las micciones por sondaje, pero no de la producción total', () => {
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
    expect(s.tvoid).toBe(200);       // volumen espontáneo — capacidad funcional
    expect(s.maxV).toBe(200);
    expect(s.tvoidTotal).toBe(600);  // producción total — incluye el sondaje
  });

  it('separa micciones diurnas y nocturnas cruzando medianoche', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true,
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

  it('calcula el índice de poliuria nocturna (IPN) como porcentaje — Cambio 3: sin umbral aplicado', () => {
    // Nocturno 400 de 1000 totales → 40 %. sleepOnset = sleep: no hay
    // vaciados en el margen acostarse→dormirse que puedan quedar excluidos.
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', sleepOnset: '23:00',
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
  });

  it('IPN se calcula igual sea cual sea su magnitud: no hay corte que active ni desactive nada', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', sleepOnset: '23:00',
        entries: [
          entry({ time: '10:00', void: 400 }),
          entry({ time: '16:00', void: 400 }),
          entry({ time: '03:00', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.npI).toBe(20);
  });

  it('IPN usa la producción TOTAL (incluido el sondaje), no solo la espontánea', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', sleepOnset: '23:00',
        entries: [
          entry({ time: '10:00', void: 300 }),           // diurno espontáneo
          entry({ time: '01:00', void: 300, catheter: true }), // nocturno, sondaje
        ],
      })],
    });
    const s = computeStats(data);
    // nocturno 300 / total 600 = 50 %
    expect(s.npI).toBe(50);
  });

  it('sin sleepOnset, el IPN no es calculable (null): no hay frontera para saber qué es nocturno', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '10:00', void: 400 }),
          entry({ time: '01:00', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.npI).toBeNull();
    expect(s.nocturnalVolume).toBeNull();
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

  it('no lanza excepción con el diario completamente vacío — sin datos, no 0', () => {
    const s = computeStats(appData({ days: [emptyDay()] }));
    expect(s.tvoid).toBeNull();
    expect(s.maxV).toBeNull();
    expect(s.avgDV).toBeNull();
    expect(s.npI).toBeNull();
    expect(s.avgI).toBeNull();
    expect(s.polyMlPerKg).toBeNull();
    expect(s.nocturiaCount).toBeNull();
    expect(s.nocturnalVolume).toBeNull();
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

  it('intervalo que cruza medianoche (23:30 → 00:30) = 60 min, no 1380', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '23:30', void: 200 }),
          entry({ time: '00:30', void: 200 }),
        ],
      })],
    });
    expect(computeStats(data).avgI).toBe(60);
  });

  it('una sola micción en el día → intervalo medio "sin dato" (null), no división por cero', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [entry({ time: '10:00', void: 200 })],
      })],
    });
    expect(computeStats(data).avgI).toBeNull();
  });

  it('micciones desordenadas se ordenan antes de calcular intervalos: nunca un intervalo negativo', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '15:00', void: 200 }),
          entry({ time: '09:00', void: 200 }),
          entry({ time: '23:30', void: 200 }),
          entry({ time: '00:30', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.avgI).not.toBeNull();
    expect(s.avgI! >= 0).toBe(true);
  });

  it('una micción sin hora se excluye del cálculo y se informa cuántas se excluyeron', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00',
        entries: [
          entry({ time: '09:00', void: 200 }),
          entry({ time: '', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.excludedTimeEntries).toBe(1);
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
});

// ═══════════════════════════════════════════════════════════════════
// Días válidos — Cambio 5 (ronda 3 · punto 3.6): el criterio de ≥4
// micciones registradas NO tenía base normativa (era una regla inventada
// en una tanda anterior) y podía descartar días completos de pacientes
// con baja frecuencia miccional. Se sustituye por cobertura (wake/sleep
// informados) + confirmación explícita del paciente (dayComplete), sin
// exigir ningún número mínimo de micciones. Ver CLINICAL_RULES.validDayRule.
// ═══════════════════════════════════════════════════════════════════

describe('días válidos para el promedio (regla interna, sin recuento de micciones)', () => {
  it('un día con una sola micción SÍ es válido si el paciente lo marcó como completo', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true,
        entries: [entry({ time: '10:00', void: 300 })],
      })],
    });
    const s = computeStats(data);
    expect(s.n).toBe(1);
    expect(s.avgDV).toBe(300);
  });

  it('un día con cuatro micciones pero SIN marcar como completo no cuenta (ya no hay recuento mínimo)', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: false,
        entries: [
          entry({ time: '08:00', void: 200 }),
          entry({ time: '12:00', void: 200 }),
          entry({ time: '16:00', void: 200 }),
          entry({ time: '20:00', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.n).toBe(0);
    expect(s.avgDV).toBeNull();
  });

  it('sin horario de sueño informado, un día marcado como completo tampoco cuenta (cobertura + confirmación)', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '', sleep: '', dayComplete: true,
        entries: [entry({ time: '10:00', void: 300 })],
      })],
    });
    const s = computeStats(data);
    expect(s.n).toBe(0);
  });

  it('un día vacío entre dos días válidos se excluye del denominador (n=2, no 3)', () => {
    const fourVoids = (offset: number) => [
      entry({ time: '08:00', void: 200 + offset }),
      entry({ time: '12:00', void: 200 + offset }),
      entry({ time: '16:00', void: 200 + offset }),
      entry({ time: '20:00', void: 200 + offset }),
    ];
    const data = appData({
      days: [
        emptyDay({ date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true, entries: fourVoids(0) }),   // 800 ml
        emptyDay({ date: '2026-01-02', wake: '07:00', sleep: '23:00', entries: [] }),               // vacío, no completo
        emptyDay({ date: '2026-01-03', wake: '07:00', sleep: '23:00', dayComplete: true, entries: fourVoids(0) }),   // 800 ml
      ],
    });
    const s = computeStats(data);
    expect(s.n).toBe(2);
    expect(s.totalDays).toBe(2);
    expect(s.avgDV).toBe(800); // 1600 ml / 2 días válidos
  });

  it('CLINICAL_RULES.validDayRule declara el criterio como regla interna, no clínica', () => {
    expect(CLINICAL_RULES.validDayRule).toMatch(/[Rr]egla interna/);
    expect(CLINICAL_RULES.validDayRule).not.toMatch(/4 micciones/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Volumen 24h en ml/kg — Cambio 3: se calcula y se muestra el valor,
// pero la app ya NO lo etiqueta como "poliuria" ni aplica ningún
// umbral (el booleano `poly` se elimina de DiaryStats).
// ═══════════════════════════════════════════════════════════════════

describe('volumen 24h en ml/kg (sin etiqueta de umbral)', () => {
  const fourVoidsSumming = (total: number) => {
    const each = total / 4;
    return [
      entry({ time: '08:00', void: each }),
      entry({ time: '12:00', void: each }),
      entry({ time: '16:00', void: each }),
      entry({ time: '20:00', void: each }),
    ];
  };

  it('50 kg / 2500 ml → 50 ml/kg por día registrado', () => {
    const data = appData({
      patient: { name: '', age: '', sex: '', med: '', weight: '50' },
      days: [emptyDay({ date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true, entries: fourVoidsSumming(2500) })],
    });
    const s = computeStats(data);
    expect(s.polyMlPerKg).toBe(50);
  });

  it('100 kg / 3000 ml → 30 ml/kg por día registrado', () => {
    const data = appData({
      patient: { name: '', age: '', sex: '', med: '', weight: '100' },
      days: [emptyDay({ date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true, entries: fourVoidsSumming(3000) })],
    });
    const s = computeStats(data);
    expect(s.polyMlPerKg).toBe(30);
  });

  it('sin peso registrado → ml/kg no calculable (null), no un valor por defecto', () => {
    const data = appData({
      days: [emptyDay({ date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true, entries: fourVoidsSumming(3200) })],
    });
    const s = computeStats(data);
    expect(s.polyMlPerKg).toBeNull();
  });

  it('un valor de exactamente 40 ml/kg se calcula igual que cualquier otro: no hay salto de categoría', () => {
    const data = appData({
      patient: { name: '', age: '', sex: '', med: '', weight: '70' },
      days: [emptyDay({ date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true, entries: fourVoidsSumming(2800) })],
    });
    const s = computeStats(data);
    expect(s.polyMlPerKg).toBe(40);
  });

  it('el peso con coma decimal ("72,5") se interpreta correctamente (A08, tanda 2)', () => {
    const data = appData({
      patient: { name: '', age: '', sex: '', med: '', weight: '72,5' },
      days: [emptyDay({ date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true, entries: fourVoidsSumming(2900) })],
    });
    const s = computeStats(data);
    expect(s.polyMlPerKg).toBe(40); // 2900 / 72.5 = 40, no 2900/72 (que truncaría la coma)
  });
});

// ═══════════════════════════════════════════════════════════════════
// Cambio 3 — CLINICAL_RULES ya no declara un umbral de IPN.
// ═══════════════════════════════════════════════════════════════════

describe('CLINICAL_RULES (Cambio 3, tanda 3)', () => {
  it('no declara npiThreshold: la app no aplica ningún corte de IPN', () => {
    expect((CLINICAL_RULES as Record<string, unknown>).npiThreshold).toBeUndefined();
  });
  it('polyuriaMlPerKg se conserva como unidad de referencia mostrada (no como alerta)', () => {
    expect(CLINICAL_RULES.polyuriaMlPerKg).toBe(40);
  });
  it('declara la fuente de PPIUS (Cambio 4, tanda 3)', () => {
    expect(CLINICAL_RULES.ppiusSource).toMatch(/PPIUS/);
  });
  it('versión de reglas actualizada a 2026.11 (ronda 3)', () => {
    expect(CLINICAL_RULES.version).toBe('2026.11');
  });
});

// ═══════════════════════════════════════════════════════════════════
// CLINICAL_RULES — declaraciones nuevas de la ronda 3.
// ═══════════════════════════════════════════════════════════════════

describe('CLINICAL_RULES (ronda 3)', () => {
  it('validDayRule (Cambio 5) declara el criterio de día válido como regla interna, sin recuento de micciones', () => {
    expect(CLINICAL_RULES.validDayRule).toMatch(/[Rr]egla interna/);
    expect(CLINICAL_RULES.validDayRule).not.toMatch(/≥\s*4|4\s*micciones/);
  });
  it('iief5Policy (Cambio 6) declara la política preespecificada sobre el ítem 1 y el rango validado', () => {
    expect(CLINICAL_RULES.iief5Policy).toMatch(/1-5/);
    expect(CLINICAL_RULES.iief5Policy).toMatch(/5-25/);
    expect(CLINICAL_RULES.iief5Policy).toMatch(/[Pp]reespecificada/);
  });
  it('ninguna salida usa la etiqueta "24 h" — se declara PERIOD_DISCLAIMER (Cambio 2)', () => {
    expect(PERIOD_DISCLAIMER).toMatch(/días naturales/);
    expect(PERIOD_DISCLAIMER).toMatch(/no.*24 horas/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Pad test por día — A2: nunca se suman los días entre sí. Cambio 3
// (ronda 3 · punto 3.4) corrige el criterio de inclusión: la ronda
// anterior excluía cualquier día sin absorbentes cargados, confundiendo
// "no registrado" con "registrado y seco" — y elevaba la media
// artificialmente al promediar solo los días con pérdidas. Ahora el
// criterio es el marcador explícito `padTestStatus`.
// ═══════════════════════════════════════════════════════════════════

describe('pad test por día (A2 + Cambio 3)', () => {
  it('3 días registrados de 10, 20 y 30 g → media 20 g por día, NO la suma de 60 g', () => {
    const data = appData({
      days: [
        emptyDay({ date: '2026-01-01', padTestStatus: 'registrado', pads: [pad({ leak: 10 })] }),
        emptyDay({ date: '2026-01-02', padTestStatus: 'registrado', pads: [pad({ leak: 20 })] }),
        emptyDay({ date: '2026-01-03', padTestStatus: 'registrado', pads: [pad({ leak: 30 })] }),
      ],
    });
    const stats = padDayStats(data);
    expect(stats.n).toBe(3);
    expect(stats.dryDays).toBe(0);
    expect(stats.avgPerDay).toBe(20);
    expect(stats.avgPerDay).not.toBe(60); // nunca se suman los días entre sí
    // Cambio 1 (tanda 3): la app ya no clasifica el pad test por
    // gravedad — solo reporta el valor continuo, sin padSeverity().
  });

  it('un día sin marcar como registrado se excluye, aunque tenga absorbentes cargados', () => {
    const data = appData({
      days: [
        emptyDay({ date: '2026-01-01', padTestStatus: 'registrado', pads: [pad({ leak: 12.5 })] }),
        emptyDay({ date: '2026-01-02', padTestStatus: 'registrado', pads: [pad({ leak: 12.5 })] }),
        emptyDay({ date: '2026-01-03', padTestStatus: 'sin-registrar', pads: [pad({ leak: 99 })] }),
      ],
    });
    const stats = padDayStats(data);
    expect(stats.n).toBe(2);
    expect(stats.avgPerDay).toBe(12.5);
  });

  it('Cambio 3: un día registrado SIN absorbentes es un día seco (0 g) — cuenta en la media, no se excluye', () => {
    const data = appData({
      days: [
        emptyDay({ date: '2026-01-01', padTestStatus: 'registrado', pads: [pad({ leak: 20 })] }),
        emptyDay({ date: '2026-01-02', padTestStatus: 'registrado', pads: [] }), // seco
        emptyDay({ date: '2026-01-03', padTestStatus: 'sin-registrar', pads: [] }), // no registrado
      ],
    });
    const stats = padDayStats(data);
    expect(stats.n).toBe(2);             // los dos días registrados
    expect(stats.dryDays).toBe(1);
    expect(stats.avgPerDay).toBe(10);    // (20 + 0) / 2, no 20 (que sería excluir el seco)
    expect(stats.avgPerDay).not.toBe(20);
  });

  it('ningún día registrado → sin datos (null), no 0', () => {
    const data = appData({ days: [emptyDay(), emptyDay(), emptyDay()] });
    const stats = padDayStats(data);
    expect(stats.n).toBe(0);
    expect(stats.avgPerDay).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Nocturia y volumen nocturno — la ICS exige que el episodio ocurra
// DESPUÉS de conciliar el sueño (sleepOnset), no solo después de
// acostarse (sleep). Cambio 1 (ronda 3 · punto 3.2) corrige aquí un
// error real de la ronda anterior: el volumen nocturno se calculaba
// sobre `sleep` (acostarse), no sobre `sleepOnset` (dormirse), así que
// un vaciado entre acostarse y conciliar el sueño se contaba como
// volumen nocturno cuando en realidad vacía orina producida durante el
// día. Ahora ambas métricas comparten la MISMA frontera (sleepOnset). El
// vaciado marcado firstMorning ("decidir levantarse") nunca cuenta como
// episodio de nocturia, pero su volumen sí es nocturno.
// ═══════════════════════════════════════════════════════════════════

describe('nocturia y volumen nocturno (Cambio 1, ronda 3 · punto 3.2)', () => {
  it('caso del dictamen: acostarse 23:00, dormirse 23:30, vaciados 23:15/02:00/07:00(1ª) → volumen nocturno 450 ml, no 650; nocturia 1', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', sleepOnset: '23:30',
        entries: [
          entry({ time: '23:15', void: 200 }),                      // acostado, aún despierto
          entry({ time: '02:00', void: 150 }),                      // ya dormido → nocturia
          entry({ time: '07:00', void: 300, firstMorning: true }),  // primer vaciado de la mañana
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.nocturnalVolume).toBe(450);   // 150 + 300 — el de las 23:15 NO cuenta
    expect(s.nocturnalVolume).not.toBe(650);
    expect(s.nocturiaCount).toBe(1);       // solo la de las 02:00
  });

  it('un vaciado antes de conciliar el sueño NO cuenta como nocturia ni como volumen nocturno', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', sleepOnset: '23:30',
        entries: [
          entry({ time: '23:15', void: 200 }), // acostado, aún despierto
          entry({ time: '02:00', void: 150 }), // ya dormido → nocturia
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.nocturiaCount).toBe(1);       // solo la de las 02:00
    expect(s.nocturnalVolume).toBe(150);   // el de las 23:15 queda excluido
  });

  it('sin sleepOnset, nocturiaCount es null pero la ventana declarada (avgN) sigue disponible', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', dayComplete: true,
        entries: [
          entry({ time: '08:00', void: 200 }),
          entry({ time: '12:00', void: 200 }),
          entry({ time: '16:00', void: 200 }),
          entry({ time: '23:30', void: 150 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.nocturiaCount).toBeNull();
    expect(s.nocturiaDays).toBe(0);
    expect(s.avgN).toBe(1); // ventana declarada sleep→wake, no exige sleepOnset
  });

  it('el vaciado firstMorning cuenta como volumen nocturno aunque su hora coincida con la de despertar (con sleepOnset informado)', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', sleepOnset: '23:30',
        entries: [
          entry({ time: '07:00', void: 400, firstMorning: true }), // hora = despertar exacto
          entry({ time: '11:00', void: 200 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.nocturnalVolume).toBe(400);
  });

  it('el vaciado firstMorning NO cuenta como episodio de nocturia aunque su hora caiga en la ventana', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', sleepOnset: '23:30',
        entries: [
          entry({ time: '06:50', void: 300, firstMorning: true }), // el vaciado de "levantarse"
          entry({ time: '02:00', void: 150 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.nocturiaCount).toBe(1); // solo 02:00; el firstMorning no cuenta
  });

  it('sin marcador ICS ≥2: la app no compara nocturiaCount ni avgN contra ningún umbral', () => {
    const data = appData({
      days: [emptyDay({
        date: '2026-01-01', wake: '07:00', sleep: '23:00', sleepOnset: '23:15',
        entries: [
          entry({ time: '23:30', void: 150 }),
          entry({ time: '02:00', void: 150 }),
          entry({ time: '04:00', void: 150 }),
        ],
      })],
    });
    const s = computeStats(data);
    expect(s.nocturiaCount).toBe(3); // ≥2 en términos ICS, pero la app no lo etiqueta
  });
});

// ═══════════════════════════════════════════════════════════════════
// Cambio 7 (ronda 3 · punto 3.7) — idempotencia por clientKey, no por
// contenido. La comparación por contenido de la ronda anterior tenía dos
// fallos que este cambio corrige: (1) solo miraba la última entrada, sin
// detectar duplicados por inserciones intermedias o reintentos fuera de
// orden, y (2) RECHAZABA dos eventos legítimos idénticos (dos micciones
// iguales a la misma hora son perfectamente posibles). isDuplicateEntry()
// se elimina; se sustituye por isDuplicateByClientKey().
// ═══════════════════════════════════════════════════════════════════

describe('Cambio 7 — idempotencia por clientKey', () => {
  it('una clientKey que ya existe en el día se considera duplicada', () => {
    const existing = [entry({ time: '10:00', void: 250, clientKey: 'k1' })];
    expect(isDuplicateByClientKey(existing, 'k1')).toBe(true);
  });

  it('una clientKey distinta nunca es duplicada, aunque el resto del contenido coincida', () => {
    const existing = [entry({ time: '10:00', void: 250, clientKey: 'k1' })];
    expect(isDuplicateByClientKey(existing, 'k2')).toBe(false);
  });

  it('sin entradas previas en el día, ninguna clientKey es duplicada', () => {
    expect(isDuplicateByClientKey([], 'k1')).toBe(false);
  });

  it('detecta una clientKey duplicada en cualquier posición del historial, no solo en la última entrada', () => {
    const existing = [
      entry({ time: '09:00', void: 200, clientKey: 'k1' }), // la duplicada no es la última
      entry({ time: '13:00', void: 300, clientKey: 'k2' }),
    ];
    expect(isDuplicateByClientKey(existing, 'k1')).toBe(true);
  });

  it('dos micciones legítimas con contenido idéntico pero clientKey distinta se consideran eventos distintos (no duplicadas)', () => {
    // Este es exactamente el caso que la comparación por contenido de la
    // ronda anterior rechazaba incorrectamente.
    const existing = [entry({ time: '10:00', void: 250, clientKey: 'k1' })];
    expect(isDuplicateByClientKey(existing, 'k2')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// A08 — coma decimal española: "1,5" debe aceptarse igual que "1.5".
// ═══════════════════════════════════════════════════════════════════

describe('A08 — coma decimal española (parseDecimal)', () => {
  it('acepta coma como separador decimal', () => {
    expect(parseDecimal('1,5')).toBe(1.5);
    expect(parseDecimal('72,5')).toBe(72.5);
  });
  it('acepta punto como separador decimal', () => {
    expect(parseDecimal('1.5')).toBe(1.5);
  });
  it('acepta enteros sin separador', () => {
    expect(parseDecimal('250')).toBe(250);
  });
  it('recorta espacios en los extremos', () => {
    expect(parseDecimal('  8  ')).toBe(8);
  });
  it('cadena vacía devuelve null, no NaN', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('   ')).toBeNull();
  });
  it('texto no numérico se rechaza (null), no NaN silencioso', () => {
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('doce')).toBeNull();
  });
  it('varios separadores se rechazan en vez de interpretarse a medias', () => {
    expect(parseDecimal('12,5,3')).toBeNull();
    expect(parseDecimal('1.2.3')).toBeNull();
  });
  it('no trunca en silencio: "72,5" nunca se interpreta como 72', () => {
    expect(parseDecimal('72,5')).not.toBe(72);
    expect(parseDecimal('72,5')).toBe(72.5);
  });
});
