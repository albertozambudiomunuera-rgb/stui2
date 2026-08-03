# Changelog — validación clínica (revisión mayor)

Respuesta al dictamen de "revisión mayor necesaria" de los dos médicos
adjuntos sobre los 78 casos de prueba (17 con corrección requerida, 9 no
certificables). Cada entrada indica el archivo afectado y el número de
caso del informe que la motivó.

## Bloque A — crítico

- **A1. Cuestionario incompleto no muestra puntuación ni gravedad.**
  Añadidos `iiefComplete`, `oabComplete`, `iciqComplete` en `clinical.ts`.
  `DashboardTab.tsx`, `ExpressMode.tsx`, `IPSSTab.tsx`, `IIEFTab.tsx`,
  `OABTab.tsx`, `ICIQTab.tsx`: la severidad y el predominio solo se
  muestran con el cuestionario completo; mientras esté incompleto se
  muestra "Faltan N preguntas" y, si hay respuestas parciales, la
  puntuación provisional va acompañada de "provisional — cuestionario
  incompleto". `generateClinicalNote` y el HTML de impresión muestran
  `"<Instrumento>: cuestionario incompleto (no interpretable)"` sin
  número ni categoría. *(Casos 4, 21, 35, 39)*
  - Efecto colateral necesario: `ICIQData.vas` pasa de `number` (por
    defecto `5`) a `number | null` (por defecto `null`); un slider con
    valor por defecto distinto de "sin responder" se contaba como
    respuesta real. `ICIQData.q` pasa de 3 a 2 elementos en
    `storage.ts` (el tercer ítem nunca se usó en la interfaz y hacía
    que `iciqComplete` no pudiera ser `true` nunca).

- **A2. El pad test no se suma entre días.** Nueva función
  `padDayStats()` en `clinical.ts`: calcula gramos por día, excluye
  los días sin registro (no cuenta como 0 g) y expone la media g/24h
  sobre los días válidos. `padSeverity()` se aplica únicamente a ese
  valor por día/media, nunca al acumulado. Sustituido en
  `DashboardTab.tsx`, `ExpressMode.tsx` y `generateClinicalNote`.
  `DayTab.tsx` ya aplicaba `padSeverity` al total del día individual;
  no requería cambios. *(Caso 78)*

- **A3. Poliuria: umbral en ml/kg, no un volumen fijo.** `Patient.weight`
  añadido a `types/index.ts` y a `PatientTab.tsx` (opcional). `computeStats`
  calcula `poly: boolean | null` y `polyMlPerKg` a partir de
  `avgDV / peso`, con el criterio `CLINICAL_RULES.polyuriaMlPerKg = 40`.
  Sin peso registrado, `poly` es `null` ("no evaluable, falta el peso").
  El mensaje muestra siempre el criterio aplicado. *(Casos 72-73)*

- **A4. IPN: umbral versionado y declarado.** Nueva constante exportada
  `CLINICAL_RULES` (`clinical.ts`) con `npiThreshold`, `npiSource` y
  `polyuriaMlPerKg`, con la referencia (Hashim H et al., ICS 2019).
  Eliminada la palabra "confirmada"; el texto ahora declara el umbral y
  la fuente. `CLINICAL_RULES.version` se imprime en el pie de
  `generateClinicalNote` y del PDF. *(Casos 67-68)*

## Bloque B — importante

- **B1. Falta la categoría "muy grave" del ICIQ-UI SF (19-21).**
  `iciqSeverity()` añade la banda 19-21. Corregidos los ternarios
  manuales equivalentes en `generateClinicalNote` y en el HTML de
  impresión de `DashboardTab.tsx`/`ExpressMode.tsx` (ahora usan
  `iciqSeverity()` en vez de reimplementar los cortes). *(Caso 46)*

- **B2. Predominio IPSS no validado, y sin sentido en score=0.**
  `ipssPredom()` reescrita: compara medias por ítem (no sumas brutas,
  que penalizaban al bloque de llenado por tener 3 ítems frente a 4);
  devuelve `"Sin predominio (no aplicable)"` con puntuación total 0, y
  las etiquetas se renombran a `"Predominio de síntomas de
  llenado/vaciado (regla interna)"` / `"Sin predominio claro"`. Añadida
  la nota "no equivale a diagnóstico de obstrucción" donde se muestra
  (IPSSTab, hallazgos del Dashboard/Exprés, nota clínica). *(Casos 14-17)*

- **B3. Una hora vacía no es medianoche.** `toMin()` devuelve
  `number | null` (rechaza vacío, formato inválido y fuera de rango:
  `24:00`, `23:60`, etc.). `isNight()` propaga `null` ("no
  clasificable") en vez de asumir "día". `computeStats` excluye del
  cálculo de frecuencia diurna/nocturna y de intervalos las micciones
  sin hora válida, y expone `excludedTimeEntries`. También se corrigió
  el ordenamiento de intervalos: antes se ordenaba alfabéticamente por
  "HH:MM", lo que invertía los intervalos que cruzan medianoche dentro
  del mismo día de diario (23:30 → 00:30 se convertían en ~1380 min en
  vez de 60). Ahora se ordena por minutos transcurridos desde la hora
  de despertar. `DayTab.tsx` actualizado para el nuevo tipo de
  `isNight`. *(Caso 56)*

- **B4. El sondaje se descontaba también del volumen total.**
  `DiaryStats` añade `tvoidTotal` (producción total, incluye sondaje),
  distinto de `tvoid` (volumen espontáneo, capacidad vesical
  funcional). El índice de poliuria nocturna (IPN) usa `tvoidTotal` en
  numerador y denominador; la poliuria (A3) usa `avgDV`, derivado de
  `tvoid` espontáneo tal como especifica el informe. *(Caso 65)*

- **B5. Un día con un solo registro no es un día válido.** Nuevo
  criterio `isDayComplete()`: ≥4 micciones registradas y hora de
  acostarse/despertar informadas. Solo los días completos cuentan en el
  denominador de `avgDV`, `avgDD`, `avgD`, `avgN`, `avgU`, `avgS`.
  `DiaryStats.n` (días válidos) y `DiaryStats.totalDays` (días con
  algún registro) se exponen ambos; la interfaz y la nota clínica
  muestran "n de totalDays días". *(Caso 74)*

## Bloque C — redacción

- **C1. Lenguaje descriptivo, no asertivo.** Renombrado `suggestions` →
  `findings` en `DashboardTab.tsx`/`ExpressMode.tsx`; título de sección
  "Interpretación de los resultados" → "Hallazgos registrados". Reescritos
  los mensajes de IPN, incontinencia de urgencia/esfuerzo, nocturia,
  IIEF-5 y poliuria según la tabla del informe (sin "confirmada",
  "presente" ni "significativa" como afirmaciones diagnósticas).

- **C2. Diario vacío muestra "sin datos", no 0 ml.** `maxV`, `minV`,
  `avgV`, `tvoid`, `tvoidTotal`, `avgDV`, `avgDD`, `avgD`, `avgN`,
  `avgU`, `avgS`, `avgI` pasan a `number | null` en `DiaryStats`
  (antes devolvían `0` cuando no había datos suficientes, que se lee
  como anuria/ausencia de síntomas). Todas las interpolaciones en
  `DashboardTab.tsx`, `ExpressMode.tsx` y `generateClinicalNote`
  comprueban `!== null` y muestran "sin datos" en su lugar. *(Caso 75)*

## Bloque D — tests nuevos

Añadidos a `scoring.test.ts`, agrupados en los `describe` indicados por
el informe: `entradas inválidas` (rechazo de negativos, fuera de rango,
texto/NaN/Infinity, y distinción 0 / null / undefined / ''), `fronteras
que faltan` (ICIQ 18/19, IIEF-5 ítem 1 = 0 inválido, totales 1-4,
PPIUS/urgencia = 5 rechazado), tiempo (hora vacía, `24:00`/`23:60`,
intervalo que cruza medianoche, micción única, orden y no-negatividad
de intervalos), y diario/poliuria (poliuria por peso, día de una sola
micción, día vacío entre válidos, pad test por día, sondaje vs.
espontáneo). Para las pruebas de "entradas inválidas" se añadió una
capa de validación mínima y reutilizable en `clinical.ts`
(`isValidScaleValue` y los validadores por instrumento
`ipssItemValid`, `iiefItem1Valid`, `iiefItemValid`, `oabItemValid`,
`iciqQ1Valid`, `iciqQ2Valid`, `urgencyValid`); no se ha tocado la
interfaz de captura (los botones ya restringen las opciones a valores
válidos), es una capa defensiva para datos importados o corruptos.

## Tanda 2 — reglas clínicas sin umbral (v2026.09)

Cinco puntos que la primera tanda no resolvió: en su mayoría no eran bugs de
cálculo, sino reglas clínicas que la app aplicaba sin declarar su origen, y
definiciones temporales que no coincidían con las de la ICS. Criterio general
de esta tanda: **la app reporta valores medidos, no emite juicios de umbral**;
donde antes había una alerta ("supera el umbral de…", "poliuria nocturna
confirmada", "ICS ≥2 ✓"), ahora hay el dato desnudo.

- **Cambio 1 — Pad test: solo gramos, sin categoría de gravedad.**
  Eliminada `padSeverity()` de `clinical.ts` y todas sus llamadas
  (`DashboardTab.tsx`, `ExpressMode.tsx`, `DayTab.tsx`,
  `generateClinicalNote`). `padDayStats()` se conserva íntegro. Se añade
  la constante `PAD_TEST_DISCLAIMER` ("Valor no clasificado: las bandas
  de gravedad del pad test dependen de la población y del protocolo"),
  mostrada junto al valor en el panel, el PDF y la nota clínica. Sin
  días válidos, se muestra "sin datos". *(Casos 47-54, A15)*

- **Cambio 2 — Nocturia: recuento de episodios, sin marcar ningún
  umbral.** Nuevo campo `sleepOnset` en `DayData` (hora de conciliar el
  sueño, distinta de `sleep` = hora de acostarse), capturado en
  `DayTab.tsx` con la pregunta *"¿A qué hora calcula que se quedó
  dormido?"*. `computeStats` separa dos métricas antes fundidas:
  `nocturiaCount` (micciones tras `sleepOnset` y antes del despertar
  definitivo — el vaciado `firstMorning` no cuenta como episodio) y
  `nocturnalVolume` (volumen producido durante `sleep`→`wake`, que sí
  incluye el `firstMorning` aunque su hora registrada coincida con la
  de despertar). Sin `sleepOnset`, `nocturiaCount` es `null`
  ("no evaluable: falta la hora de conciliación del sueño") y la
  interfaz cae a *"Micciones en la ventana nocturna declarada"* usando
  `avgN`, dejando claro que no es nocturia ICS. Eliminado el marcador
  `(ICS ≥2 ✓)` de `generateClinicalNote` y de los paneles.
  *(Casos 57-63, A23, A24)*

- **Cambio 3 — IPN y poliuria: se muestra el valor, no se aplica
  umbral.** Eliminado `npiThreshold` de `CLINICAL_RULES` y toda
  comparación `npI > 33` en `clinical.ts`, `DashboardTab.tsx` y
  `ExpressMode.tsx`; el informe y el panel muestran solo `"IPN: 40 %"`.
  `npiSource` se conserva pero redefinido como referencia de **cómo**
  se calcula el índice (volumen nocturno / volumen 24h), no como
  umbral. Eliminado el booleano `poly` de `DiaryStats` y todas sus
  comparaciones; se conserva `polyMlPerKg`, mostrado sin etiqueta:
  `"Volumen 24 h: 3000 ml = 42,9 ml/kg"` (o, sin peso, `"(ml/kg no
  calculable, falta el peso)"`). El cálculo sigue sobre la producción
  total (incluido el sondaje), sin cambios. *(Casos 67-68, 72-73, A31)*

- **Cambio 4 — Nombrar la escala PPIUS donde se ve.** Añadida
  `ppiusSource` a `CLINICAL_RULES` con la referencia completa. En
  `MiccionSheet.tsx`, la pregunta de urgencia pasa a *"Grado de
  urgencia (escala PPIUS, 0-4)"*. En `generateClinicalNote`, "Grado
  3-4" pasa a *"Urgencia intensa (PPIUS grados 3-4)"*. *(Caso 69)*

- **Cambio 5 — dos huecos del anexo.**
  - *A06 (idempotencia):* nueva función `isDuplicateEntry()` en
    `clinical.ts`; `useAppData.addEntry` descarta una entrada cuyo
    contenido coincide exactamente con la última registrada en el
    mismo día (doble toque, reenvío del formulario), sin crear una
    segunda anotación.
  - *A08 (coma decimal):* nueva función `parseDecimal()` en
    `clinical.ts` — acepta `"1,5"` igual que `"1.5"` y rechaza
    (`null`) cualquier otro formato en vez de truncar en silencio
    (`parseFloat('72,5')` devolvía `72`, un peso incorrecto sin
    avisar). Aplicada al volumen de la micción (`MiccionSheet.tsx`),
    la cantidad de bebida (`BebidaSheet.tsx`), el pad test
    (`DayTab.tsx`) y el peso del paciente (`computeStats`).

Sube `CLINICAL_RULES.version` a `'2026.09'`.

## Tanda 3 — cierre del AUA OAB Assessment (v2026.10)

Hallazgo de una revisión interna posterior a la segunda tanda (no venía en el
informe de los revisores): el mismo criterio de "reportar valores medidos, no
juicios de umbral" aplicado a pad test, nocturia, IPN y poliuria en la tanda 2
se había quedado sin aplicar en el AUA OAB Assessment.

- **Cambio 1 — quitadas las bandas de gravedad del AUA OAB.** Las
  etiquetas `Leve` (≤10) / `Moderado` (≤18) / `Grave` (>18) no proceden
  del instrumento: el AUA OAB Assessment (Urology Care Foundation) es
  una puntuación sintomática 0-25 sin bandas de gravedad publicadas.
  Estaban escritas a mano en **siete sitios**, no cinco: los cinco
  identificados en el encargo (`OABTab.tsx`; tarjeta de resultado y
  fila del PDF en `DashboardTab.tsx`; tarjeta de resultado y fila del
  PDF en `ExpressMode.tsx`; `generateClinicalNote()`) más **dos
  adicionales** encontrados al revisar el código: los bloques de
  "Hallazgos registrados" de `DashboardTab.tsx` y `ExpressMode.tsx`
  reproducían los mismos cortes 10/18 con las mismas frases ("síntomas
  de vejiga hiperactiva graves/moderados/leves"), sin que el `grep` del
  encargo los detectara por estar en forma de adjetivo en vez de
  sustantivo entre comillas. Se han corregido igual que los otros
  cinco. Ahora todos los sitios muestran solo la puntuación
  (`"AUA OAB Assessment: 18/25"`) más la nueva constante
  `OAB_DISCLAIMER` ("Puntuación sintomática 0-25. El instrumento no
  define bandas de gravedad; la interpretación corresponde al
  profesional sanitario."). Se conserva el único caso con fuente en el
  propio instrumento: la pregunta 1 (urgencia) en 0 se sigue mostrando
  como `"Sin urgencia miccional"` — es el ítem de cribado del AUA OAB,
  no una banda derivada del total. Ese caso especial, antes comprobado
  de forma inconsistente (`q[0] === 0` en unos sitios, `oabVal === 0`
  en otros), se centraliza en la nueva función `oabNoUrgency()`. **No**
  se ha creado ninguna `oabSeverity()`: no hay banda que centralizar.
  *(sin caso del informe — hallazgo de revisión interna)*

- **Cambio 2 — fuente declarada de las bandas que sí se conservan.**
  Nuevo bloque `CLINICAL_RULES.instrumentSources` con la referencia
  publicada de IPSS (Barry MJ et al. 1992), IIEF-5 (Rosen RC et al.
  1999) e ICIQ-SF (ICIQ Group, Bristol), y la constancia explícita de
  que el AUA OAB no publica bandas. Mostradas en el pie de
  `generateClinicalNote()` junto a `CLINICAL_RULES.version`.

- **Cambio 3 — barrido de regresión.** `grep` de `'Leve'|'Moderado'|'Grave'`,
  `IU leve|IU moderada|IU grave|IU muy grave` y `DE leve|DE moderada|DE severa`
  en `src/`: **cero duplicados** fuera de `ipssSeverity()`, `iiefSeverity()`
  e `iciqSeverity()` (y sus tests) — los tres siguen centralizados sin
  regresión desde la tanda 2. Los 7 sitios del AUA OAB (5 + 2 encontrados)
  fueron los únicos duplicados detectados y corregidos en esta tanda.

Sube `CLINICAL_RULES.version` a `'2026.10'`.

## Tanda 4 — dictamen de la ronda 3 (v2026.11)

Respuesta a los bloqueadores 3.1-3.4 del `Informe_Revalidacion_STUIapp_Ronda3.docx`
(28/59 puntos aceptados, 22 parciales, 9 no conformes) más otros cinco puntos
del mismo informe. Segundo criterio, añadido al de "valores medidos, no
juicios de umbral": **ninguna regla interna puede presentarse como si fuera
una definición clínica** — toda regla propia de la app se nombra, se
documenta y es trazable; y si una etiqueta dice "24 h", el cálculo tiene que
serlo de verdad. Varios de estos defectos procedían de reglas mal
especificadas en tandas anteriores (así se indica en cada punto), no de
errores de implementación: se deshace lo que se pidió antes, no se añade
encima.

- **Punto 3.2 (error real de la tanda 2) — volumen nocturno sobre
  `sleepOnset`, no sobre `sleep`.** El volumen nocturno se calculaba sobre
  la hora de acostarse; un vaciado entre acostarse y conciliar el sueño
  vacía orina producida durante el día y marca el INICIO de la producción
  nocturna, no forma parte de ella. `computeStats` unifica ahora
  `nocturiaCount` y `nocturnalVolume` sobre la MISMA frontera
  (`sleepOnset`): un día sin `sleepOnset` no aporta a ninguna de las dos
  métricas, y el IPN (ahora "proporción de volumen nocturno") queda `null`
  si no hay ningún día utilizable. El vaciado `firstMorning` se sigue
  contando como volumen nocturno (esa orina se produjo durmiendo) pero
  nunca como episodio de nocturia.

- **Punto 3.1 — ninguna etiqueta "24 h" para un cálculo que no lo es.**
  Los revisores rechazaron declarar la desviación como limitación sin
  corregir la métrica. No se implementa el periodo de 24 h encadenado
  (sigue fuera de alcance); se renombran todas las salidas: "Volumen 24 h"
  → "Volumen del día registrado", "ml/kg/24 h" → "ml/kg por día
  registrado", "IPN" → "Proporción de volumen nocturno", "Pad test:
  X g/24 h" → "X g por día registrado", "Ingesta: X ml/24h" → "Ingesta del
  día registrado: X ml". Nueva constante `PERIOD_DISCLAIMER`, mostrada
  junto a estas métricas en el panel y en la nota clínica. Corregidos
  `DashboardTab.tsx`, `ExpressMode.tsx`, `PatientTab.tsx`,
  `generateClinicalNote()` y los tipos de `DiaryStats`/`PadTestStats`
  (comentarios). No queda ninguna etiqueta "24h"/"24 h"/"/24" fuera de
  comentarios explicativos y del propio disclaimer (ver barrido de
  regresión).

- **Punto 3.4 (error real de la tanda 2) — día seco ≠ día sin registrar
  en el pad test.** `padDayStats()` excluía cualquier día sin absorbentes
  cargados, confundiendo "no registrado" con "registrado y seco" — y
  elevaba la media artificialmente al promediar solo los días con
  pérdidas. Nuevo campo `DayData.padTestStatus` (`'registrado' |
  'sin-registrar'`), con una casilla en `DayTab.tsx` ("He completado el
  registro de absorbentes de este día"). `padDayStats()` incluye todo día
  `'registrado'` (con 0 g si no hay absorbentes) y excluye todo día
  `'sin-registrar'`; `PadTestStats.dryDays` informa cuántos de los días
  registrados fueron secos.

- **Punto 3.3 — `isNight` sin horarios devuelve `null`, no `false`.** La
  ausencia de wake/sleep no es un dato "diurno": es la ausencia de un
  dato. `isNight()` devuelve `null` cuando el día no tiene horarios
  informados (antes devolvía `false`, lo que clasificaba esas micciones
  como diurnas por defecto). `computeStats` ya excluía correctamente las
  horas inválidas de `excludedTimeEntries`; ahora también excluye por
  este motivo, y el mensaje del informe se generaliza ("no clasificado
  como diurno/nocturno: hora inválida o día sin horario registrado").

- **Punto 3.6 (regla inventada en una tanda anterior, corregida aquí) —
  "día válido" es cobertura y confirmación, no un recuento.** El criterio
  de ≥4 micciones no tenía base normativa y podía descartar días completos
  de pacientes con baja frecuencia miccional. Se sustituye por: horarios
  de sueño informados **y** el paciente marca explícitamente el día como
  terminado. Nuevo campo `DayData.dayComplete`, con una casilla en
  `DayTab.tsx` ("He terminado de registrar este día"). Nueva
  `CLINICAL_RULES.validDayRule`, declarada como regla interna de calidad
  ("no procede de ninguna guía clínica") y mostrada en el pie del informe.

- **Punto 3.5 — IIEF-5: política declarada ante ausencia de actividad
  sexual.** Se mantiene la validación del ítem 1 (1-5, Rosen 1999). Las
  bandas de gravedad se validaron sobre el rango 5-25: un total por debajo
  de 5 (aritméticamente alcanzable, ya que los ítems 2-5 admiten 0) ya no
  se clasifica — `iiefSeverity()` devuelve "por debajo del rango validado
  (5-25): no se aplica clasificación de gravedad" en vez de "DE severa".
  Esto **corrige** el comportamiento fijado en la tanda 3 (que sí
  clasificaba 1-4 como "DE severa"). Nueva `CLINICAL_RULES.iief5Policy`,
  declarada como política preespecificada. Añadida la referencia de
  Otaola-Arca et al. 2022 a `instrumentSources.iief5`. Corregido también
  un duplicado no señalado por el informe: los bloques de "Hallazgos
  registrados" de `DashboardTab.tsx`/`ExpressMode.tsx` reimplementaban las
  bandas del IIEF-5 con un ternario propio en vez de llamar a
  `iiefSeverity()` — ahora usan la función centralizada.

- **Punto 3.7 — idempotencia por `clientKey`, no por contenido.** La
  comparación por contenido de la tanda 2 (`isDuplicateEntry`) solo
  miraba la última entrada del día (no detectaba duplicados por
  inserciones intermedias o reintentos fuera de orden) y además
  **rechazaba dos eventos legítimos idénticos** (dos micciones iguales a
  la misma hora son perfectamente posibles). Se elimina y se sustituye
  por `clientKey` (`crypto.randomUUID()`, con `uid()` como reserva):
  nuevo campo `DiaryEntry.clientKey`, generado al ABRIR el formulario
  (`MiccionSheet.tsx`/`BebidaSheet.tsx`), no al guardar — un doble toque
  reenvía la misma clave y se descarta (`isDuplicateByClientKey()` en
  `useAppData.addEntry`); dos formularios distintos, aunque el contenido
  resultante sea idéntico, tienen claves distintas y ambos se guardan.
  Migración `ensureEntryClientKeys()`: las entradas guardadas antes de
  este cambio reciben una clave al cargar (`storage.ts`), sin perder
  ningún dato existente.

- **Punto 3.9 — fuente del ICIQ-SF partida en dos citas.** La validación
  original (Avery K et al. 2004, PMID 15227649) y las bandas de gravedad
  (Klovning A et al. 2009, PMID 19214996) son publicaciones distintas; la
  clasificación es posterior a la validación. `instrumentSources.iciq`
  actualizado para citarlas por separado.

Sube `CLINICAL_RULES.version` a `'2026.11'`.

### Nota — punto 3.8 (fuera del alcance de esta tanda)

Los revisores señalan que el Excel de la ronda 3 afirma "157/157" sin que
se les enviara el código, las salidas de ejecución ni un commit congelado.
Esto no lo corrige el código: requiere, antes de la próxima revalidación,
un `git commit` con hash comunicado, el repositorio (o el `.zip`) con
`clinical.ts`, `scoring.test.ts`, `fixtures.ts`,
`verificacion-independiente.test.ts` y `package-lock.json`, y la salida
íntegra de `npm test` en un `.txt` — no un recuento.

## Verificación

```
npx tsc --noEmit -p tsconfig.app.json   # sin errores
npm test                                 # 174/174 tests (2 ficheros)
npm run build                            # build de producción correcta
```

Barrido final (ronda 3, punto 4 del encargo):
- `grep -rn "24h\|24 h\|/24\b" src/` fuera de tests → solo comentarios
  explicativos y el propio `PERIOD_DISCLAIMER`, que menciona "24 h"
  precisamente para descartarlo como metodología. Cero etiquetas activas.
- `grep -rn "pads.length > 0" src/` → un único resultado, en `DayTab.tsx`,
  y es la lista de absorbentes del día en curso (UI local), no la
  agregación multi-día que motivó el punto 3.4.
- `grep -n "return false" src/lib/clinical.ts` dentro de `isNight` → cero
  resultados; la única coincidencia del archivo está en
  `isValidScaleValue()`, sin relación.
- `grep -n ">= 4\|>=4" src/lib/clinical.ts` → cero resultados; el criterio
  de día válido ya no depende de ningún recuento de micciones.

Barrido de la tanda 2 (`> 33`, `>= 2`, `padSeverity`, `.poly`, `2800`) y de
la tanda 3 (bandas del AUA OAB) repetidos: siguen sin regresión.

No se ha modificado la lógica de cifrado (`crypto.ts`), almacenamiento
(`storage.ts` solo cambia la forma de los datos por defecto, no el
cifrado) ni la CSP. No se han añadido dependencias nuevas.


### Salida íntegra de `npm test` (174/174, `--reporter=verbose`)

```

 RUN  v4.1.10 /Users/albertozambudio/Documents/APPS/App-STUI-main

 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 46 — ICIQ-UI SF: banda "muy grave" 19-21 > 18 sigue siendo grave 1ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 46 — ICIQ-UI SF: banda "muy grave" 19-21 > 19 es la frontera inferior de muy grave 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 46 — ICIQ-UI SF: banda "muy grave" 19-21 > 21 (máximo) es muy grave, no grave 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 16-17 — predominio IPSS > todos los ítems a 0 no es "Mixto" 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 16-17 — predominio IPSS > compara medias por ítem, no sumas brutas 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 56 — hora inválida no es medianoche > cadena vacía devuelve null 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 56 — hora inválida no es medianoche > 24:00 se rechaza 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 56 — hora inválida no es medianoche > 23:60 se rechaza 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 56 — hora inválida no es medianoche > texto se rechaza 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 56 — hora inválida no es medianoche > hora válida sigue funcionando 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 56 — hora inválida no es medianoche > isNight no clasifica una hora inválida 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 4/21/35/39 — cuestionario incompleto no es interpretable > IPSS con huecos no está completo 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 4/21/35/39 — cuestionario incompleto no es interpretable > IIEF-5 con huecos no está completo 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 4/21/35/39 — cuestionario incompleto no es interpretable > AUA OAB con huecos no está completo 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 4/21/35/39 — cuestionario incompleto no es interpretable > ICIQ-SF con Q1 sin responder no está completo 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 4/21/35/39 — cuestionario incompleto no es interpretable > un 0 sí es respuesta válida (no se confunde con ausencia) 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 78 — pad test por día, no acumulado > 3 días registrados de 10, 20 y 30 g dan media 20 g/día, no suma 60 g 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 78 — pad test por día, no acumulado > un día sin marcar como registrado no cuenta como 0 g (se excluye) 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 78 — pad test por día, no acumulado > Cambio 3 (ronda 3 · punto 3.4): un día registrado sin absorbentes es un día seco (0 g), no se excluye 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 72-73 — volumen/kg depende del peso (Cambio 3: sin etiqueta "poliuria") > 50 kg con 2500 ml/24h → 50 ml/kg 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 72-73 — volumen/kg depende del peso (Cambio 3: sin etiqueta "poliuria") > 100 kg con 3000 ml/24h → 30 ml/kg 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 72-73 — volumen/kg depende del peso (Cambio 3: sin etiqueta "poliuria") > sin peso, el ml/kg no se evalúa (null, no false ni 0) 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Casos 72-73 — volumen/kg depende del peso (Cambio 3: sin etiqueta "poliuria") > la referencia de ml/kg está declarada y versionada, pero ya no se aplica como umbral 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 65 — el sondaje no se descuenta de la producción total > separa volumen espontáneo de producción urinaria total 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 74 / Cambio 5 (ronda 3 · punto 3.6) — "día válido" es cobertura + confirmación, no un recuento > un día con un solo registro SÍ es válido si el paciente lo marcó como completo (no exige ≥4 micciones) 0ms
 ✓ src/lib/__tests__/verificacion-independiente.test.ts > Caso 74 / Cambio 5 (ronda 3 · punto 3.6) — "día válido" es cobertura + confirmación, no un recuento > un día con cuatro micciones pero sin marcar como completo NO cuenta 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > mínimo: todos los ítems a 0 → 0 1ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > máximo: todos los ítems a 5 → 35 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > caso intermedio calculado a mano: 3+0+2+4+1+5+2 = 17 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > trata los nulos como 0 sin romper la suma (capa interna) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > umbrales de gravedad > 7 → Leve (límite superior) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > umbrales de gravedad > 8 → Moderado (límite inferior) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > umbrales de gravedad > 19 → Moderado (límite superior) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > umbrales de gravedad > 20 → Grave (límite inferior) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > umbrales de gravedad > 0 → Leve 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > umbrales de gravedad > 35 → Grave 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > completitud > detecta cuestionario completo 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > completitud > detecta un solo ítem sin responder 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > completitud > un 0 es respuesta válida, no ausencia 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > predominio sintomático (regla interna, no diagnóstica) > llenado puro → predominio de llenado 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > predominio sintomático (regla interna, no diagnóstica) > vaciado puro → predominio de vaciado 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > predominio sintomático (regla interna, no diagnóstica) > medias iguales (todos los ítems iguales) → sin predominio claro 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IPSS > predominio sintomático (regla interna, no diagnóstica) > total 0 → sin predominio (no aplicable), no "Mixto" 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > mínimo → 0 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > máximo → 25 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > caso a mano: 4+3+5+2+1 = 15 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > nulos como 0 (capa interna) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 25 → Sin disfunción eréctil 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 22 → Sin disfunción eréctil 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 21 → DE leve 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 17 → DE leve 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 16 → DE leve-moderada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 12 → DE leve-moderada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 11 → DE moderada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 8 → DE moderada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 7 → DE severa 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > umbrales de gravedad (validados 5-25, Rosen 1999) > 5 → DE severa 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > por debajo del rango validado (Cambio 6) > 0 → no se aplica clasificación de gravedad 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > por debajo del rango validado (Cambio 6) > 1 → no se aplica clasificación de gravedad 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > por debajo del rango validado (Cambio 6) > 4 → no se aplica clasificación de gravedad 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > completitud > detecta cuestionario completo 0ms
 ✓ src/lib/__tests__/scoring.test.ts > IIEF-5 > completitud > detecta un ítem sin responder 0ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment > mínimo → 0 0ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment > máximo → 25 0ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment > caso a mano: 1+2+3+4+5 = 15 0ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment > nulos como 0 (capa interna) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment — sin bandas de gravedad > oabNoUrgency: true solo cuando la pregunta 1 (urgencia) es 0 0ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment — sin bandas de gravedad > un total de 18 se reporta como 18/25 en el informe, sin categoría de gravedad 8ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment — sin bandas de gravedad > el informe incluye el descargo de responsabilidad del instrumento (OAB_DISCLAIMER) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment — sin bandas de gravedad > con la pregunta 1 en 0, el informe muestra "Sin urgencia miccional", no una banda 0ms
 ✓ src/lib/__tests__/scoring.test.ts > AUA OAB Assessment — sin bandas de gravedad > ninguna variante de "Leve"/"Moderado"/"Grave" aparece asociada al AUA OAB 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES.instrumentSources > declara la fuente del IPSS (Barry MJ et al. 1992) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES.instrumentSources > declara la fuente del IIEF-5 (Rosen RC et al. 1999) y el uso correcto del instrumento (Cambio 6) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES.instrumentSources > declara explícitamente que el AUA OAB no publica bandas de gravedad 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES.instrumentSources.iciq (Cambio 8) > cita la validación original (Avery K et al. 2004) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES.instrumentSources.iciq (Cambio 8) > cita la clasificación de gravedad como publicación posterior y distinta (Klovning A et al. 2009) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > mínimo → 0 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > máximo → 21 (5 + 6 + 10) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > caso a mano: 3 + 4 + 7 = 14 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > nulos como 0 (capa interna) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 0 → Sin incontinencia urinaria 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 1 → IU leve 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 5 → IU leve 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 6 → IU moderada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 12 → IU moderada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 13 → IU grave 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 18 → IU grave 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 19 → IU muy grave 0ms
 ✓ src/lib/__tests__/scoring.test.ts > ICIQ-SF > umbrales de gravedad > 21 → IU muy grave 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > null se admite como "sin responder" (válido pero incompleto) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > 0 es una respuesta válida, no se confunde con ausencia 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > undefined se rechaza (no es "sin responder", es un dato corrupto) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > cadena vacía se rechaza 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > texto se rechaza 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > NaN se rechaza 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > Infinity se rechaza 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > valor negativo se rechaza, no se trunca a 0 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > valor superior al máximo del ítem se rechaza, no se trunca al máximo 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > IIEF-5 ítem 1 = 0 → inválido (el ítem 1 se puntúa 1-5, sin opción "0") 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > IIEF-5 ítems 2-5 sí admiten 0 ("no intentó el coito") 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > OAB: ítem fuera de rango (0-5) se rechaza 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > ICIQ Q1 (0-5) fuera de rango se rechaza 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > ICIQ Q2 solo admite 0, 2, 4 o 6: cualquier otro valor se rechaza 0ms
 ✓ src/lib/__tests__/scoring.test.ts > entradas inválidas > PPIUS / urgencia del diario: valor 5 se rechaza (la escala es 0-4) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > fronteras que faltan > IIEF-5 totales 1-4 (mínimo real, ítem 1 no puede ser 0) → sin clasificación, no "DE severa" 0ms
 ✓ src/lib/__tests__/scoring.test.ts > fronteras que faltan > IIEF-5 total 5 (frontera inferior del rango validado) → DE severa 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > toMin convierte hh:mm a minutos 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > hora vacía → null, no 00:00 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > 24:00, 23:60 y una fecha inválida se rechazan explícitamente 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > isNight con periodo nocturno que cruza medianoche > 23:30 es noche 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > isNight con periodo nocturno que cruza medianoche > 03:00 es noche 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > isNight con periodo nocturno que cruza medianoche > 06:59 es noche 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > isNight con periodo nocturno que cruza medianoche > 07:00 ya es día 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > isNight con periodo nocturno que cruza medianoche > 12:00 es día 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > isNight con periodo nocturno que cruza medianoche > 22:59 es día 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > sin horarios definidos → no clasificable (null), no "día" por defecto 0ms
 ✓ src/lib/__tests__/scoring.test.ts > utilidades de tiempo > hora vacía/inválida → no clasificable (null), no "día" por defecto 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > capacidad vesical funcional EXCLUYE la primera micción matutina 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > excluye del volumen espontáneo las micciones por sondaje, pero no de la producción total 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > separa micciones diurnas y nocturnas cruzando medianoche 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > calcula el índice de poliuria nocturna (IPN) como porcentaje — Cambio 3: sin umbral aplicado 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > IPN se calcula igual sea cual sea su magnitud: no hay corte que active ni desactive nada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > IPN usa la producción TOTAL (incluido el sondaje), no solo la espontánea 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > sin sleepOnset, el IPN no es calculable (null): no hay frontera para saber qué es nocturno 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > cuenta episodios de urgencia y los de grado severo por separado 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > distingue incontinencia de urgencia y de esfuerzo 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > suma la ingesta de líquidos 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > no lanza excepción con el diario completamente vacío — sin datos, no 0 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > calcula el intervalo medio entre micciones 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > intervalo que cruza medianoche (23:30 → 00:30) = 60 min, no 1380 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > una sola micción en el día → intervalo medio "sin dato" (null), no división por cero 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > micciones desordenadas se ordenan antes de calcular intervalos: nunca un intervalo negativo 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > una micción sin hora se excluye del cálculo y se informa cuántas se excluyeron 0ms
 ✓ src/lib/__tests__/scoring.test.ts > diario miccional > cuenta absorbentes y micciones con vaciado incompleto 0ms
 ✓ src/lib/__tests__/scoring.test.ts > días válidos para el promedio (regla interna, sin recuento de micciones) > un día con una sola micción SÍ es válido si el paciente lo marcó como completo 0ms
 ✓ src/lib/__tests__/scoring.test.ts > días válidos para el promedio (regla interna, sin recuento de micciones) > un día con cuatro micciones pero SIN marcar como completo no cuenta (ya no hay recuento mínimo) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > días válidos para el promedio (regla interna, sin recuento de micciones) > sin horario de sueño informado, un día marcado como completo tampoco cuenta (cobertura + confirmación) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > días válidos para el promedio (regla interna, sin recuento de micciones) > un día vacío entre dos días válidos se excluye del denominador (n=2, no 3) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > días válidos para el promedio (regla interna, sin recuento de micciones) > CLINICAL_RULES.validDayRule declara el criterio como regla interna, no clínica 0ms
 ✓ src/lib/__tests__/scoring.test.ts > volumen 24h en ml/kg (sin etiqueta de umbral) > 50 kg / 2500 ml → 50 ml/kg por día registrado 0ms
 ✓ src/lib/__tests__/scoring.test.ts > volumen 24h en ml/kg (sin etiqueta de umbral) > 100 kg / 3000 ml → 30 ml/kg por día registrado 0ms
 ✓ src/lib/__tests__/scoring.test.ts > volumen 24h en ml/kg (sin etiqueta de umbral) > sin peso registrado → ml/kg no calculable (null), no un valor por defecto 0ms
 ✓ src/lib/__tests__/scoring.test.ts > volumen 24h en ml/kg (sin etiqueta de umbral) > un valor de exactamente 40 ml/kg se calcula igual que cualquier otro: no hay salto de categoría 0ms
 ✓ src/lib/__tests__/scoring.test.ts > volumen 24h en ml/kg (sin etiqueta de umbral) > el peso con coma decimal ("72,5") se interpreta correctamente (A08, tanda 2) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES (Cambio 3, tanda 3) > no declara npiThreshold: la app no aplica ningún corte de IPN 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES (Cambio 3, tanda 3) > polyuriaMlPerKg se conserva como unidad de referencia mostrada (no como alerta) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES (Cambio 3, tanda 3) > declara la fuente de PPIUS (Cambio 4, tanda 3) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES (Cambio 3, tanda 3) > versión de reglas actualizada a 2026.11 (ronda 3) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES (ronda 3) > validDayRule (Cambio 5) declara el criterio de día válido como regla interna, sin recuento de micciones 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES (ronda 3) > iief5Policy (Cambio 6) declara la política preespecificada sobre el ítem 1 y el rango validado 0ms
 ✓ src/lib/__tests__/scoring.test.ts > CLINICAL_RULES (ronda 3) > ninguna salida usa la etiqueta "24 h" — se declara PERIOD_DISCLAIMER (Cambio 2) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > pad test por día (A2 + Cambio 3) > 3 días registrados de 10, 20 y 30 g → media 20 g por día, NO la suma de 60 g 0ms
 ✓ src/lib/__tests__/scoring.test.ts > pad test por día (A2 + Cambio 3) > un día sin marcar como registrado se excluye, aunque tenga absorbentes cargados 0ms
 ✓ src/lib/__tests__/scoring.test.ts > pad test por día (A2 + Cambio 3) > Cambio 3: un día registrado SIN absorbentes es un día seco (0 g) — cuenta en la media, no se excluye 0ms
 ✓ src/lib/__tests__/scoring.test.ts > pad test por día (A2 + Cambio 3) > ningún día registrado → sin datos (null), no 0 0ms
 ✓ src/lib/__tests__/scoring.test.ts > nocturia y volumen nocturno (Cambio 1, ronda 3 · punto 3.2) > caso del dictamen: acostarse 23:00, dormirse 23:30, vaciados 23:15/02:00/07:00(1ª) → volumen nocturno 450 ml, no 650; nocturia 1 0ms
 ✓ src/lib/__tests__/scoring.test.ts > nocturia y volumen nocturno (Cambio 1, ronda 3 · punto 3.2) > un vaciado antes de conciliar el sueño NO cuenta como nocturia ni como volumen nocturno 0ms
 ✓ src/lib/__tests__/scoring.test.ts > nocturia y volumen nocturno (Cambio 1, ronda 3 · punto 3.2) > sin sleepOnset, nocturiaCount es null pero la ventana declarada (avgN) sigue disponible 0ms
 ✓ src/lib/__tests__/scoring.test.ts > nocturia y volumen nocturno (Cambio 1, ronda 3 · punto 3.2) > el vaciado firstMorning cuenta como volumen nocturno aunque su hora coincida con la de despertar (con sleepOnset informado) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > nocturia y volumen nocturno (Cambio 1, ronda 3 · punto 3.2) > el vaciado firstMorning NO cuenta como episodio de nocturia aunque su hora caiga en la ventana 0ms
 ✓ src/lib/__tests__/scoring.test.ts > nocturia y volumen nocturno (Cambio 1, ronda 3 · punto 3.2) > sin marcador ICS ≥2: la app no compara nocturiaCount ni avgN contra ningún umbral 0ms
 ✓ src/lib/__tests__/scoring.test.ts > Cambio 7 — idempotencia por clientKey > una clientKey que ya existe en el día se considera duplicada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > Cambio 7 — idempotencia por clientKey > una clientKey distinta nunca es duplicada, aunque el resto del contenido coincida 0ms
 ✓ src/lib/__tests__/scoring.test.ts > Cambio 7 — idempotencia por clientKey > sin entradas previas en el día, ninguna clientKey es duplicada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > Cambio 7 — idempotencia por clientKey > detecta una clientKey duplicada en cualquier posición del historial, no solo en la última entrada 0ms
 ✓ src/lib/__tests__/scoring.test.ts > Cambio 7 — idempotencia por clientKey > dos micciones legítimas con contenido idéntico pero clientKey distinta se consideran eventos distintos (no duplicadas) 0ms
 ✓ src/lib/__tests__/scoring.test.ts > A08 — coma decimal española (parseDecimal) > acepta coma como separador decimal 0ms
 ✓ src/lib/__tests__/scoring.test.ts > A08 — coma decimal española (parseDecimal) > acepta punto como separador decimal 0ms
 ✓ src/lib/__tests__/scoring.test.ts > A08 — coma decimal española (parseDecimal) > acepta enteros sin separador 0ms
 ✓ src/lib/__tests__/scoring.test.ts > A08 — coma decimal española (parseDecimal) > recorta espacios en los extremos 0ms
 ✓ src/lib/__tests__/scoring.test.ts > A08 — coma decimal española (parseDecimal) > cadena vacía devuelve null, no NaN 0ms
 ✓ src/lib/__tests__/scoring.test.ts > A08 — coma decimal española (parseDecimal) > texto no numérico se rechaza (null), no NaN silencioso 0ms
 ✓ src/lib/__tests__/scoring.test.ts > A08 — coma decimal española (parseDecimal) > varios separadores se rechazan en vez de interpretarse a medias 0ms
 ✓ src/lib/__tests__/scoring.test.ts > A08 — coma decimal española (parseDecimal) > no trunca en silencio: "72,5" nunca se interpreta como 72 0ms

 Test Files  2 passed (2)
      Tests  174 passed (174)
   Start at  20:13:56
   Duration  183ms (transform 148ms, setup 0ms, import 168ms, tests 18ms, environment 0ms)

```
