# STUI App

Aplicación web para la recogida estructurada de síntomas del tracto urinario
inferior (STUI). Sin instalación, sin cuenta de usuario y sin servidor: todos los
datos clínicos se cifran y permanecen en el dispositivo del paciente.

**En producción:** https://stuiapp.urosuite.es

---

## Finalidad prevista

STUIapp es una herramienta de recogida estructurada de información comunicada
por el paciente sobre sus síntomas del tracto urinario inferior.

La aplicación presenta, en formato digital, los mismos instrumentos que se
emplean habitualmente en papel en la consulta urológica: un diario miccional de
tres días y los cuestionarios IPSS, ICIQ-SF, AUA OAB Assessment, IIEF-5 y pad
test. Un módulo inicial de cribado, mediante preguntas dicotómicas en lenguaje
llano, determina qué instrumentos son pertinentes para cada persona.

La aplicación reproduce las reglas de puntuación publicadas de cada instrumento
y genera un resumen estructurado destinado a ser interpretado por un profesional
sanitario.

STUIapp **no realiza mediciones fisiológicas**: todos los datos son introducidos
manualmente por el paciente. **No emite diagnósticos, no propone ni recomienda
tratamientos, y no sustituye la valoración clínica.** No incorpora ninguna
función clínica adicional respecto a la administración en papel de los mismos
instrumentos.

La interpretación de los resultados corresponde en todos los casos a un
profesional sanitario cualificado.

> **Estado regulatorio.** No se ha obtenido dictamen de un organismo notificado.
> Dicho dictamen es requisito previo a cualquier despliegue asistencial. El
> análisis de posicionamiento bajo el Reglamento (UE) 2017/745 y la guía
> MDCG 2019-11 forma parte de la documentación del estudio.

---

## Instrumentos integrados

| Módulo | Instrumento | Rango |
|---|---|---|
| Diario miccional | BladderDiary3 (3 días) | — |
| Síntomas prostáticos | IPSS | 0-35 |
| Incontinencia | ICIQ-SF | 0-21 |
| Vejiga hiperactiva | AUA OAB Assessment (Urology Care Foundation ©2024) | 0-25 |
| Función eréctil | IIEF-5 | 0-25 |
| Cuantificación de pérdidas | Pad test | gramos |

El módulo de vejiga hiperactiva corresponde al **AUA OAB Assessment**, de acceso
público, y **no** al OAB-q de Coyne et al., que es un instrumento propietario.

Del diario se derivan el índice de poliuria nocturna, la capacidad vesical
funcional (excluyendo la primera micción matutina, conforme a la práctica ICS),
la frecuencia diurna y nocturna, los episodios de urgencia e incontinencia y la
ingesta de líquidos.

**El estado de licenciamiento de cada instrumento debe confirmarse antes de
cualquier uso asistencial o de su publicación.** El ICIQ-SF requiere registro
con el ICIQ Group (Universidad de Bristol).

---

## Arquitectura

React 18 · TypeScript · Vite · Tailwind CSS

### Privacidad por diseño

- **Sin transmisión de datos.** No hay llamadas de red en toda la aplicación:
  ni `fetch`, ni `XMLHttpRequest`, ni websockets, ni analítica, ni fuentes o
  recursos externos
- Reforzado por una Content-Security-Policy con `connect-src 'none'`, definida
  en `vercel.json`. La restricción la impone el navegador, no solo el código
- **Almacenamiento local cifrado** mediante IndexedDB y la Web Cryptography API

### Parámetros criptográficos

| | |
|---|---|
| Cifrado | AES-256-GCM |
| Derivación de clave | PBKDF2-SHA-256, 200.000 iteraciones |
| Sal | 16 bytes aleatorios por sesión |
| IV | 12 bytes, único por operación |
| Verificación de PIN | centinela cifrado (la clave no se almacena) |

Dos modos de seguridad:

- **PIN** — la clave se deriva del PIN del paciente y **no se almacena** en
  ningún momento (`extractable: false`). Sin el PIN los datos son irrecuperables
- **Automático** — clave generada y almacenada en IndexedDB, sin fricción para
  el usuario

> **Limitación conocida.** En modo automático la clave se almacena junto a los
> datos cifrados. El cifrado en reposo protege frente a la inspección casual y
> frente al acceso desde otros orígenes, pero **no frente al acceso físico al
> dispositivo**. Solo el modo PIN ofrece esa protección. Es un compromiso
> deliberado entre usabilidad y seguridad, y se declara explícitamente.

### Persistencia del almacenamiento

Los navegadores móviles pueden desalojar IndexedDB. Medición propia
(agosto 2026), mismo dispositivo y mismo origen:

| Plataforma | Modo | `navigator.storage.persist()` |
|---|---|---|
| Safari / iOS | Pestaña | Denegado |
| Safari / iOS | Pantalla de inicio | Concedido |
| Safari / macOS | Pestaña | Denegado |
| Safari / macOS | Añadida al Dock | Concedido |

Dado que el diario miccional se cumplimenta durante tres días y la consulta
suele producirse semanas después, la aplicación solicita al usuario que la
instale antes de comenzar (`src/components/ui/InstallPrompt.tsx`).

La herramienta de medición está disponible en
[`/persistence-probe.html`](https://stuiapp.urosuite.es/persistence-probe.html).

---

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # compilación de producción
npm test           # batería de verificación
npm run typecheck  # comprobación de tipos
npm run lint
```

Despliegue en Vercel: `npx vercel --prod` (no es automático desde GitHub).

### Verificación de los algoritmos de puntuación

```bash
npm test
```

**78 casos sintéticos, 78 pasan.** Cubren, para cada instrumento, los valores
mínimo y máximo, todos los umbrales de gravedad por ambos lados, y el manejo de
valores nulos y campos vacíos. Para el diario miccional se verifican además la
exclusión de la primera micción matutina y del sondaje, la clasificación
diurna/nocturna cruzando medianoche, el índice de poliuria nocturna y su umbral,
la clasificación de urgencia por grados y el comportamiento con el diario vacío.

Los casos son sintéticos y sus valores esperados se calcularon manualmente a
partir de las instrucciones de puntuación publicadas de cada instrumento.
Ningún dato procede de pacientes reales.

Ver `src/lib/__tests__/scoring.test.ts`.

---

## Estructura

```
src/
  lib/
    clinical.ts      Instrumentos, algoritmos de puntuación, informe
    crypto.ts        AES-256-GCM y PBKDF2 sobre Web Crypto API
    keyManager.ts    Ciclo de vida de la clave (modos PIN y automático)
    idb.ts           Capa base de IndexedDB
    storage.ts       Persistencia de datos clínicos
    __tests__/       Batería de verificación
  components/
    screens/         Bienvenida, modo exprés, recomendaciones
    tabs/            Módulos clínicos y panel de resultados
    ui/              Disclaimer, PIN, aviso de instalación
public/
  persistence-probe.html   Sonda de persistencia de IndexedDB
research-tools/            Instrumentos de investigación (cuestionarios, análisis)
```

---

## Investigación

La aplicación es objeto de dos trabajos en preparación: un informe de desarrollo
y validación técnica, y un estudio piloto prospectivo de factibilidad clínica
pendiente de aprobación por el Comité de Ética de la Investigación.

Las afirmaciones sobre ahorro de tiempo de consulta, mejora de la completitud del
dato o experiencia del paciente son **hipótesis del estudio piloto, no
propiedades demostradas** de la herramienta.

`research-tools/` contiene los instrumentos de evaluación empleados.

---

## Aviso

Software en evaluación. No ha sido validado clínicamente ni cuenta con marcado
CE. No debe emplearse como única base para decisiones asistenciales.
