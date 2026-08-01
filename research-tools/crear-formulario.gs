/**
 * crear-formulario.gs
 * ─────────────────────────────────────────────────────────────────────────────
 * Genera automáticamente el formulario completo de evaluación de usabilidad
 * de STUIapp en Google Forms.
 *
 * CÓMO USARLO
 *   1. Ve a  https://script.google.com  →  "Nuevo proyecto"
 *   2. Borra el contenido y pega este archivo entero
 *   3. Pulsa Guardar, y luego Ejecutar (▶)
 *   4. Autoriza el acceso cuando lo pida (es tu propia cuenta)
 *   5. En el registro de ejecución aparecerán dos enlaces:
 *        · EDITAR   → para retocar el formulario
 *        · ENVIAR   → el que mandas a los urólogos
 *
 * Las respuestas caen en una única hoja de cálculo (Respuestas → icono verde).
 * Anónimo: no recoge correo ni identidad.
 * ─────────────────────────────────────────────────────────────────────────────
 */

function crearFormularioSTUIapp() {

  var form = FormApp.create('STUIapp · Evaluación de usabilidad');

  form.setDescription(
    'Gracias por participar. La evaluación completa lleva unos 20 minutos: ' +
    '10 minutos completando un caso simulado en la aplicación y 10 respondiendo estas preguntas.\n\n' +
    'Es anónimo. No se recoge tu nombre ni tu correo, y no implica datos de ningún paciente real.'
  );

  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setAllowResponseEdits(true);
  form.setConfirmationMessage(
    'Recibido. Muchísimas gracias por el tiempo — esto es lo que hace posible publicar el trabajo.'
  );

  var L15 = ['1', '2', '3', '4', '5'];

  // ═══════════════ SECCIÓN 1 · Tarea previa ═══════════════
  form.addPageBreakItem()
    .setTitle('Paso 1 · Completa este caso en la app')
    .setHelpText(
      'Antes de responder, abre STUIapp y completa el siguiente caso simulado. ' +
      'No uses datos de ningún paciente real.\n\n' +
      'CASO: Varón de 68 años que consulta por nicturia y chorro miccional débil.\n\n' +
      '1. Inicia una sesión nueva y elige el modo de seguridad\n' +
      '2. Completa el cribado inicial: sexo varón, síntomas de vaciado\n' +
      '3. Registra 3 micciones de un día (volumen, hora y grado de urgencia)\n' +
      '4. Completa el cuestionario IPSS entero\n' +
      '5. Genera el informe clínico y expórtalo a PDF\n\n' +
      'Cronométrate aproximadamente y anota si algo te bloquea. ' +
      'Cuando termines, continúa con el formulario.'
    );

  form.addGridItem()
    .setTitle('¿Pudiste completar cada tarea?')
    .setRows([
      '1. Iniciar sesión y elegir modo de seguridad',
      '2. Completar el cribado inicial',
      '3. Registrar 3 micciones',
      '4. Completar el IPSS',
      '5. Generar y exportar el informe en PDF'
    ])
    .setColumns(['Sí, sin ayuda', 'Sí, con dificultad', 'No pude'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('¿Cuántos minutos te llevó el caso completo, aproximadamente?')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Si alguna tarea te dio problemas, ¿cuál y qué pasó?')
    .setRequired(false);

  // ═══════════════ SECCIÓN 2 · Datos del evaluador ═══════════════
  form.addPageBreakItem()
    .setTitle('Tus datos')
    .setHelpText('Anónimo. Solo para describir la muestra en la publicación.');

  form.addMultipleChoiceItem()
    .setTitle('Centro')
    .setChoiceValues(['Granada', 'Málaga', 'Santa Ana (Motril)'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Años de ejercicio en urología')
    .setChoiceValues(['Menos de 5', '5-10', '11-20', 'Más de 20'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Uso previo de aplicaciones clínicas en consulta')
    .setChoiceValues(['Nunca', 'Ocasional', 'Habitual'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('Días aproximados que has usado STUIapp')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Dispositivo principal con el que la usaste')
    .setChoiceValues(['iPhone', 'Android', 'Ordenador', 'Tablet'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Navegador')
    .setChoiceValues(['Safari', 'Chrome', 'Firefox', 'Edge', 'No lo sé'])
    .setRequired(false);

  // ═══════════════ SECCIÓN 3 · SUS ═══════════════
  form.addPageBreakItem()
    .setTitle('Usabilidad general (SUS)')
    .setHelpText(
      '1 = totalmente en desacuerdo   ·   5 = totalmente de acuerdo\n\n' +
      'Contesta rápido, por impresión inicial. No le des vueltas a los ítems: ' +
      'esta escala funciona mejor con la primera reacción.'
    );

  form.addGridItem()
    .setTitle('Indica tu grado de acuerdo con cada afirmación')
    .setRows([
      '1. Creo que usaría esta aplicación con frecuencia',
      '2. Encuentro la aplicación innecesariamente compleja',
      '3. Creo que la aplicación es fácil de usar',
      '4. Creo que necesitaría ayuda de una persona con conocimientos técnicos para poder usarla',
      '5. Las distintas funciones de la aplicación están bien integradas',
      '6. Creo que la aplicación es demasiado inconsistente',
      '7. Imagino que la mayoría de la gente aprendería a usarla muy rápido',
      '8. Encuentro la aplicación muy incómoda de usar',
      '9. Me he sentido muy seguro usando la aplicación',
      '10. Necesité aprender muchas cosas antes de poder empezar a usarla'
    ])
    .setColumns(L15)
    .setRequired(true);

  // ═══════════════ SECCIÓN 4 · uMARS ═══════════════
  form.addPageBreakItem()
    .setTitle('Calidad de la aplicación (uMARS)')
    .setHelpText('1 = muy pobre / nada   ·   5 = excelente / mucho');

  form.addGridItem()
    .setTitle('Engagement')
    .setRows([
      'Entretenimiento: ¿resulta agradable de usar?',
      'Interés: ¿mantiene tu atención?',
      'Personalización: ¿se adapta a distintos perfiles de paciente?',
      'Interactividad: ¿responde bien a lo que haces?',
      'Público objetivo: ¿es adecuada para pacientes con STUI?'
    ])
    .setColumns(L15)
    .setRequired(true);

  form.addGridItem()
    .setTitle('Funcionalidad')
    .setRows([
      'Rendimiento: ¿funciona con fluidez, sin fallos ni esperas?',
      'Facilidad de uso: ¿es sencillo empezar a usarla?',
      'Navegación: ¿es lógico moverse entre pantallas?',
      'Diseño de interacción: ¿los gestos y botones son intuitivos?'
    ])
    .setColumns(L15)
    .setRequired(true);

  form.addGridItem()
    .setTitle('Estética')
    .setRows([
      'Disposición: ¿los elementos están bien organizados en pantalla?',
      'Gráficos: ¿los iconos y elementos visuales son claros?',
      'Atractivo visual: ¿resulta agradable a la vista?'
    ])
    .setColumns(L15)
    .setRequired(true);

  form.addGridItem()
    .setTitle('Información')
    .setRows([
      'Calidad: ¿la información clínica es correcta y apropiada?',
      'Cantidad: ¿la cantidad de información es la adecuada?',
      'Elementos visuales: ¿los gráficos del informe ayudan a entender?',
      'Credibilidad: ¿la fuente resulta fiable y profesional?'
    ])
    .setColumns(L15)
    .setRequired(true);

  form.addGridItem()
    .setTitle('Valoración subjetiva')
    .setRows([
      '¿Recomendarías esta app a pacientes que la puedan necesitar?',
      '¿Cuántas veces crees que la usarías en los próximos 12 meses?',
      '¿Pagarías por esta aplicación?',
      'Valoración global de la aplicación'
    ])
    .setColumns(L15)
    .setRequired(true);

  form.addGridItem()
    .setTitle('Impacto percibido en el paciente')
    .setRows([
      'Concienciación: ¿aumenta la conciencia del paciente sobre sus síntomas?',
      'Conocimiento: ¿mejora su comprensión de los STUI?',
      'Actitudes: ¿mejora su actitud hacia el manejo de sus síntomas?',
      'Intención de cambio: ¿favorece la intención de cuidarse?',
      'Búsqueda de ayuda: ¿facilita que consulte cuando debe?',
      'Comportamiento: ¿puede mejorar la adherencia al seguimiento?'
    ])
    .setColumns(L15)
    .setRequired(true);

  // ═══════════════ SECCIÓN 5 · Utilidad clínica ═══════════════
  form.addPageBreakItem()
    .setTitle('Utilidad clínica')
    .setHelpText('1 = totalmente en desacuerdo   ·   5 = totalmente de acuerdo');

  form.addGridItem()
    .setTitle('Indica tu grado de acuerdo')
    .setRows([
      'El informe generado contiene la información que necesito para decidir clínicamente',
      'El informe es más útil que un diario miccional en papel',
      'Las puntuaciones automáticas me ahorran tiempo en consulta',
      'Confío en que las puntuaciones calculadas son correctas',
      'Recomendaría esta herramienta a un paciente con STUI',
      'Creo que mis pacientes mayores de 70 años podrían usarla de forma autónoma',
      'La arquitectura de datos locales (sin servidor) me parece adecuada para datos clínicos',
      'Integraría esta herramienta en mi práctica habitual si estuviera disponible'
    ])
    .setColumns(L15)
    .setRequired(true);

  // ═══════════════ SECCIÓN 6 · Abiertas ═══════════════
  form.addPageBreakItem()
    .setTitle('Y lo más importante')
    .setHelpText(
      'Estas cuatro preguntas son las que más valor tienen. ' +
      'Contesta con total franqueza: lo negativo es más útil que lo positivo.'
    );

  form.addParagraphTextItem()
    .setTitle('¿Qué es lo que PEOR funciona o más te ha estorbado?')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Qué AÑADIRÍAS para usarla en consulta a diario?')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Detectaste algún ERROR, resultado extraño o cálculo que no cuadrara? Descríbelo.')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('¿Qué barrera principal ves para usarla con tus pacientes?')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('¿Algo más que quieras comentar?')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Para la publicación, ¿cómo prefieres figurar?')
    .setChoiceValues([
      'Coautor/a si procede según criterios de autoría',
      'En agradecimientos',
      'Prefiero no figurar'
    ])
    .setRequired(false);

  // ─────────────────────────────────────────────────────────────────────────
  Logger.log('════════════════════════════════════════════════');
  Logger.log('EDITAR:  ' + form.getEditUrl());
  Logger.log('ENVIAR:  ' + form.getPublishedUrl());
  Logger.log('════════════════════════════════════════════════');
  Logger.log('Para ver las respuestas: abre el formulario → pestaña');
  Logger.log('"Respuestas" → icono verde de Hojas de cálculo.');
}
