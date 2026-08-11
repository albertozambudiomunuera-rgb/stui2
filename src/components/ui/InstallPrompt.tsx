/**
 * InstallPrompt.tsx — Aviso de instalación, solo en Modo Casa.
 *
 * MOTIVO CLÍNICO
 * Los navegadores móviles pueden desalojar IndexedDB cuando el sitio se usa
 * como pestaña normal. En Safari/iOS, la protección antiseguimiento limita el
 * almacenamiento escribible por scripts si no hay interacción durante varios
 * días, y navigator.storage.persist() es DENEGADO en modo pestaña.
 *
 * Medición propia (agosto 2026), mismo dispositivo y mismo origen:
 *   · Safari iOS, pestaña               → persist() DENEGADO
 *   · Safari iOS, pantalla de inicio    → persist() CONCEDIDO
 *   · Safari macOS, pestaña             → persist() DENEGADO
 *   · Safari macOS, añadida al Dock     → persist() CONCEDIDO
 *
 * Se muestra SOLO en Modo Casa ("Voy a preparar mi consulta"), una vez,
 * justo al terminar de rellenar Perfil (antes de Cribado) — no nada más
 * elegir el modo, para no ser el primer muro que ve el paciente (ver
 * App.tsx). El diario dura 3 días y la consulta suele ser semanas después:
 * rellenar datos en una pestaña expone al paciente a perderlos antes de la
 * visita. El Modo Sala de Espera se rellena de un tirón, con la pestaña
 * abierta, así que este aviso no aplica ahí y no se muestra: solo añadiría
 * ruido justo antes de entrar a consulta.
 */

import { useEffect, useState } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface InstallPromptProps {
  onContinue: () => void;
}

type Platform = 'ios' | 'android' | 'desktop';
// Internet Samsung viene preinstalado y es el navegador por defecto en la
// mayoría de móviles Samsung (muy extendidos entre pacientes mayores en
// España), y su menú de instalación no se parece al de Chrome.
type AndroidBrowser = 'samsung' | 'chrome';

/** True si la app se está ejecutando instalada (no como pestaña del navegador). */
export function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari iOS expone esta propiedad no estándar
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function detectAndroidBrowser(): AndroidBrowser {
  return /SamsungBrowser/i.test(navigator.userAgent) ? 'samsung' : 'chrome';
}

type Choice = 'ios' | 'android';

export function InstallPrompt({ onContinue }: InstallPromptProps) {
  useBodyScrollLock(true);
  const [androidBrowser, setAndroidBrowser] = useState<AndroidBrowser>('chrome');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  // Nada preseleccionado por defecto: el paciente pulsa su propio sistema.
  // Si se detecta iOS/Android se preselecciona para ahorrar un toque, pero
  // sigue siendo pulsable/cambiable (útil si un familiar mira el móvil
  // desde su propio ordenador, por ejemplo).
  const [chosen, setChosen] = useState<Choice | null>(null);

  useEffect(() => {
    const p = detectPlatform();
    setChosen(p === 'ios' || p === 'android' ? p : null);
    setAndroidBrowser(detectAndroidBrowser());
    // Solo se COMPRUEBA si ya hay almacenamiento persistente (persisted(),
    // de solo lectura, no dispara ningún permiso). NO se llama a
    // navigator.storage.persist(): en algunos navegadores/WebViews Android
    // esa llamada puede abrir un diálogo de permiso nativo que se renderiza
    // mal o se queda colgado, dejando la pantalla sin responder a ningún
    // toque (bug real reportado: "no puedo darle a ok ni atrás ni salir").
    // Pedir instalar la PWA ya basta — el navegador concede persist()
    // automáticamente al instalarla, sin que la app tenga que solicitarlo.
    (async () => {
      try {
        if (navigator.storage?.persisted) {
          setPersisted(await navigator.storage.persisted());
        }
      } catch {
        setPersisted(null);
      }
    })();
  }, []);

  // Si el almacenamiento ya es persistente, no hay nada que advertir.
  if (persisted === true) {
    onContinue();
    return null;
  }

  const androidInstrucciones: Record<AndroidBrowser, { titulo: string; pasos: string[] }> = {
    chrome: {
      titulo: 'Instala STUI en tu móvil (Chrome)',
      pasos: [
        'Toca los tres puntos ⋮ arriba a la derecha de la pantalla',
        'Toca "Instalar aplicación" (si no aparece, toca "Añadir a pantalla de inicio")',
        'Toca "Instalar" para confirmar',
        'Cierra el navegador y abre STUI desde el icono nuevo',
      ],
    },
    samsung: {
      titulo: 'Instala STUI en tu móvil (Internet Samsung)',
      pasos: [
        'Toca el icono ≡ abajo a la derecha de la pantalla',
        'Toca "Añadir página a" y luego "Pantalla de inicio"',
        'Toca "Añadir" para confirmar',
        'Cierra el navegador y abre STUI desde el icono nuevo',
      ],
    },
  };

  const iosInstrucciones = {
    titulo: 'Añade STUI a tu pantalla de inicio',
    pasos: [
      'Pulsa el botón Compartir, abajo en el centro (el cuadrado con la flecha hacia arriba)',
      'Baja y elige "Añadir a pantalla de inicio"',
      'Pulsa "Añadir" arriba a la derecha',
      'Cierra Safari y abre STUI desde el icono nuevo',
    ],
  };

  const seleccion = chosen === 'android' ? androidInstrucciones[androidBrowser] : chosen === 'ios' ? iosInstrucciones : null;

  return (
    // El contenedor con scroll es este de fuera (inset-0, anclado al
    // viewport real, no a unidades vh) en vez de darle un max-h en vh a la
    // tarjeta interior: en iOS, con el body fijado (useBodyScrollLock), un
    // max-h en vh dentro de ese contexto puede calcularse mal y dejar la
    // tarjeta "incompleta" con la parte de abajo inalcanzable. Así, si el
    // contenido no cabe, es esta capa la que hace scroll con normalidad.
    <div className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-black/60">
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl">
        <div className="p-6">

          <div className="flex items-start gap-3 mb-4">
            <span className="text-4xl leading-none" aria-hidden="true">⚠️</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-snug">
                Antes de empezar
              </h2>
              <p className="text-base text-slate-600 mt-1">
                Un paso importante para no perder tus datos
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-base text-amber-900 leading-relaxed">
              Tus datos se guardan solo en este dispositivo. Si usas STUI como una
              pestaña normal del navegador, el móvil <strong>puede borrarlos</strong>{' '}
              con el tiempo, sobre todo si tardas días o semanas en volver a la app
              (por ejemplo, si estás rellenando el diario miccional de 3 días antes
              de tu consulta).
            </p>
            <p className="text-base text-amber-900 leading-relaxed mt-2 font-semibold">
              Si la instalas, tus datos quedan protegidos.
            </p>
          </div>

          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">¿Cómo instalarlo?</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setChosen('ios')}
              className={`py-3.5 rounded-xl text-base font-bold border-2 transition-all ${
                chosen === 'ios'
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              📱 iPhone
            </button>
            <button
              onClick={() => setChosen('android')}
              className={`py-3.5 rounded-xl text-base font-bold border-2 transition-all ${
                chosen === 'android'
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              🤖 Android
            </button>
          </div>

          {seleccion && (
            <>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{seleccion.titulo}</h3>
              <ol className="space-y-3 mb-6">
                {seleccion.pasos.map((paso, i) => (
                  <li key={i} className="flex gap-3 text-base text-slate-800 leading-relaxed">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white
                                     text-base font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{paso}</span>
                  </li>
                ))}
              </ol>

              {chosen === 'android' && (
                <p className="text-sm text-slate-500 leading-relaxed -mt-4 mb-6">
                  ¿Tu pantalla se ve distinta? Busca "Añadir a pantalla de inicio" o
                  "Instalar aplicación" en el menú de tu navegador.
                </p>
              )}
            </>
          )}

          <button
            onClick={onContinue}
            className="w-full py-4 rounded-xl bg-teal-600 text-white font-semibold
                       text-lg active:bg-teal-700"
          >
            Ya la he instalado, continuar
          </button>

          <button
            onClick={onContinue}
            className="w-full py-3 mt-2 text-slate-600 text-base underline"
          >
            Continuar de todas formas
          </button>

          <p className="text-sm text-slate-600 text-center mt-4 leading-relaxed">
            Si continúas sin instalar, exporta el informe en PDF en cuanto
            termines cada día para no perder la información.
          </p>

        </div>
      </div>
      </div>
    </div>
  );
}
