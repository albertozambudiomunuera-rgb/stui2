// ESTUDIO-VALIDACION — texto del SUS, transcrito literalmente de la versión
// española proporcionada por el equipo investigador. No
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
