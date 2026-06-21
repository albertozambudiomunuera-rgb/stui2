export type Sex = 'M' | 'F' | '';
export type LeakType = 'urgency' | 'effort' | '';
export type PadType = 'ropa interior' | 'protector' | 'pañal' | '';
export type TabId = 'patient' | 'screening' | 'day-0' | 'day-1' | 'day-2' | 'ipss' | 'iief' | 'oab' | 'iciq' | 'dashboard' | 'notes';

export interface Patient {
  name: string;
  age: string;
  sex: Sex;
  med: string;
}

export interface Screening {
  iief: boolean | null;
  oab: boolean | null;
  iciq: boolean | null;
}

export interface DiaryEntry {
  id: string;
  time: string;
  void: number | null;
  urgency: number | null;
  leak: LeakType;
  pad: PadType;
  incomplete: boolean;
  firstMorning: boolean;
  catheter: boolean;
  drink: string;
  drinkAmt: number | null;
}

export interface PadEntry {
  id: string;
  time: string;
  dry: number;
  wet: number;
  leak: number;
}

export interface DayData {
  date: string;
  wake: string;
  sleep: string;
  entries: DiaryEntry[];
  pads: PadEntry[];
}

export interface IPSSData {
  q: (number | null)[];
  qol: number | null;
}

export interface IIEFData {
  q: (number | null)[];
}

export interface OABData {
  q: (number | null)[];
  qol: (number | null)[];
  impact: number[];
}

export interface ICIQData {
  q: (number | null)[];
  vas: number;
  when: number[];
}

export interface PatientNote {
  id: string;
  text: string;
  date: string; // ISO string
}

export interface AppData {
  patient: Patient;
  screening: Screening;
  days: DayData[];
  ipss: IPSSData;
  iief: IIEFData;
  oab: OABData;
  iciq: ICIQData;
  notes: PatientNote[];
}

export interface DiaryStats {
  n: number;
  maxV: number;
  minV: number;
  avgV: number;
  tvoid: number;
  avgDV: number;
  totalDrink: number;
  avgDD: number;
  avgD: number;
  avgN: number;
  ue: number;
  su: number;
  avgU: number;
  avgS: number;
  ubg: number[];
  ul: number;
  el: number;
  pads: number;
  npI: number | null;
  avgI: number | null;
  ni: number | null;
  iv: number;
  poly: boolean;
}
