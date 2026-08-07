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
 * Se muestra SOLO al elegir "Voy a preparar mi consulta" (App.tsx), porque
 * el diario dura 3 días y la consulta suele ser semanas después: rellenarlo
 * en una pestaña expone al paciente a perder todos los datos antes de la
 * visita. El Modo Sala de Espera se rellena de un tirón, con la pestaña
 * abierta, así que este aviso no aplica ahí y no se muestra: solo añadiría
 * ruido justo antes de entrar a consulta.
 */

import { useEffect, useState } from 'react';

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

export function InstallPrompt({ onContinue }: InstallPromptProps) {
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [androidBrowser, setAndroidBrowser] = useState<AndroidBrowser>('chrome');
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setAndroidBrowser(detectAndroidBrowser());
    // Pedimos almacenamiento persistente: si el navegador lo concede
    // (habitualmente solo cuando está instalada), el riesgo desaparece.
    (async () => {
      try {
        if (navigator.storage?.persisted) {
          const already = await navigator.storage.persisted();
          if (already) { setPersisted(true); return; }
        }
        if (navigator.storage?.persist) {
          setPersisted(await navigator.storage.persist());
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

  const instrucciones: Record<'ios' | 'desktop', { titulo: string; pasos: string[] }> = {
    ios: {
      titulo: 'Añade STUI a tu pantalla de inicio',
      pasos: [
        'Pulsa el botón Compartir, abajo en el centro (el cuadrado con la flecha hacia arriba)',
        'Baja y elige "Añadir a pantalla de inicio"',
        'Pulsa "Añadir" arriba a la derecha',
        'Cierra Safari y abre STUI desde el icono nuevo',
      ],
    },
    desktop: {
      titulo: 'Instala STUI en tu ordenador',
      pasos: [
        'En Safari: menú Archivo → "Añadir al Dock"',
        'En Chrome o Edge: icono de instalar en la barra de direcciones',
        'Abre STUI desde el icono nuevo',
      ],
    },
  };

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

  const { titulo, pasos } =
    platform === 'android' ? androidInstrucciones[androidBrowser] : instrucciones[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
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

          <h3 className="text-lg font-bold text-slate-900 mb-3">{titulo}</h3>
          <ol className="space-y-3 mb-2">
            {pasos.map((paso, i) => (
              <li key={i} className="flex gap-3 text-base text-slate-800 leading-relaxed">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white
                                 text-base font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{paso}</span>
              </li>
            ))}
          </ol>

          {platform === 'android' && (
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              ¿Tu pantalla se ve distinta? Busca "Añadir a pantalla de inicio" o
              "Instalar aplicación" en el menú de tu navegador.
            </p>
          )}
          {platform !== 'android' && <div className="mb-6" />}

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
  );
}
