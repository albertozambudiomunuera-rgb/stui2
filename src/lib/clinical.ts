import type { AppData, DayData, DiaryEntry, DiaryStats, IPSSData, IIEFData, PadTestStats } from '../types';

// ─── Reglas clínicas versionadas ───────────────────────────────────────
// Esta herramienta reporta valores medidos; no emite juicios de umbral.
// Los cortes de gravedad de pad test, nocturia (ICS ≥2) e IPN (20/33 %)
// dependen de la población, el protocolo y la edad, así que la app no los
// aplica: los muestra desnudos y delega la interpretación en el clínico
// que recibe el informe. Lo que sí se declara aquí es CÓMO se calcula
// cada valor y de dónde viene la definición de cada instrumento, para que
// un resultado sea trazable a la versión de reglas que lo produjo (ver
// pie de generateClinicalNote).
export const CLINICAL_RULES = {
  // Contador SECUENCIAL de la versión de reglas clínicas: 2026 es el año y
  // .11 es la undécima revisión de ese año. NO es una fecha (no significa
  // noviembre de 2026). La revisión anterior fue la 2026.10.
  version: '2026.11',
  versionScheme: 'Contador secuencial año.revisión (2026.11 = undécima revisión de 2026). No es una fecha.',
  // La app agrupa por DÍAS NATURALES del registro, no por el periodo de 24h
  // encadenado (despertar→siguiente despertar) que define la ICS. Por eso
  // ningún valor se etiqueta "24 h": se etiqueta "del día registrado". Ver
  // PERIOD_DISCLAIMER, mostrado junto a esas métricas.
  npiSource: 'Hashim H et al. ICS nocturia terminology. Neurourol Urodyn 2019 — proporción = volumen nocturno / volumen del día registrado (no un IPN de 24 h ICS: ver PERIOD_DISCLAIMER)',
  polyuriaMlPerKg: 40,       // ml/kg por día registrado — unidad de referencia mostrada, no un umbral de alerta
  ppiusSource: 'Patient Perception of Intensity of Urgency Scale (PPIUS), 0-4. Los grados 3-4 se agrupan como "urgencia intensa" por convención de esta app.',
  // Regla interna de calidad (Cambio 5, ronda 3 · punto 3.6): el criterio
  // anterior (≥4 micciones registradas) no tenía base normativa y podía
  // descartar días completos de pacientes con baja frecuencia miccional. Se
  // sustituye por cobertura (horarios informados) + confirmación explícita
  // del paciente, no por un recuento.
  validDayRule: 'Regla interna de calidad de esta aplicación: un día se considera válido para promediar si tiene horarios de sueño informados y el paciente lo ha marcado como completo. No procede de ninguna guía clínica.',
  // Política preespecificada (Cambio 6, ronda 3 · punto 3.5): el ítem 1 del
  // IIEF-5 se valida 1-5 (Rosen 1999); las bandas de gravedad se validaron
  // sobre el rango 5-25, así que un total por debajo de 5 no se clasifica.
  iief5Policy: 'El ítem 1 se puntúa 1-5 conforme al desarrollo original (Rosen 1999). Los ítems 2-5 admiten 0 ("no intentó el coito"). Cuando el paciente declara ausencia de actividad sexual, la puntuación total no se interpreta con las bandas de gravedad, que fueron validadas sobre el rango 5-25. Política preespecificada de esta aplicación.',
  // Fuente de las bandas de gravedad que la app SÍ conserva (son parte
  // constitutiva del instrumento validado) o, para el AUA OAB, la
  // constancia explícita de que el instrumento no publica bandas.
  instrumentSources: {
    ipss: 'Barry MJ et al. J Urol 1992;148(5):1549-57 — bandas 0-7 leve, 8-19 moderado, 20-35 grave',
    iief5: 'Rosen RC et al. Int J Impot Res 1999;11(6):319-26 — bandas 22-25, 17-21, 12-16, 8-11, 5-7. Uso correcto del instrumento: Otaola-Arca H et al. 2022.',
    // Cambio 8 (ronda 3 · punto 3.9): la validación original y las bandas de
    // gravedad son publicaciones distintas — la clasificación es posterior.
    iciq: 'Desarrollo y validación: Avery K et al. Neurourol Urodyn 2004;23(4):322-30 (PMID 15227649). Bandas de gravedad 1-5 leve, 6-12 moderada, 13-18 grave, 19-21 muy grave: Klovning A et al. Neurourol Urodyn 2009;28(5):411-15 (PMID 19214996), clasificación posterior a la validación original.',
    auaOab: 'Urology Care Foundation, AUA OAB Assessment Tool — puntuación 0-25, sin bandas de gravedad publicadas',
  },
} as const;

// Cambio 2 (ronda 3 · punto 3.1): la app NO implementa el periodo de 24 h
// encadenado que define la ICS (despertar→siguiente despertar, incluyendo la
// primera micción del día siguiente). Agrupa por días naturales del registro.
// Declararlo como limitación no corrige la métrica si la etiqueta sigue
// diciendo "24 h" — por eso ninguna salida de esta app usa esa etiqueta;
// todas dicen "del día registrado" y muestran este descargo junto al valor.
export const PERIOD_DISCLAIMER = 'Las métricas por día se calculan sobre días naturales del registro, no sobre periodos de 24 horas encadenados según la definición ICS. Los valores no son directamente comparables con volúmenes de 24 h obtenidos con esa metodología.';

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
  { t: '¿Con qué frecuencia ha tenido la sensación de no vaciar completamente la vejiga al terminar de orinar?', opts: ['Ninguna', 'Menos de 1 de cada 5 veces', 'Menos de la mitad de las veces', 'La mitad de las veces', 'Más de la mitad de las veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha tenido que volver a orinar en las dos horas siguientes?', opts: ['Ninguna', 'Menos de 1 de cada 5 veces', 'Menos de la mitad de las veces', 'La mitad de las veces', 'Más de la mitad de las veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha notado que, al orinar, paraba y comenzaba de nuevo varias veces?', opts: ['Ninguna', 'Menos de 1 de cada 5 veces', 'Menos de la mitad de las veces', 'La mitad de las veces', 'Más de la mitad de las veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha tenido dificultad para aguantarse las ganas de orinar?', opts: ['Ninguna', 'Menos de 1 de cada 5 veces', 'Menos de la mitad de las veces', 'La mitad de las veces', 'Más de la mitad de las veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha observado que el chorro de orina es poco fuerte?', opts: ['Ninguna', 'Menos de 1 de cada 5 veces', 'Menos de la mitad de las veces', 'La mitad de las veces', 'Más de la mitad de las veces', 'Casi siempre'] },
  { t: '¿Con qué frecuencia ha tenido que apretar o hacer fuerza para comenzar a orinar?', opts: ['Ninguna', 'Menos de 1 de cada 5 veces', 'Menos de la mitad de las veces', 'La mitad de las veces', 'Más de la mitad de las veces', 'Casi siempre'] },
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

// ─── Validación de entradas ────────────────────────────────────────────
// Verifica que un valor de ítem esté dentro del rango válido de la escala
// antes de puntuarlo. null se admite como "sin responder" (válido, pero
// incompleto); cualquier otro valor no numérico o fuera de rango se
// rechaza explícitamente en lugar de truncarse en silencio.
export function isValidScaleValue(v: number | null | undefined, min: number, max: number): boolean {
  if (v === null) return true;
  if (typeof v !== 'number' || !Number.isFinite(v)) return false;
  return v >= min && v <= max;
}

export function ipssItemValid(v: number | null): boolean {
  return isValidScaleValue(v, 0, 5);
}

// El ítem 1 del IIEF-5 (confianza) se puntúa 1-5: a diferencia de los
// ítems 2-5, no tiene una opción "0 / no hubo actividad sexual".
export function iiefItem1Valid(v: number | null): boolean {
  return isValidScaleValue(v, 1, 5);
}

export function iiefItemValid(v: number | null): boolean {
  return isValidScaleValue(v, 0, 5);
}

export function oabItemValid(v: number | null): boolean {
  return isValidScaleValue(v, 0, 5);
}

export function iciqQ1Valid(v: number | null): boolean {
  return isValidScaleValue(v, 0, 5);
}

// Q2 del ICIQ-SF no es una escala continua: solo admite 0, 2, 4 o 6.
export function iciqQ2Valid(v: number | null): boolean {
  if (v === null) return true;
  return [0, 2, 4, 6].includes(v);
}

// PPIUS (Patient Perception of Intensity of Urgency Scale) / urgencia del
// diario miccional: escala 0-4.
export function urgencyValid(v: number | null): boolean {
  return isValidScaleValue(v, 0, 4);
}

// A08 — coma decimal española: acepta "1,5" igual que "1.5". Cualquier
// otro formato (texto, varios separadores, vacío) se rechaza devolviendo
// null en vez de NaN o de truncar en silencio (p.ej. parseFloat('72,5')
// devolvería 72, un peso incorrecto sin avisar).
export function parseDecimal(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  const normalized = trimmed.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

// A06/Cambio 7 (ronda 3 · punto 3.7) — idempotencia por clave de cliente, no
// por contenido. Comparar por contenido tiene dos fallos: no detecta
// duplicados si hay una inserción intermedia o un reintento fuera de orden
// (solo mira la última entrada), y además RECHAZA dos eventos legítimos
// idénticos (dos micciones iguales a la misma hora son perfectamente
// posibles). La clave se genera al abrir el formulario, no al guardar: un
// doble toque reenvía la misma clave y se descarta; dos formularios
// distintos, aunque el contenido resultante sea idéntico, tienen claves
// distintas y ambos se guardan.
export function newClientKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return uid();
}

export function isDuplicateByClientKey(existing: DiaryEntry[], clientKey: string): boolean {
  return existing.some((e) => e.clientKey === clientKey);
}

// Migración: las entradas guardadas antes de este cambio no tienen
// clientKey. Se les asigna una al cargar, sin tocar ningún otro dato.
export function ensureEntryClientKeys(data: AppData): AppData {
  return {
    ...data,
    days: data.days.map((d) => ({
      ...d,
      entries: d.entries.map((e) => (e.clientKey ? e : { ...e, clientKey: newClientKey() })),
    })),
  };
}

export function ipssScore(ipss: IPSSData): number {
  return ipss.q.reduce((s: number, v) => s + (v ?? 0), 0);
}

export function ipssComplete(ipss: IPSSData): boolean {
  return ipss.q.every((v) => v !== null);
}

export function iiefComplete(iief: IIEFData): boolean {
  return iief.q.every((v) => v !== null);
}

export function oabComplete(data: AppData): boolean {
  return data.oab.q.every((v) => v !== null);
}

export function iciqComplete(data: AppData): boolean {
  return data.iciq.q.every((v) => v !== null) && data.iciq.vas !== null;
}

/**
 * El Diario Miccional es opcional (se pregunta en el Cribado). También se
 * considera desbloqueado si ya tiene contenido registrado — evita que un
 * paciente con el diario ya empezado antes de este cambio (o que aún no ha
 * pasado por el Cribado en esta sesión) se quede sin acceso a su propio
 * registro.
 */
export function diaryUnlocked(data: AppData): boolean {
  return data.screening.diary === true || data.days.some((d) => d.entries.length > 0 || (d.pads?.length ?? 0) > 0);
}

export function ipssSeverity(score: number): { text: string; colorClass: string } {
  if (score <= 7) return { text: 'Leve', colorClass: 'text-emerald-500' };
  if (score <= 19) return { text: 'Moderado', colorClass: 'text-amber-500' };
  return { text: 'Grave', colorClass: 'text-red-500' };
}

// Predominio sintomático — regla interna, no una categoría clínica validada.
// Compara MEDIAS por ítem (no sumas brutas) porque el bloque de llenado
// tiene 3 ítems (máx. 15) y el de vaciado 4 (máx. 20): comparar sumas
// penalizaría siempre al bloque más corto.
export function ipssPredom(ipss: IPSSData): string {
  const total = ipssScore(ipss);
  if (total === 0) return 'Sin predominio (no aplicable)';
  const q = ipss.q;
  const fillItems = [q[1], q[3], q[6]];
  const voidItems = [q[0], q[2], q[4], q[5]];
  const fillAvg = fillItems.reduce((s: number, v) => s + (v ?? 0), 0) / fillItems.length;
  const voidAvg = voidItems.reduce((s: number, v) => s + (v ?? 0), 0) / voidItems.length;
  if (fillAvg > voidAvg) return 'Predominio de síntomas de llenado (regla interna)';
  if (voidAvg > fillAvg) return 'Predominio de síntomas de vaciado (regla interna)';
  return 'Sin predominio claro';
}

export function iiefScore(iief: IIEFData): number {
  return iief.q.reduce((s: number, v) => s + (v ?? 0), 0);
}

// Cambio 6 (ronda 3 · punto 3.5): las bandas de gravedad se validaron sobre
// el rango 5-25 (Rosen 1999). Un total por debajo de 5 —posible porque los
// ítems 2-5 admiten 0 ("no intentó el coito") mientras el ítem 1 se puntúa
// 1-5— queda fuera de ese rango y no se clasifica (ver CLINICAL_RULES.iief5Policy).
export function iiefSeverity(sc: number): { text: string; colorClass: string } {
  if (sc < 5) return { text: 'Por debajo del rango validado (5-25): no se aplica clasificación de gravedad', colorClass: 'text-slate-500 dark:text-slate-400' };
  if (sc >= 22) return { text: 'Sin disfunción eréctil', colorClass: 'text-emerald-500' };
  if (sc >= 17) return { text: 'DE leve', colorClass: 'text-sky-500' };
  if (sc >= 12) return { text: 'DE leve-moderada', colorClass: 'text-amber-500' };
  if (sc >= 8) return { text: 'DE moderada', colorClass: 'text-amber-500' };
  return { text: 'DE severa', colorClass: 'text-red-500' };
}

export function oabScore(data: AppData): number {
  return data.oab.q.reduce((s: number, v) => s + (v ?? 0), 0);
}

// El AUA OAB Assessment (Urology Care Foundation) es una puntuación
// sintomática 0-25 sin bandas de gravedad publicadas — a diferencia del
// IPSS, el IIEF-5 o el ICIQ-SF, no hay una oabSeverity() que las
// reproduzca porque no hay ninguna fuente que las respalde (ver
// CLINICAL_RULES.instrumentSources.auaOab). Solo se conserva la lectura
// directa de la pregunta 1 (urgencia), que es el ítem de cribado del
// propio instrumento, no una banda derivada del total.
export function oabNoUrgency(data: AppData): boolean {
  return data.oab.q[0] === 0;
}

export const OAB_DISCLAIMER = 'Puntuación sintomática 0-25. El instrumento no define bandas de gravedad; la interpretación corresponde al profesional sanitario.';

export function iciqScore(data: AppData): number {
  return (data.iciq.q[0] ?? 0) + (data.iciq.q[1] ?? 0) + (data.iciq.vas ?? 0);
}

export function iciqSeverity(sc: number): { text: string; colorClass: string } {
  if (sc === 0) return { text: 'Sin incontinencia urinaria', colorClass: 'text-emerald-500' };
  if (sc <= 5) return { text: 'IU leve', colorClass: 'text-sky-500' };
  if (sc <= 12) return { text: 'IU moderada', colorClass: 'text-amber-500' };
  if (sc <= 18) return { text: 'IU grave', colorClass: 'text-red-500' };
  return { text: 'IU muy grave', colorClass: 'text-red-600' };
}

// La app NO clasifica el pad test por gravedad: las bandas publicadas
// (<2 / 2-99 / 100-199 / ≥200 g) dependen de la población, y difieren entre
// mujeres y varón posprostatectomía. Como STUIapp se usa en ambos sexos,
// ninguna clasificación única sería correcta — se muestra el valor continuo
// y se deja la interpretación al clínico (ver PAD_TEST_DISCLAIMER).
export const PAD_TEST_DISCLAIMER = 'Valor no clasificado: las bandas de gravedad del pad test dependen de la población y del protocolo.';

// Texto de "¿Cómo se rellena?" del Diario Miccional — compartido entre
// DiaryIntro.tsx (pantalla de bienvenida, una sola vez) y DayTab.tsx (panel
// desplegable, siempre disponible), para que ambos digan siempre lo mismo.
export const DIARY_PURPOSE = 'Registrar cada micción y cada bebida durante 3 días permite a tu médico ver con qué frecuencia orinas, cuánto volumen y si te levantas por la noche.';

export const DIARY_HOWTO_STEPS = [
  'Cada vez que orines, pulsa 🚽 Micción y anota la hora, la cantidad aproximada y si sentiste urgencia.',
  'Cada vez que bebas algo, pulsa 🥤 Bebida y anota el tipo y la cantidad.',
  'Indica la hora a la que te levantas y te acuestas cada día.',
  'Al terminar el día, marca "He terminado de registrar este día".',
];

export const DIARY_HOWTO_NOTE = 'No hace falta que sea exacto al mililitro: una estimación a ojo es suficiente.';

// Calcula el pad test por día (no acumulado). Cambio 3 (ronda 3 · punto 3.4):
// el criterio anterior (excluir todo día sin absorbentes) confundía "el
// paciente no registró este día" con "el paciente registró un día seco, sin
// pérdidas" — y elevaba la media artificialmente al promediar solo los días
// con pérdidas. Ahora el criterio es el marcador explícito `padTestStatus`:
// un día 'registrado' cuenta siempre (con 0 g si no hay absorbentes); un día
// 'sin-registrar' se excluye, tenga o no absorbentes cargados.
export function padDayStats(data: AppData): PadTestStats {
  const days = data.days
    .map((d, dayIndex) => ({ d, dayIndex }))
    .filter(({ d }) => d.padTestStatus === 'registrado')
    .map(({ d, dayIndex }) => ({
      dayIndex,
      date: d.date,
      grams: +((d.pads ?? []).reduce((s, e) => s + e.leak, 0)).toFixed(1),
    }));
  const dryDays = days.filter((d) => d.grams === 0).length;
  const avgPerDay = days.length ? +(days.reduce((s, r) => s + r.grams, 0) / days.length).toFixed(1) : null;
  return { days, n: days.length, dryDays, avgPerDay };
}

// ─── Time utilities ────────────────────────────────────────────────────

// Devuelve null (no 00:00) si la hora está vacía o es inválida, para no
// convertir una micción sin hora registrada en una medianoche falsa.
export function toMin(t: string): number | null {
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length !== 2) return null;
  const [h, m] = parts.map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

// Devuelve null cuando no se puede clasificar como diurna o nocturna, en vez
// de asumir "false" (día): la ausencia de límites no es un dato, es la
// ausencia de un dato, y tratarla como "día" sesga frecuencia e intervalos.
// Esto ocurre en dos casos: (1) la hora de la micción es vacía/inválida, o
// (2) el día no tiene wake/sleep informados (Cambio 4, ronda 3 · punto 3.3).
export function isNight(time: string, wake: string, sleep: string): boolean | null {
  if (!wake || !sleep) return null;
  const em = toMin(time);
  if (em === null) return null;
  const wm = toMin(wake), sm = toMin(sleep);
  if (wm === null || sm === null) return null;
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

// Día válido para promediar (Cambio 5, ronda 3 · punto 3.6): cobertura
// (horarios de sueño informados) + confirmación explícita del paciente de
// que terminó de registrar el día. NO exige un número mínimo de micciones:
// ese criterio (≥4) no tenía base normativa y podía descartar días
// completos de pacientes con baja frecuencia miccional. Ver
// CLINICAL_RULES.validDayRule — es una regla interna de calidad, no clínica.
function isDayComplete(d: DayData): boolean {
  return !!d.wake && !!d.sleep && d.dayComplete === true;
}

// Ordena las micciones de un día por minutos transcurridos desde la hora
// de despertar (con wraparound de 24h). Esto evita que una micción de
// madrugada (p.ej. 00:30) registrada bajo el mismo día de diario que una
// de la noche anterior (23:30) se ordene antes por comparación alfabética
// de "HH:MM", lo que invertiría el intervalo real entre ambas.
function sortKeyForDay(minutes: number, wakeMinutes: number | null): number {
  if (wakeMinutes === null) return minutes;
  return ((minutes - wakeMinutes) + 1440) % 1440;
}

export function computeStats(data: AppData): DiaryStats {
  const days = data.days;
  const allE = days.flatMap((d) => d.entries);

  const totalDays = days.filter((d) => d.entries.length > 0).length;
  const n = days.filter(isDayComplete).length;

  // Volumen espontáneo (excluye sondaje) — capacidad vesical funcional
  const sv = allE.filter((e) => e.void !== null && !e.catheter);
  const nf = sv.filter((e) => !e.firstMorning);
  const vols = sv.map((e) => e.void as number);
  const maxV = nf.length ? Math.max(...nf.map((e) => e.void as number)) : vols.length ? Math.max(...vols) : null;
  const minV = vols.length ? Math.min(...vols) : null;
  const avgV = vols.length ? Math.round(vols.reduce((s, v) => s + v, 0) / vols.length) : null;
  const tvoid = vols.length ? vols.reduce((s, v) => s + v, 0) : null;

  // Producción urinaria total (incluye sondaje) — usada para poliuria e IPN
  const volsAll = allE.filter((e) => e.void !== null).map((e) => e.void as number);
  const tvoidTotal = volsAll.length ? volsAll.reduce((s, v) => s + v, 0) : null;

  const avgDV = n > 0 && tvoid !== null ? Math.round(tvoid / n) : null;

  const td = allE.filter((e) => e.drinkAmt).reduce((s, e) => s + (e.drinkAmt ?? 0), 0);
  const avgDD = n > 0 ? Math.round(td / n) : null;

  // Clasificación diurna/nocturna (ventana declarada sleep→wake) — Cambio 4:
  // una hora inválida/vacía, o un día sin wake/sleep informados, se excluye;
  // no se cuenta como diurna ni como nocturna por defecto.
  let excludedTimeEntries = 0;
  let sumDiurnal = 0;
  let sumNocturnal = 0;
  days.forEach((d) => {
    const dv = d.entries.filter((e) => e.void !== null && !e.catheter);
    dv.forEach((e) => {
      const night = isNight(e.time, d.wake, d.sleep);
      if (night === null) { excludedTimeEntries++; return; }
      if (night) sumNocturnal++; else sumDiurnal++;
    });
  });
  const avgD = n > 0 ? +(sumDiurnal / n).toFixed(1) : null;
  const avgN = n > 0 ? +(sumNocturnal / n).toFixed(1) : null;

  const ue = allE.filter((e) => (e.urgency ?? 0) >= 1).length;
  const su = allE.filter((e) => (e.urgency ?? 0) >= 3).length;
  const avgU = n > 0 ? +(ue / n).toFixed(1) : null;
  const avgS = n > 0 ? +(su / n).toFixed(1) : null;
  const ubg = [0, 1, 2, 3, 4].map((g) => allE.filter((e) => e.urgency === g).length);
  const ul = allE.filter((e) => e.leak === 'urgency').length;
  const el = allE.filter((e) => e.leak === 'effort').length;
  const pads = allE.filter((e) => e.pad).length;
  const iv = allE.filter((e) => e.incomplete && e.void).length;

  // Volumen nocturno y nocturia (ICS) — Cambio 1, ronda 3 · punto 3.2: ambas
  // métricas comparten la MISMA frontera temporal, sleepOnset (hora de
  // conciliar el sueño), no `sleep` (hora de acostarse). Un vaciado posterior
  // a acostarse pero anterior a dormirse vacía orina producida durante el
  // día y marca el INICIO de la producción nocturna: no es volumen nocturno
  // ni episodio de nocturia. El vaciado firstMorning ("decidir levantarse")
  // sí es volumen nocturno (esa orina se produjo durmiendo) pero nunca es un
  // episodio de nocturia (es el fin de la noche, no una interrupción).
  // Sin sleepOnset, el día no aporta a ninguna de las dos métricas — sin él
  // no hay forma de saber cuándo empezó realmente la noche.
  let nocturiaEpisodes = 0;
  let nocturnalVolumeSum = 0;
  let nocturiaDays = 0;
  days.forEach((d) => {
    if (!d.sleepOnset || !d.wake) return;
    nocturiaDays++;
    d.entries.forEach((e) => {
      if (e.void === null) return;
      if (e.firstMorning) { nocturnalVolumeSum += e.void; return; }
      if (isNight(e.time, d.wake, d.sleepOnset) !== true) return; // anterior a dormirse: ni nocturia ni volumen nocturno
      nocturnalVolumeSum += e.void;
      if (!e.catheter) nocturiaEpisodes++; // el sondaje cuenta como volumen, no como episodio voluntario
    });
  });
  const nocturnalVolume = nocturiaDays > 0 ? nocturnalVolumeSum : null;
  const nocturiaCount = nocturiaDays > 0 ? +(nocturiaEpisodes / nocturiaDays).toFixed(1) : null;
  // IPN → "proporción de volumen nocturno" (Cambio 2): volumen nocturno /
  // volumen del día registrado. Se muestra el porcentaje desnudo: la app no
  // aplica ningún umbral. Sin sleepOnset, no hay volumen nocturno que
  // proporcionar: null, no un valor calculado sobre una frontera equivocada.
  const npI = tvoidTotal !== null && tvoidTotal > 0 && nocturnalVolume !== null ? +(nocturnalVolumeSum / tvoidTotal * 100).toFixed(1) : null;

  // Intervalos entre micciones — excluye horas inválidas/vacías; ordena
  // por minutos-desde-despertar para no invertir intervalos que cruzan
  // medianoche (23:30 → 00:30 = 60 min, nunca negativo).
  const ints: number[] = [];
  days.forEach((d) => {
    const wakeMinutes = d.wake ? toMin(d.wake) : null;
    const withTime = d.entries
      .filter((e) => e.void !== null && !e.catheter && toMin(e.time) !== null)
      .map((e) => {
        const m = toMin(e.time) as number;
        return { m, key: sortKeyForDay(m, wakeMinutes) };
      })
      .sort((a, b) => a.key - b.key);
    for (let i = 1; i < withTime.length; i++) {
      let diff = withTime[i].m - withTime[i - 1].m;
      if (diff < 0) diff += 1440;
      ints.push(diff);
    }
  });
  const avgI = ints.length ? Math.round(ints.reduce((s, v) => s + v, 0) / ints.length) : null;
  const ni = avgD !== null && avgN !== null && avgD + avgN > 0 ? +((avgN / (avgD + avgN)) * 100).toFixed(1) : null;

  // Volumen del día registrado en ml/kg — valor mostrado sin etiqueta de "24h"
  // ni de umbral (Cambio 2). Requiere el peso del paciente; si no está
  // disponible, no calculable.
  const weightNum = parseDecimal(data.patient.weight);
  const hasWeight = weightNum !== null && weightNum > 0;
  const polyMlPerKg = hasWeight && avgDV !== null ? +(avgDV / weightNum).toFixed(1) : null;

  return {
    n, totalDays, maxV, minV, avgV, tvoid, tvoidTotal, avgDV,
    totalDrink: td, avgDD, avgD, avgN, ue, su, avgU, avgS, ubg, ul, el, pads,
    npI, avgI, excludedTimeEntries, ni, iv,
    nocturiaCount, nocturiaDays, nocturnalVolume, polyMlPerKg,
  };
}

// ─── Clinical note ────────────────────────────────────────────────────

/** Línea de hábitos (café, cola, tabaco) para el resumen final, solo con los datos que el paciente haya rellenado. */
export function habitsLine(p: AppData['patient']): string {
  const parts: string[] = [];
  if (p.coffeePerDay) parts.push(`Café: ${p.coffeePerDay}/día`);
  if (p.colaPerDay) parts.push(`Cola: ${p.colaPerDay}/día`);
  if (p.smoker === 'yes') parts.push(`Fumador: sí${p.cigarettesPerDay ? ' (' + p.cigarettesPerDay + ' cig/día aprox.)' : ''}`);
  else if (p.smoker === 'no') parts.push('Fumador: no');
  return parts.join(' | ');
}

export function generateClinicalNote(data: AppData): string {
  const p = data.patient;
  const s = data.days.some((d) => d.entries.length > 0) ? computeStats(data) : null;
  const habits = habitsLine(p);
  let t = 'EVALUACIÓN STUI\n';
  t += '━'.repeat(44) + '\n';
  t += `Paciente: ${p.name || '—'}${p.age ? ' | ' + p.age : ''}${p.sex ? ' | ' + (p.sex === 'M' ? 'Varón' : 'Mujer') : ''}${p.weight ? ' | ' + p.weight + ' kg' : ''}${p.med ? '\nMedicación: ' + p.med : ''}${habits ? '\nHábitos: ' + habits : ''}\n\n`;

  if (s) {
    const dates = data.days.filter((d) => d.date).map((d) => d.date).join(' / ') || 'sin fecha';
    const nocturiaLine = s.nocturiaCount !== null
      ? `Nocturia (ICS): ${s.nocturiaCount}/noche (n=${s.nocturiaDays} noche${s.nocturiaDays === 1 ? '' : 's'} con hora de sueño registrada)`
      : s.avgN !== null
      ? `Micciones en la ventana nocturna declarada: ${s.avgN}/noche (no evaluable como nocturia ICS: falta la hora de conciliación del sueño)`
      : 'Nocturia: sin datos';
    t += `DIARIO MICCIONAL (${s.n} día${s.n === 1 ? '' : 's'} válido${s.n === 1 ? '' : 's'} de ${s.totalDays} con registros | ${dates})\n`;
    t += `• Ingesta del día registrado: ${s.avgDD !== null ? s.avgDD + ' ml' : 'sin datos'} · Frecuencia: ${s.avgD !== null ? s.avgD + '/día' : 'sin datos'}\n`;
    t += `• ${nocturiaLine}\n`;
    t += `• CVF: ${s.maxV !== null ? s.maxV + ' ml' + (s.maxV > 0 && s.maxV < 200 ? ' ← REDUCIDA' : '') : 'sin datos'}  · Vol. prom: ${s.avgV !== null ? s.avgV + ' ml' : 'sin datos'}\n`;
    t += `• DMU (≥1): ${s.ue} total · Urgencia intensa (PPIUS grados 3-4): ${s.avgS !== null ? s.avgS + '/día' : 'sin datos'}\n`;
    if (s.ul > 0) t += `• IUU: ${s.ul} episodios\n`;
    if (s.el > 0) t += `• IUE: ${s.el} episodios\n`;
    if (s.npI !== null) t += `• Proporción de volumen nocturno: ${s.npI} %\n`;
    if (s.avgDV !== null) {
      t += s.polyMlPerKg !== null
        ? `• Volumen del día registrado: ${s.avgDV} ml = ${s.polyMlPerKg} ml/kg por día registrado\n`
        : `• Volumen del día registrado: ${s.avgDV} ml (ml/kg no calculable, falta el peso)\n`;
    }
    if (s.excludedTimeEntries > 0) t += `• ${s.excludedTimeEntries} registro(s) no clasificado(s) como diurno/nocturno (hora inválida o día sin horario registrado)\n`;
    t += '\n';
  }

  if (ipssComplete(data.ipss)) {
    const sc = ipssScore(data.ipss);
    const sev = ipssSeverity(sc);
    t += `IPSS: ${sc}/35 (${sev.text}) | Predominio: ${ipssPredom(data.ipss)} (no equivale a diagnóstico de obstrucción)\n`;
    if (data.ipss.qol !== null) t += `QoL: ${data.ipss.qol}/6 (${IPSS_QOL[data.ipss.qol]})\n`;
    t += '\n';
  } else {
    t += 'IPSS: cuestionario incompleto (no interpretable)\n\n';
  }

  if (data.screening.iief) {
    if (iiefComplete(data.iief)) {
      const sc = iiefScore(data.iief);
      const sev = iiefSeverity(sc);
      t += `IIEF-5: ${sc}/25 (${sev.text})\n\n`;
    } else {
      t += 'IIEF-5: cuestionario incompleto (no interpretable)\n\n';
    }
  }

  if (data.screening.oab) {
    if (oabComplete(data)) {
      const sc = oabScore(data);
      t += `AUA OAB Assessment: ${sc}/25${oabNoUrgency(data) ? ' (Sin urgencia miccional)' : ''}\n`;
      t += `${OAB_DISCLAIMER}\n\n`;
    } else {
      t += 'AUA OAB Assessment: cuestionario incompleto (no interpretable)\n\n';
    }
  }

  if (data.screening.iciq) {
    if (iciqComplete(data)) {
      const sc = iciqScore(data);
      t += `ICIQ-SF: ${sc}/21 (${iciqSeverity(sc).text})\n`;
      if (data.iciq.when.length > 0) t += `Pérdida: ${data.iciq.when.map((i) => ICIQ_WHEN[i]).join(', ')}\n`;
      t += '\n';
    } else {
      t += 'ICIQ-SF: cuestionario incompleto (no interpretable)\n\n';
    }
  }

  const padStats = padDayStats(data);
  if (padStats.n > 0 && padStats.avgPerDay !== null) {
    const perDay = padStats.days.map((d) => `${d.grams}g`).join(' / ');
    t += `Pad test: ${padStats.avgPerDay} g por día registrado (media de n=${padStats.n} día${padStats.n === 1 ? '' : 's'} registrado${padStats.n === 1 ? '' : 's'}, ${padStats.dryDays} seco${padStats.dryDays === 1 ? '' : 's'}; ${perDay})\n`;
    t += `${PAD_TEST_DISCLAIMER}\n\n`;
  }

  t += '━'.repeat(44) + '\n';
  t += `Reglas clínicas aplicadas: v${CLINICAL_RULES.version}\n`;
  t += `${PERIOD_DISCLAIMER}\n`;
  t += `${CLINICAL_RULES.validDayRule}\n`;
  if (data.screening.iief) t += `${CLINICAL_RULES.iief5Policy}\n`;
  t += 'Fuente de las bandas de gravedad:\n';
  t += `• IPSS: ${CLINICAL_RULES.instrumentSources.ipss}\n`;
  t += `• IIEF-5: ${CLINICAL_RULES.instrumentSources.iief5}\n`;
  t += `• ICIQ-SF: ${CLINICAL_RULES.instrumentSources.iciq}\n`;
  t += `• AUA OAB: ${CLINICAL_RULES.instrumentSources.auaOab}\n`;
  t += `Informe generado con STUI App · AEU · ${new Date().toLocaleDateString('es-ES')}`;
  return t;
}

const RULES_FOOTER_SEP = '\n' + '━'.repeat(44) + '\n';

/**
 * Separa generateClinicalNote() en el cuerpo principal y la cola de "Reglas
 * clínicas aplicadas" (versión + fuentes bibliográficas), para que la UI
 * pueda mostrar esa cola en un desplegable colapsado sin tapar el resto del
 * informe. Usa el ÚLTIMO separador, no el primero: el mismo separador de
 * guiones abre también la cabecera "EVALUACIÓN STUI", así que buscar el
 * primero cortaría el informe justo después del título.
 * El texto para copiar/imprimir sigue usando generateClinicalNote() completo.
 */
export function splitClinicalNote(note: string): { main: string; rules: string } {
  const idx = note.lastIndexOf(RULES_FOOTER_SEP);
  if (idx < 0) return { main: note, rules: '' };
  return { main: note.slice(0, idx), rules: note.slice(idx + RULES_FOOTER_SEP.length) };
}
