// ESTUDIO-VALIDACION — texto de los instrumentos, transcrito literalmente
// de las versiones españolas proporcionadas por el equipo investigador. No
// modificar la redacción: es la de la versión validada.

// ─── SUS (System Usability Scale) ──────────────────────────────────────
// Brooke J. SUS: a quick and dirty usability scale (1996). Versión española
// proporcionada por el equipo investigador.
export const SUS_INSTRUCTION =
  'Por favor seleccione de cada uno de los enunciados la opción que mejor describa su experiencia con la herramienta electrónica. Un puntaje de 1 significa que usted se encuentra totalmente en desacuerdo con el enunciado, mientras que un puntaje en 5 significa que está totalmente de acuerdo, un puntaje de 3 significaría que usted se encuentra neutral con el enunciado.';

export const SUS_ANCHORS = { low: 'Totalmente en desacuerdo', high: 'Totalmente de acuerdo' };

export const SUS_ITEMS = [
  'Me gustaría usar esta herramienta frecuentemente.',
  'Considero que esta herramienta es innecesariamente compleja',
  'Considero que la herramienta es fácil de usar.',
  'Considero necesario el apoyo de personal experto para poder utilizar esta herramienta',
  'Considero que las funciones de la herramienta están bien integradas',
  'Considero que la herramienta presenta muchas contradicciones',
  'Imagino que la mayoría de las personas aprenderían a usar esta herramienta rápidamente',
  'Considero que el uso de esta herramienta es tedioso',
  'Me sentí muy confiado al usar la herramienta',
  'Necesité saber bastantes cosas antes de poder empezar a usar esta herramienta',
];

// ─── uMARS (user version of the Mobile Application Rating Scale) ───────
// Stoyanov SR et al. JMIR Mhealth Uhealth 2016;4(2):e72. Versión española
// validada: PENDIENTE de que el equipo investigador proporcione el texto.
// Mientras UMARS_SECTIONS no tenga ítems, la encuesta muestra solo el SUS.

export interface UmarsItem {
  q: string;
  /** Las 5 opciones de respuesta, de 1 a 5, con su texto literal. */
  opts: [string, string, string, string, string];
  /** El ítem admite "No aplica" (se excluye de la media de su subescala). */
  na?: boolean;
}

export interface UmarsSection {
  id: 'engagement' | 'functionality' | 'aesthetics' | 'information' | 'subjective' | 'impact';
  title: string;
  /** Cuenta para la "calidad de la app" (media de las 4 primeras subescalas). */
  objective: boolean;
  items: UmarsItem[];
}

export const UMARS_INSTRUCTION = '';

export const UMARS_SECTIONS: UmarsSection[] = [
  { id: 'engagement', title: 'Interés', objective: true, items: [] },
  { id: 'functionality', title: 'Funcionalidad', objective: true, items: [] },
  { id: 'aesthetics', title: 'Estética', objective: true, items: [] },
  { id: 'information', title: 'Información', objective: true, items: [] },
  { id: 'subjective', title: 'Calidad subjetiva', objective: false, items: [] },
  { id: 'impact', title: 'Impacto percibido', objective: false, items: [] },
];

export const UMARS_ITEM_COUNT = UMARS_SECTIONS.reduce((n, s) => n + s.items.length, 0);
