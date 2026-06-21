import type { AppData } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { OAB_QUESTIONS, OAB_QOL_QUESTIONS, OAB_IMPACT_ITEMS, oabScore } from '../../lib/clinical';

interface OABTabProps {
  data: AppData;
  actions: ReturnType<typeof useAppData>;
  onNext: () => void;
}

export function OABTab({ data, actions, onNext }: OABTabProps) {
  const comp = data.oab.q.every((v) => v !== null);
  const sc = oabScore(data);
  const noOAB = data.oab.q[0] === 0;

  const severity = noOAB ? { text: 'Sin urgencia miccional', colorClass: 'text-emerald-500' }
    : sc <= 10 ? { text: 'Leve', colorClass: 'text-sky-500' }
    : sc <= 18 ? { text: 'Moderado', colorClass: 'text-amber-500' }
    : { text: 'Grave', colorClass: 'text-red-500' };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
          <span>🔵</span> OAB-q — Vejiga Hiperactiva
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-l-2 border-slate-300 dark:border-slate-600">
          Las preguntas 1–5 dan una puntuación de síntomas (0–25). Las preguntas b evalúan el impacto en calidad de vida.
        </p>

        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Síntomas (preguntas 1–5)</h3>
        <div className="space-y-6">
          {OAB_QUESTIONS.map((q, qi) => (
            <div key={qi} className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                <span className="text-slate-500 dark:text-slate-400 font-black">{qi + 1}.</span> {q.t}
              </p>
              <div className="flex flex-wrap gap-2">
                {q.opts.map((o, oi) => (
                  <button
                    key={oi}
                    onClick={() => actions.updateOAB(qi, oi)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-h-[42px] ${
                      data.oab.q[qi] === oi
                        ? 'bg-slate-700 dark:bg-slate-600 border-slate-700 dark:border-slate-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {oi} — {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {comp && (
          <div className="mt-6 text-center p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="font-mono text-5xl font-black text-slate-700 dark:text-slate-300">{sc}<span className="text-lg text-slate-400 font-normal">/25</span></div>
            <div className="text-sm text-slate-500 mt-1">Total síntomas OAB-q</div>
            <div className={`text-lg font-black mt-1 ${severity.colorClass}`}>{severity.text}</div>
          </div>
        )}
      </div>

      {comp && (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-2">📝 Calidad de vida (1b–5b)</h3>
            <p className="text-xs text-slate-500 mb-4">Indique cuánto le molesta lo siguiente (0=nada, 5=muchísimo).</p>
            <div className="space-y-4">
              {OAB_QOL_QUESTIONS.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">{q}</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 1, 2, 3, 4, 5].map((v) => (
                      <button key={v} onClick={() => actions.updateOABQoL(qi, v)}
                        className={`w-11 min-h-[44px] rounded-xl text-base font-black border-2 transition-all ${
                          data.oab.qol[qi] === v
                            ? 'bg-slate-700 dark:bg-slate-600 border-slate-700 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                        }`}>{v}</button>
                    ))}
                    <span className="text-xs text-slate-400 self-center ml-1">0=nada · 5=mucho</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-2">🌐 Impacto en la vida (6b)</h3>
            <p className="text-xs text-slate-500 mb-3">¿Cómo han cambiado estos síntomas su vida? Marque todo lo que corresponda.</p>
            <div className="space-y-2">
              {OAB_IMPACT_ITEMS.map((item, i) => {
                const sel = data.oab.impact.includes(i);
                return (
                  <button key={i} onClick={() => actions.toggleOABImpact(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      sel ? 'bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200'
                    }`}>
                    <input type="checkbox" checked={sel} readOnly className="w-4 h-4 accent-slate-600 flex-shrink-0" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={onNext} className="w-full bg-slate-700 hover:bg-slate-800 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg">
            Continuar →
          </button>
        </>
      )}
    </div>
  );
}
