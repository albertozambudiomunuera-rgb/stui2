/**
 * DiaryIntro.tsx — Pantalla introductoria al Diario Miccional.
 *
 * Se muestra UNA sola vez, justo antes de entrar por primera vez al Día 1
 * (App.tsx controla el disparo y persiste la marca de "visto" en storage.ts).
 * El contenido de "¿Cómo se rellena?" se repite tal cual en DayTab.tsx como
 * panel desplegable, siempre accesible durante los 3 días — esta pantalla
 * es solo la primera toma de contacto.
 */

import { DIARY_HOWTO_STEPS, DIARY_HOWTO_NOTE } from '../../lib/clinical';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface DiaryIntroProps {
  onContinue: () => void;
}

export function DiaryIntro({ onContinue }: DiaryIntroProps) {
  useBodyScrollLock(true);
  return (
    // Scroll en el contenedor exterior (inset-0, no vh) en vez de max-h en
    // vh en la tarjeta — ver el porqué en InstallPrompt.tsx.
    <div className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-black/60">
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl">
        <div className="p-6">

          <div className="flex items-start gap-3 mb-4">
            <span className="text-4xl leading-none" aria-hidden="true">🗓️</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-snug">
                Vas a empezar el Diario Miccional
              </h2>
              <p className="text-base text-slate-600 mt-1">
                3 días de registro, antes de tu consulta
              </p>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-5">
            <p className="text-base text-teal-900 leading-relaxed">
              <strong>¿Para qué sirve?</strong> Durante los próximos 3 días, cada vez que
              orines y cada vez que bebas algo, lo anotas aquí. Con esa información tu
              médico puede ver con qué frecuencia orinas, cuánto volumen y si te
              levantas por la noche — datos que los cuestionarios por sí solos no dan.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-base text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-800">¿Cómo se rellena?</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {DIARY_HOWTO_STEPS.map((step, i) => <li key={i}>{step}</li>)}
            </ul>
            <p>{DIARY_HOWTO_NOTE}</p>
          </div>

          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Esta pantalla no se repetirá. Si en algún momento quieres volver a leer esto,
            toca "¿Cómo se rellena?" dentro de cualquiera de los 3 días.
          </p>

          <button
            onClick={onContinue}
            className="w-full py-4 rounded-xl bg-teal-600 text-white font-semibold
                       text-lg active:bg-teal-700"
          >
            Empezar Día 1 →
          </button>

        </div>
      </div>
      </div>
    </div>
  );
}
