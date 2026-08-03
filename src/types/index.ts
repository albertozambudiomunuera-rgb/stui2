export type Sex = 'M' | 'F' | '';
export type LeakType = 'urgency' | 'effort' | '';
export type PadType = 'ropa interior' | 'protector' | 'pañal' | '';
export type TabId = 'patient' | 'screening' | 'day-0' | 'day-1' | 'day-2' | 'ipss' | 'iief' | 'oab' | 'iciq' | 'dashboard' | 'notes';

export interface Patient {
  name: string;
  age: string;
  sex: Sex;
  med: string;
  weight: string;
}

export interface Screening {
  iief: boolean | null;
  oab: boolean | null;
  iciq: boolean | null;
}

export interface DiaryEntry {
  id: string;
  /** Clave generada al abrir el formulario (no al guardar): un doble toque o un
   * reenvío reutiliza la misma entrada en curso y se descarta como duplicado;
   * dos micciones distintas, aunque sean idénticas en contenido, tienen claves
   * distintas y se guardan ambas. */
  clientKey: string;
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
  /** Hora a la que el paciente calcula que se quedó dormido (distinta de `sleep`,
   * que es la hora de acostarse). Opcional: sin ella, la nocturia ICS y el volumen
   * nocturno no son evaluables para ese día. */
  sleepOnset: string;
  /** Si el paciente ha marcado que completó el registro de absorbentes de este
   * día. Un día 'registrado' sin absorbentes es un día seco (0 g reales), no un
   * dato ausente; un día 'sin-registrar' se excluye del cálculo. */
  padTestStatus: 'registrado' | 'sin-registrar';
  /** Si el paciente ha marcado explícitamente este día como terminado. Junto con
   * `wake`/`sleep` define si el día es "válido" para promediar (ver
   * CLINICAL_RULES.validDayRule) — regla interna de calidad, no clínica. */
  dayComplete: boolean;
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
  vas: number | null;
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
  // Días válidos: regla interna de calidad (ver CLINICAL_RULES.validDayRule),
  // NO un umbral clínico. Un día cuenta si tiene wake/sleep informados y el
  // paciente lo ha marcado como completo (DayData.dayComplete) — no se exige
  // ningún número mínimo de micciones.
  n: number;                 // días válidos, usados como denominador de los promedios "por día registrado"
  totalDays: number;         // días con algún registro (informativo: "n de totalDays")
  maxV: number | null;
  minV: number | null;
  avgV: number | null;
  tvoid: number | null;      // volumen miccionado espontáneo del periodo registrado (excluye sondaje)
  tvoidTotal: number | null; // producción urinaria total del periodo registrado (incluye sondaje)
  avgDV: number | null;      // volumen medio por día registrado (NO un periodo de 24h ICS encadenado)
  totalDrink: number;
  avgDD: number | null;      // ingesta media por día registrado
  avgD: number | null;
  avgN: number | null;
  ue: number;
  su: number;
  avgU: number | null;
  avgS: number | null;
  ubg: number[];
  ul: number;
  el: number;
  pads: number;
  npI: number | null;        // proporción de volumen nocturno sobre el volumen del día registrado (no un "IPN" de 24h ICS)
  avgI: number | null;
  excludedTimeEntries: number; // micciones no clasificables como diurnas/nocturnas: hora inválida/vacía, o día sin wake/sleep informados
  ni: number | null;
  iv: number;
  // Nocturia ICS: micciones tras conciliar el sueño (sleepOnset) y antes del
  // despertar definitivo (el vaciado marcado firstMorning no cuenta como
  // episodio). null si sleepOnset no se ha informado en ningún día.
  nocturiaCount: number | null;
  nocturiaDays: number; // días con sleepOnset informado — denominador COMÚN de nocturiaCount y nocturnalVolume
  // Volumen producido desde sleepOnset (no desde `sleep`/acostarse) hasta el
  // despertar, incluido el primer vaciado de la mañana. Un vaciado posterior a
  // acostarse pero anterior a conciliar el sueño NO cuenta. null si ningún día
  // tiene sleepOnset informado (ver nocturiaDays).
  nocturnalVolume: number | null;
  polyMlPerKg: number | null; // ml/kg por día registrado — valor mostrado sin etiqueta de umbral ni de "24h"
}

export interface PadDayResult {
  dayIndex: number;
  date: string;
  grams: number;
}

export interface PadTestStats {
  days: PadDayResult[]; // todo día con padTestStatus === 'registrado' (incluye días secos, 0 g)
  n: number;             // días registrados — denominador de la media
  dryDays: number;       // de esos n, cuántos fueron 0 g (día registrado sin absorbentes)
  avgPerDay: number | null; // media g por día registrado (no un periodo de 24h ICS)
}
