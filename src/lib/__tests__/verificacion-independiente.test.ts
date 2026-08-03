/**
 * Verificación independiente de las correcciones del dictamen de auditoría.
 * Escrita sin mirar scoring.test.ts, a partir de los "resultados corregidos"
 * del informe de los dos revisores clínicos (3 ago 2026).
 * Cada test cita el nº de caso del informe.
 */
import { describe, it, expect } from 'vitest';
import {
  iciqSeverity, ipssPredom, toMin, isNight,
  ipssComplete, iiefComplete, oabComplete, iciqComplete,
  computeStats, padDayStats, CLINICAL_RULES,
} from '../clinical';
import type { AppData, DayData, DiaryEntry } from '../../types';

const entry = (o: Partial<DiaryEntry>): DiaryEntry => ({
  id: Math.random().toString(36), clientKey: Math.random().toString(36), time: '10:00', void: 250, urgency: 0,
  leak: '', pad: '', incomplete: false, firstMorning: false, catheter: false,
  drink: '', drinkAmt: null, ...o,
});

const day = (o: Partial<DayData>): DayData => ({
  date: '2026-08-01', wake: '07:00', sleep: '23:00', sleepOnset: '', padTestStatus: 'sin-registrar', dayComplete: false, entries: [], pads: [], ...o,
});

const base = (o: Partial<AppData> = {}): AppData => ({
  patient: { name: '', age: '', sex: '', med: '', weight: '' } as AppData['patient'],
  screening: { iief: null, oab: null, iciq: null },
  days: [], notes: [],
  ipss: { q: [null, null, null, null, null, null, null], qol: null },
  iief: { q: [null, null, null, null, null] },
  oab: { q: [null, null, null, null, null], qol: [], impact: [] },
  iciq: { q: [null, null], vas: 0, when: [] },
  ...o,
} as AppData);

describe('Caso 46 — ICIQ-UI SF: banda "muy grave" 19-21', () => {
  it('18 sigue siendo grave', () => expect(iciqSeverity(18).text).toBe('IU grave'));
  it('19 es la frontera inferior de muy grave', () => expect(iciqSeverity(19).text).toBe('IU muy grave'));
  it('21 (máximo) es muy grave, no grave', () => expect(iciqSeverity(21).text).toBe('IU muy grave'));
});

describe('Casos 16-17 — predominio IPSS', () => {
  it('todos los ítems a 0 no es "Mixto"', () => {
    expect(ipssPredom({ q: [0, 0, 0, 0, 0, 0, 0], qol: null })).toBe('Sin predominio (no aplicable)');
  });
  it('compara medias por ítem, no sumas brutas', () => {
    // vaciado: 4 ítems suman 6 (media 1,5) · llenado: 3 ítems suman 6 (media 2,0)
    // Con sumas brutas daría empate; con medias gana llenado.
    const r = ipssPredom({ q: [2, 2, 2, 2, 1, 1, 2], qol: null });
    expect(r).toContain('llenado');
  });
});

describe('Caso 56 — hora inválida no es medianoche', () => {
  it('cadena vacía devuelve null', () => expect(toMin('')).toBeNull());
  it('24:00 se rechaza', () => expect(toMin('24:00')).toBeNull());
  it('23:60 se rechaza', () => expect(toMin('23:60')).toBeNull());
  it('texto se rechaza', () => expect(toMin('mañana')).toBeNull());
  it('hora válida sigue funcionando', () => expect(toMin('01:30')).toBe(90));
  it('isNight no clasifica una hora inválida', () => {
    expect(isNight('', '07:00', '23:00')).toBeNull();
  });
});

describe('Casos 4/21/35/39 — cuestionario incompleto no es interpretable', () => {
  it('IPSS con huecos no está completo', () => {
    expect(ipssComplete({ q: [3, null, 2, null, 1, null, 2], qol: null })).toBe(false);
  });
  it('IIEF-5 con huecos no está completo', () => {
    expect(iiefComplete({ q: [4, null, 5, null, 1] })).toBe(false);
  });
  it('AUA OAB con huecos no está completo', () => {
    expect(oabComplete(base({ oab: { q: [1, null, 3, null, 5], qol: [], impact: [] } }))).toBe(false);
  });
  it('ICIQ-SF con Q1 sin responder no está completo', () => {
    expect(iciqComplete(base({ iciq: { q: [null, 4], vas: 7, when: [] } }))).toBe(false);
  });
  it('un 0 sí es respuesta válida (no se confunde con ausencia)', () => {
    expect(ipssComplete({ q: [0, 0, 0, 0, 0, 0, 0], qol: null })).toBe(true);
  });
});

describe('Caso 78 — pad test por día, no acumulado', () => {
  it('3 días registrados de 10, 20 y 30 g dan media 20 g/día, no suma 60 g', () => {
    const d = padDayStats(base({
      days: [
        day({ padTestStatus: 'registrado', pads: [{ id: 'a', time: '08:00', dry: 0, wet: 0, leak: 10 }] }),
        day({ padTestStatus: 'registrado', pads: [{ id: 'b', time: '08:00', dry: 0, wet: 0, leak: 20 }] }),
        day({ padTestStatus: 'registrado', pads: [{ id: 'c', time: '08:00', dry: 0, wet: 0, leak: 30 }] }),
      ],
    }));
    expect(d.avgPerDay).toBe(20);
    expect(d.n).toBe(3);
  });
  it('un día sin marcar como registrado no cuenta como 0 g (se excluye)', () => {
    const d = padDayStats(base({
      days: [
        day({ padTestStatus: 'registrado', pads: [{ id: 'a', time: '08:00', dry: 0, wet: 0, leak: 12.5 }] }),
        day({ padTestStatus: 'registrado', pads: [{ id: 'b', time: '08:00', dry: 0, wet: 0, leak: 12.5 }] }),
        day({ padTestStatus: 'sin-registrar', pads: [] }),
      ],
    }));
    expect(d.n).toBe(2);
    expect(d.avgPerDay).toBe(12.5); // no 8,33 (que sería dividir entre 3)
  });
  it('Cambio 3 (ronda 3 · punto 3.4): un día registrado sin absorbentes es un día seco (0 g), no se excluye', () => {
    const d = padDayStats(base({
      days: [
        day({ padTestStatus: 'registrado', pads: [{ id: 'a', time: '08:00', dry: 0, wet: 0, leak: 20 }] }),
        day({ padTestStatus: 'registrado', pads: [] }), // seco
        day({ padTestStatus: 'sin-registrar', pads: [] }),
      ],
    }));
    expect(d.n).toBe(2);
    expect(d.dryDays).toBe(1);
    expect(d.avgPerDay).toBe(10); // (20+0)/2, no 20
  });
});

describe('Casos 72-73 — volumen/kg depende del peso (Cambio 3: sin etiqueta "poliuria")', () => {
  const dayWith = (vols: number[]) => day({
    dayComplete: true,
    entries: vols.map((v, i) => entry({ time: `0${8 + i}:00`.slice(-5), void: v })),
  });

  it('50 kg con 2500 ml/24h → 50 ml/kg', () => {
    const s = computeStats(base({
      patient: { name: '', age: '', sex: '', med: '', weight: '50' } as AppData['patient'],
      days: [dayWith([700, 600, 600, 600])],
    }));
    expect(s.polyMlPerKg).toBe(50);
  });

  it('100 kg con 3000 ml/24h → 30 ml/kg', () => {
    const s = computeStats(base({
      patient: { name: '', age: '', sex: '', med: '', weight: '100' } as AppData['patient'],
      days: [dayWith([750, 750, 750, 750])],
    }));
    expect(s.polyMlPerKg).toBe(30);
  });

  it('sin peso, el ml/kg no se evalúa (null, no false ni 0)', () => {
    const s = computeStats(base({ days: [dayWith([750, 750, 750, 750])] }));
    expect(s.polyMlPerKg).toBeNull();
  });

  it('la referencia de ml/kg está declarada y versionada, pero ya no se aplica como umbral', () => {
    expect(CLINICAL_RULES.polyuriaMlPerKg).toBe(40);
    expect(CLINICAL_RULES.version).toBeTruthy();
    expect((CLINICAL_RULES as Record<string, unknown>).npiThreshold).toBeUndefined();
  });
});

describe('Caso 65 — el sondaje no se descuenta de la producción total', () => {
  it('separa volumen espontáneo de producción urinaria total', () => {
    const s = computeStats(base({
      days: [day({
        entries: [
          entry({ time: '09:00', void: 200 }),
          entry({ time: '13:00', void: 400, catheter: true }),
        ],
      })],
    }));
    expect(s.tvoid).toBe(200);        // espontáneo
    expect(s.tvoidTotal).toBe(600);   // incluye sondaje
  });
});

describe('Caso 74 / Cambio 5 (ronda 3 · punto 3.6) — "día válido" es cobertura + confirmación, no un recuento', () => {
  it('un día con un solo registro SÍ es válido si el paciente lo marcó como completo (no exige ≥4 micciones)', () => {
    const s = computeStats(base({
      days: [
        day({ dayComplete: true, entries: [entry({ time: '10:00', void: 300 })] }),
      ],
    }));
    expect(s.n).toBe(1);
    expect(s.avgDV).toBe(300);
  });
  it('un día con cuatro micciones pero sin marcar como completo NO cuenta', () => {
    const s = computeStats(base({
      days: [
        day({ dayComplete: false, entries: [200, 250, 300, 250].map((v, i) => entry({ time: `1${i}:00`, void: v })) }),
        day({ entries: [] }),
        day({ dayComplete: true, entries: [entry({ time: '10:00', void: 300 })] }),
      ],
    }));
    expect(s.n).toBe(1); // solo el tercer día, por estar marcado como completo
  });
});
