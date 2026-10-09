// ESTUDIO-VALIDACION — ventana de la encuesta de usabilidad (SUS + uMARS).
// Paso 1: SUS. Pasos siguientes: una sección de uMARS por pantalla (si el
// texto de uMARS está cargado en instruments.ts). Cada respuesta se guarda
// al momento: "Ahora no" no pierde nada y se puede retomar desde el informe.
import { useState } from 'react';
import { X } from 'lucide-react';
import type { StudySurvey, UmarsAnswer } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { SUS_INSTRUCTION, SUS_ANCHORS, SUS_ITEMS, UMARS_INSTRUCTION, UMARS_SECTIONS } from './instruments';
import { normalizeStudy, answeredCount, totalItems, isStudyComplete } from './scoring';

interface SurveyModalProps {
  study: StudySurvey | undefined;
  onChange: (fn: (prev: StudySurvey | undefined) => StudySurvey) => void;
  onClose: () => void;
}

const sections = UMARS_SECTIONS.filter((s) => s.items.length > 0);

export function SurveyModal({ study, onChange, onClose }: SurveyModalProps) {
  useBodyScrollLock(true);
  const s = normalizeStudy(study);
  const steps = 1 + sections.length;
  // Retoma en el primer paso con preguntas sin responder.
  const [step, setStep] = useState(() => {
    if (s.sus.some((v) => v === null)) return 0;
    let off = 0;
    for (let i = 0; i < sections.length; i++) {
      const n = sections[i].items.length;
      if (s.umars.slice(off, off + n).some((v) => v === null)) return i + 1;
      off += n;
    }
    return 0;
  });

  const setSus = (i: number, v: number) => onChange((prev) => {
    const cur = normalizeStudy(prev);
    const sus = [...cur.sus];
    sus[i] = v;
    return { ...cur, sus, prompted: true };
  });
  const setUmars = (i: number, v: UmarsAnswer) => onChange((prev) => {
    const cur = normalizeStudy(prev);
    const umars = [...cur.umars];
    umars[i] = v;
    return { ...cur, umars, prompted: true };
  });
  const finish = () => {
    onChange((prev) => {
      const cur = normalizeStudy(prev);
      return { ...cur, prompted: true, completedAt: isStudyComplete(cur) ? new Date().toISOString() : null };
    });
    onClose();
  };

  const progress = Math.round((answeredCount(s) / totalItems()) * 100);
  const last = step === steps - 1;
  const top = () => document.getElementById('study-survey-scroll')?.scrollTo(0, 0);

  // Índice global de un ítem en s.umars (las secciones vacías no ocupan posiciones).
  const sectionOffset = (k: number) => sections.slice(0, k).reduce((n, sec) => n + sec.items.length, 0);

  return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-slate-950 flex flex-col">
      <div className="bg-indigo-700 text-white px-4 safe-top pb-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">Estudio de validación</div>
            <div className="text-base font-black">Encuesta sobre la app · paso {step + 1} de {steps}</div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-lg" title="Ahora no — se guarda lo respondido">
            <X size={18} />
          </button>
        </div>
        <div className="h-1.5 bg-black/25 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div id="study-survey-scroll" className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 max-w-2xl mx-auto space-y-5 pb-8">
          {step === 0 && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sus respuestas ayudan a evaluar esta app en un estudio. No forman parte de su valoración clínica.
              </p>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Usabilidad (SUS)</h2>
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">{SUS_INSTRUCTION}</p>
              {SUS_ITEMS.map((q, i) => (
                <div key={i} className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                    <span className="text-indigo-700 font-black">{i + 1}. </span>{q}
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} onClick={() => setSus(i, v)}
                        className={`flex-1 min-h-[48px] rounded-xl text-base font-black border-2 transition-all ${s.sus[i] === v ? 'bg-indigo-700 border-indigo-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                    <span>{SUS_ANCHORS.low}</span><span>{SUS_ANCHORS.high}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {step > 0 && (() => {
            const k = step - 1;
            const sec = sections[k];
            const off = sectionOffset(k);
            return (
              <>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Calidad de la app (uMARS) · {sec.title}</h2>
                {k === 0 && UMARS_INSTRUCTION && <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">{UMARS_INSTRUCTION}</p>}
                {sec.items.map((it, j) => {
                  const gi = off + j;
                  return (
                    <div key={gi} className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                        <span className="text-indigo-700 font-black">{gi + 1}. </span>{it.q}
                      </p>
                      <div className="space-y-2">
                        {it.opts.map((o, oi) => (
                          <button key={oi} onClick={() => setUmars(gi, oi + 1)}
                            className={`w-full text-left px-4 py-3 min-h-[48px] rounded-xl text-base border-2 transition-all ${s.umars[gi] === oi + 1 ? 'bg-indigo-700 border-indigo-700 text-white font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                            <span className="font-black">{oi + 1}</span> — {o}
                          </button>
                        ))}
                        {it.na && (
                          <button onClick={() => setUmars(gi, 'na')}
                            className={`w-full text-left px-4 py-3 min-h-[48px] rounded-xl text-base border-2 transition-all ${s.umars[gi] === 'na' ? 'bg-slate-600 border-slate-600 text-white font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                            No aplica
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 p-4 safe-bottom bg-white dark:bg-slate-950">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={() => { setStep(step - 1); top(); }}
              className="min-h-[52px] px-5 rounded-xl font-bold text-base border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              Atrás
            </button>
          )}
          <button onClick={onClose}
            className="min-h-[52px] px-5 rounded-xl font-bold text-base border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            Ahora no
          </button>
          <button onClick={() => (last ? finish() : (setStep(step + 1), top()))}
            className="flex-1 min-h-[52px] rounded-xl font-black text-base bg-indigo-700 hover:bg-indigo-800 text-white">
            {last ? 'Terminar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
