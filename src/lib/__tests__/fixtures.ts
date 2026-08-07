/**
 * fixtures.ts — Constructores de casos sintéticos para la verificación
 * de los algoritmos de puntuación de STUIapp.
 *
 * Ningún dato procede de pacientes reales. Todos los casos son sintéticos
 * y sus valores esperados se han calculado manualmente a partir de las
 * instrucciones de puntuación publicadas de cada instrumento.
 */

import type {
  AppData, DayData, DiaryEntry, PadEntry,
  IPSSData, IIEFData, OABData, ICIQData,
} from '../../types';

export function emptyDay(over: Partial<DayData> = {}): DayData {
  return { date: '', wake: '', sleep: '', sleepOnset: '', padTestStatus: 'sin-registrar', dayComplete: false, entries: [], pads: [], ...over };
}

let _n = 0;
export function entry(over: Partial<DiaryEntry> = {}): DiaryEntry {
  _n += 1;
  return {
    id: `e${_n}`,
    clientKey: `ck${_n}`,
    time: '12:00',
    void: null,
    urgency: null,
    leak: '',
    pad: '',
    incomplete: false,
    firstMorning: false,
    catheter: false,
    drink: '',
    drinkAmt: null,
    ...over,
  };
}

export function pad(over: Partial<PadEntry> = {}): PadEntry {
  _n += 1;
  return { id: `p${_n}`, time: '10:00', dry: 0, wet: 0, leak: 0, ...over };
}

export function ipss(q: (number | null)[], qol: number | null = null): IPSSData {
  return { q, qol };
}

export function iief(q: (number | null)[]): IIEFData {
  return { q };
}

export function oab(q: (number | null)[]): OABData {
  return { q, qol: [null, null, null, null, null], impact: [] };
}

export function iciq(q: (number | null)[], vas: number | null = null, when: number[] = []): ICIQData {
  return { q, vas, when };
}

export function appData(over: Partial<AppData> = {}): AppData {
  return {
    patient: { name: '', age: '', sex: '', med: '', weight: '', coffeePerDay: '', colaPerDay: '', smoker: '', cigarettesPerDay: '' },
    screening: { iief: null, oab: null, iciq: null },
    days: [],
    ipss: ipss([null, null, null, null, null, null, null]),
    iief: iief([null, null, null, null, null]),
    oab: oab([null, null, null, null, null]),
    iciq: iciq([null, null]),
    notes: [],
    ...over,
  };
}
