import type { AppData, DiaryStats, IPSSData, IIEFData } from '../types';

export const URGENCY_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
export const URGENCY_TEXT_COLORS = ['white', 'white', '#1c1917', 'white', 'white'];
export const URGENCY_LABELS = ['Sin urgencia', 'Leve', 'Moderada', 'Severa', 'Incontinencia'];

export const DRINKS = [
  { n: 'Agua', ml: 200, e: '💧' },
  { n: 'Café', ml: 150, e: '☕' },
  { n: 'Té', ml: 200, e: '🍵' },
  { n: 'Zumo', ml: 200, e: '🍊' },
  { n: 'Leche', ml: 200, e: '🥛' },
  { n: 'Refresco', ml: 330, e: '🥤' },
  { n: 'Botella', ml: 500, e: '🫙' },
  { n: 'Caldo', ml: 200, e: '🍲' },
];

export const IPSS_QUESTIONS = [
  { t: '¿Con qué frecuencia ha tenido la sensación de no vaciar completamente la vejiga al terminar de orinar?', opts: ['Ninguna', '<1/5 veces', '<Mitad veces', '~Mitad veces', '>Mitad veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha tenido que volver a orinar en las dos horas siguientes?', opts: ['Ninguna', '<1/5 veces', '<Mitad veces', '~Mitad veces', '>Mitad veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha notado que, al orinar, paraba y comenzaba de nuevo varias veces?', opts: ['Ninguna', '<1/5 veces', '<Mitad veces', '~Mitad veces', '>Mitad veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha tenido dificultad para aguantarse las ganas de orinar?', opts: ['Ninguna', '<1/5 veces', '<Mitad veces', '~Mitad veces', '>Mitad veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha observado que el chorro de orina es poco fuerte?', opts: ['Ninguna', '<1/5 veces', '<Mitad veces', '~Mitad veces', '>Mitad veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha tenido que apretar o hacer fuerza para comenzar a orinar?', opts: ['Ninguna', '<1/5 veces', '<Mitad veces', '~Mitad veces', '>Mitad veces', 'Casi siempre'] },
  { t: '¿Cuántas veces suele tener que levantarse para orinar desde que se va a la cama hasta que se levanta?', opts: ['Ninguna', '1 vez', '2 veces', '3 veces', '4 veces', '5 o más'] },
];

export const IPSS_QOL = ['Encantado', 'Muy satisfecho', 'Más bien satisfecho', 'Tan satisfecho como insatisfecho', 'Más bien insatisfecho', 'Muy insatisfecho', 'Fatal'];

export const IIEF_QUESTIONS = [
  { t: '¿Cómo calificaría su confianza para conseguir y mantener una erección?', opts: ['Sin actividad sexual', 'Muy baja', 'Baja', 'Regular', 'Alta', 'Muy alta'] },
  { t: 'Cuando tuvo erecciones con estimulación sexual, ¿con qué frecuencia fueron lo suficientemente rígidas para la penetración?', opts: ['No intentó el coito', 'Casi nunca', 'Pocas veces (<mitad)', 'Algunas veces (mitad)', 'Muchas veces (>mitad)', 'Casi siempre'] },
  { t: 'Durante el coito, ¿con qué frecuencia fue capaz de mantener la erección después de haber penetrado?', opts: ['No intentó el coito', 'Casi nunca', 'Pocas veces (<mitad)', 'Algunas veces (mitad)', 'Muchas veces (>mitad)', 'Casi siempre'] },
  { t: 'Durante el coito, ¿qué grado de dificultad tuvo para mantener la erección hasta el final?', opts: ['No intentó el coito', 'Extremadamente difícil', 'Muy difícil', 'Difícil', 'Poco difícil', 'Sin dificultad'] },
  { t: 'Cuando intentó el coito, ¿con qué frecuencia fue satisfactorio para usted?', opts: ['No intentó el coito', 'Casi nunca', 'Pocas veces (<mitad)', 'Algunas veces (mitad)', 'Muchas veces (>mitad)', 'Casi siempre'] },
];

export const OAB_QUESTIONS = [
  { t: 'Urgencia – ¿Con qué frecuencia tiene un fuerte y repentino deseo de orinar que le hace temer que se le escape orina si no llega al baño?', opts: ['Para nada', 'Rara vez', '~1 vez/día', '~3 veces/día', '~Mitad del tiempo', 'Casi siempre'] },
  { t: 'Incontinencia imperiosa – ¿Con qué frecuencia se le escapa orina después de sentir el deseo urgente de orinar?', opts: ['Para nada', 'Rara vez', '~1 vez/día', '~3 veces/día', '~Mitad del tiempo', 'Casi siempre'] },
  { t: 'Incontinencia – ¿Cuánta orina cree que se le escapa habitualmente?', opts: ['Nada', 'Gotitas', '1 cucharadita', '1 cucharada', '¼ taza', 'Vejiga entera'] },
  { t: 'Frecuencia – ¿Con qué frecuencia orina durante el día?', opts: ['1-6 veces', '7-8 veces', '9-10 veces', '11-12 veces', '13-14 veces', '≥15 veces'] },
  { t: 'Despertarse – ¿Cuántas veces se levanta por la noche para orinar?', opts: ['0 veces', '1 vez', '2 veces', '3 veces', '4 veces', '≥5 veces'] },
];

export const OAB_QOL_QUESTIONS = [
  '1b. Urgencia – un fuerte y repentino deseo de orinar con miedo a escape.',
  '2b. Incontinencia imperiosa – escape de orina tras urgencia.',
  '3b. Frecuencia – las veces que tiene que orinar.',
  '4b. Despertarse por la noche a orinar.',
  '5b. Nivel de satisfacción general.',
];

export const OAB_IMPACT_ITEMS = [
  'No le dejan dormir bien por la noche',
  'Le hacen quedarse en casa más de lo que quisiera',
  'No le dejan participar en actividades sociales o de entretenimiento',
  'Le obligan a hacer menos ejercicio o limitan su actividad física',
  'Le causan problemas con amigos o seres queridos',
  'Hacen que evite viajar o usar transporte público',
  'Le hacen planear viajes según la ubicación de baños públicos',
  'Le están causando problemas en el trabajo',
];

export const ICIQ_Q1_OPTS = [
  { v: 0, t: 'Nunca' },
  { v: 1, t: 'Una vez a la semana' },
  { v: 2, t: '2-3 veces/semana' },
  { v: 3, t: 'Una vez al día' },
  { v: 4, t: 'Varias veces al día' },
  { v: 5, t: 'Continuamente' },
];

export const ICIQ_Q2_OPTS = [
  { v: 0, t: 'No se me escapa nada' },
  { v: 2, t: 'Muy poca cantidad' },
  { v: 4, t: 'Cantidad moderada' },
  { v: 6, t: 'Mucha cantidad' },
];

export const ICIQ_WHEN = [
  'Nunca',
  'Antes de llegar al servicio',
  'Al toser o estornudar',
  'Mientras duermo',
  'Al realizar esfuerzos físicos/ejercicio',
  'Cuando termino de orinar y ya me he vestido',
  'Sin motivo evidente',
  'De forma continua',
];

// ─── Scoring functions ────────────────────────────────────────────────

export function ipssScore(ipss: IPSSData): number {
  return ipss.q.reduce((s: number, v) => s + (v ?? 0), 0);
}

export function ipssComplete(ipss: IPSSData): boolean {
  return ipss.q.every((v) => v !== null);
}

export function ipssSeverity(score: number): { text: string; colorClass: string } {
  if (score <= 7) return { text: 'Leve', colorClass: 'text-emerald-500' };
  if (score <= 19) return { text: 'Moderado', colorClass: 'text-amber-500' };
  return { text: 'Grave', colorClass: 'text-red-500' };
}

export function ipssPredom(ipss: IPSSData): string {
  const q = ipss.q;
  const fill = (q[1] ?? 0) + (q[3] ?? 0) + (q[6] ?? 0);
  const void_ = (q[0] ?? 0) + (q[2] ?? 0) + (q[4] ?? 0) + (q[5] ?? 0);
  if (fill > void_) return 'Llenado (Irritativo)';
  if (void_ > fill) return 'Vaciado (Obstructivo)';
  return 'Mixto';
}

export function iiefScore(iief: IIEFData): number {
  return iief.q.reduce((s: number, v) => s + (v ?? 0), 0);
}

export function iiefSeverity(sc: number): { text: string; colorClass: string } {
  if (sc >= 22) return { text: 'Sin disfunción eréctil', colorClass: 'text-emerald-500' };
  if (sc >= 17) return { text: 'DE leve', colorClass: 'text-sky-500' };
  if (sc >= 12) return { text: 'DE leve-moderada', colorClass: 'text-amber-500' };
  if (sc >= 8) return { text: 'DE moderada', colorClass: 'text-amber-500' };
  return { text: 'DE severa', colorClass: 'text-red-500' };
}

export function oabScore(data: AppData): number {
  return data.oab.q.reduce((s: number, v) => s + (v ?? 0), 0);
}

export function iciqScore(data: AppData): number {
  return (data.iciq.q[0] ?? 0) + (data.iciq.q[1] ?? 0) + (data.iciq.vas ?? 0);
}

export function iciqSeverity(sc: number): { text: string; colorClass: string } {
  if (sc === 0) return { text: 'Sin incontinencia urinaria', colorClass: 'text-emerald-500' };
  if (sc <= 5) return { text: 'IU leve', colorClass: 'text-sky-500' };
  if (sc <= 12) return { text: 'IU moderada', colorClass: 'text-amber-500' };
  return { text: 'IU grave', colorClass: 'text-red-500' };
}

export function padSeverity(total: number): { text: string; colorClass: string } {
  if (total < 2) return { text: 'Normal (<2g)', colorClass: 'text-emerald-500' };
  if (total < 100) return { text: 'IU leve', colorClass: 'text-sky-500' };
  if (total < 200) return { text: 'IU moderada', colorClass: 'text-amber-500' };
  return { text: 'IU grave', colorClass: 'text-red-500' };
}

// ─── Time utilities ────────────────────────────────────────────────────

export function toMin(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function isNight(time: string, wake: string, sleep: string): boolean {
  if (!wake || !sleep) return false;
  const em = toMin(time), wm = toMin(wake), sm = toMin(sleep);
  return sm > wm ? (em >= sm || em < wm) : (em >= sm && em < wm);
}

export function nowTime(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ─── Diary stats ───────────────────────────────────────────────────────

export function computeStats(data: AppData): DiaryStats {
  const days = data.days;
  const allE = days.flatMap((d) => d.entries);
  const n = Math.max(days.filter((d) => d.entries.length > 0).length, 1);
  const sv = days.flatMap((d) => d.entries.filter((e) => e.void !== null && !e.catheter));
  const nf = sv.filter((e) => !e.firstMorning);
  const vols = sv.map((e) => e.void as number);
  const maxV = nf.length ? Math.max(...nf.map((e) => e.void as number)) : vols.length ? Math.max(...vols) : 0;
  const minV = vols.length ? Math.min(...vols) : 0;
  const avgV = vols.length ? Math.round(vols.reduce((s, v) => s + v, 0) / vols.length) : 0;
  const tvoid = vols.reduce((s, v) => s + v, 0);
  const avgDV = Math.round(tvoid / n);
  const td = allE.filter((e) => e.drinkAmt).reduce((s, e) => s + (e.drinkAmt ?? 0), 0);

  const df = days.map((d) => {
    const dv = d.entries.filter((e) => e.void !== null && !e.catheter);
    return {
      total: dv.length,
      diurnal: d.wake && d.sleep ? dv.filter((e) => !isNight(e.time, d.wake, d.sleep)).length : dv.length,
      nocturnal: d.wake && d.sleep ? dv.filter((e) => isNight(e.time, d.wake, d.sleep)).length : 0,
    };
  });
  const adf = df.filter((_, i) => days[i].entries.length > 0);
  const avgD = adf.length ? +(adf.reduce((s, d) => s + d.diurnal, 0) / adf.length).toFixed(1) : 0;
  const avgN = adf.length ? +(adf.reduce((s, d) => s + d.nocturnal, 0) / adf.length).toFixed(1) : 0;

  const ue = allE.filter((e) => (e.urgency ?? 0) >= 1).length;
  const su = allE.filter((e) => (e.urgency ?? 0) >= 3).length;
  const ubg = [0, 1, 2, 3, 4].map((g) => allE.filter((e) => e.urgency === g).length);
  const ul = allE.filter((e) => e.leak === 'urgency').length;
  const el = allE.filter((e) => e.leak === 'effort').length;
  const pads = allE.filter((e) => e.pad).length;
  const iv = allE.filter((e) => e.incomplete && e.void).length;

  const nv = days.reduce((s, d) => s + (d.wake && d.sleep ? d.entries.filter((e) => e.void !== null && !e.catheter && isNight(e.time, d.wake, d.sleep)).reduce((ss, e) => ss + (e.void ?? 0), 0) : 0), 0);
  const hn = days.some((d) => d.wake && d.sleep && d.entries.length > 0);
  const npI = tvoid > 0 && hn ? +(nv / tvoid * 100).toFixed(1) : null;

  const ints: number[] = [];
  days.forEach((d) => {
    const s2 = [...d.entries.filter((e) => e.void !== null && !e.catheter)].sort((a, b) => a.time.localeCompare(b.time));
    for (let i = 1; i < s2.length; i++) {
      let diff = toMin(s2[i].time) - toMin(s2[i - 1].time);
      if (diff < 0) diff += 1440;
      ints.push(diff);
    }
  });
  const avgI = ints.length ? Math.round(ints.reduce((s, v) => s + v, 0) / ints.length) : null;
  const ni = avgD + avgN > 0 ? +((avgN / (avgD + avgN)) * 100).toFixed(1) : null;

  return { n, maxV, minV, avgV, tvoid, avgDV, totalDrink: td, avgDD: Math.round(td / n), avgD, avgN, ue, su, avgU: +(ue / n).toFixed(1), avgS: +(su / n).toFixed(1), ubg, ul, el, pads, npI, avgI, ni, iv, poly: avgDV > 2800 };
}

// ─── Clinical note ────────────────────────────────────────────────────

export function generateClinicalNote(data: AppData): string {
  const p = data.patient;
  const s = data.days.some((d) => d.entries.length > 0) ? computeStats(data) : null;
  let t = 'EVALUACIÓN STUI\n';
  t += '━'.repeat(44) + '\n';
  t += `Paciente: ${p.name || '—'}${p.age ? ' | ' + p.age : ''}${p.sex ? ' | ' + (p.sex === 'M' ? 'Varón' : 'Mujer') : ''}${p.med ? '\nMedicación: ' + p.med : ''}\n\n`;

  if (s) {
    const dates = data.days.filter((d) => d.date).map((d) => d.date).join(' / ') || 'sin fecha';
    t += `DIARIO MICCIONAL (${s.n} días | ${dates})\n`;
    t += `• Ingesta: ${s.avgDD} ml/24h · Frecuencia: ${s.avgD}/día · Nocturia: ${s.avgN}/noche${s.avgN >= 2 ? ' (ICS ≥2 ✓)' : ''}\n`;
    t += `• CVF: ${s.maxV} ml${s.maxV > 0 && s.maxV < 200 ? ' ← REDUCIDA' : ''}  · Vol. prom: ${s.avgV} ml\n`;
    t += `• DMU (≥1): ${s.ue} total · Grado 3-4: ${s.avgS}/día\n`;
    if (s.ul > 0) t += `• IUU: ${s.ul} episodios\n`;
    if (s.el > 0) t += `• IUE: ${s.el} episodios\n`;
    if (s.npI !== null) t += `• IPN: ${s.npI}%${s.npI > 33 ? ' ← POLIURIA NOCTURNA (>33%)' : ''}\n`;
    t += '\n';
  }

  if (ipssComplete(data.ipss)) {
    const sc = ipssScore(data.ipss);
    const sev = ipssSeverity(sc);
    t += `IPSS: ${sc}/35 (${sev.text}) | Predominio: ${ipssPredom(data.ipss)}\n`;
    if (data.ipss.qol !== null) t += `QoL: ${data.ipss.qol}/6 (${IPSS_QOL[data.ipss.qol]})\n`;
    t += '\n';
  }

  if (data.screening.iief && data.iief.q.every((v) => v !== null)) {
    const sc = iiefScore(data.iief);
    const sev = iiefSeverity(sc);
    t += `IIEF-5: ${sc}/25 (${sev.text})\n\n`;
  }

  if (data.screening.oab && data.oab.q.every((v) => v !== null)) {
    const sc = oabScore(data);
    t += `OAB-q síntomas: ${sc}/25${sc === 0 ? '' : sc <= 10 ? ' (Leve)' : sc <= 18 ? ' (Moderado)' : ' (Grave)'}\n\n`;
  }

  if (data.screening.iciq && data.iciq.q[0] !== null) {
    const sc = iciqScore(data);
    t += `ICIQ-SF: ${sc}/21${sc === 0 ? ' (Sin IU)' : sc <= 5 ? ' (IU leve)' : sc <= 12 ? ' (IU moderada)' : ' (IU grave)'}\n`;
    if (data.iciq.when.length > 0) t += `Pérdida: ${data.iciq.when.map((i) => ICIQ_WHEN[i]).join(', ')}\n`;
    t += '\n';
  }

  const allPads = data.days.flatMap((d) => d.pads ?? []);
  if (allPads.length > 0) {
    const padTotal = +(allPads.reduce((s, e) => s + e.leak, 0)).toFixed(1);
    t += `Pad Test (3 días): ${padTotal}g total · ${allPads.length} absorbente(s) (${padSeverity(padTotal).text})\n\n`;
  }

  t += '━'.repeat(44) + '\n';
  t += `Informe generado con STUI App · AEU · ${new Date().toLocaleDateString('es-ES')}`;
  return t;
}
