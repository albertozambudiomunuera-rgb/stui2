import type { AppData } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { IPSS_QUESTIONS, IPSS_QOL, ipssScore, ipssComplete, ipssSeverity, ipssPredom } from '../../lib/clinical';

interface IPSSTabProps {
  data: AppData;
  actions: ReturnType<typeof useAppData>;
  onNext: () => void;
}

export function IPSSTab({ data, actions, onNext }: IPSSTabProps) {
  const sc = ipssScore(data.ipss);
  const comp = ipssComplete(data.ipss);
  const sev = ipssSeverity(sc);
  const answered = data.ipss.q.filter((v) => v !== null).length;
  const showScore = answered >= 4;

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
          <span>📊</span> IPSS — Síntomas de los últimos 30 días
        </h2>
        <p className="text-xs text-teal-700 dark:text-teal-400 leading-relaxed mb-5 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border-l-2 border-teal-500">
          Puntuación Internacional de Síntomas Prostáticos. Indica con qué frecuencia ha experimentado cada síntoma durante el último mes.
        </p>

        <div className="space-y-6">
          {IPSS_QUESTIONS.map((q, qi) => (
            <div key={qi} className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                <span className="text-teal-600 dark:text-teal-400 font-black">{qi + 1}.</span> {q.t}
              </p>
              <div className="flex flex-wrap gap-2">
                {q.opts.map((o, oi) => (
                  <button
                    key={oi}
                    onClick={() => actions.updateIPSS(qi, oi)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-h-[42px] ${
                      data.ipss.q[qi] === oi
                        ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-600'
                    }`}
                  >
                    {oi} — {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showScore && (
          <div className="mt-6 text-center p-5 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-900/10 rounded-2xl border border-teal-100 dark:border-teal-800">
            <div className="font-mono text-5xl font-black text-teal-700 dark:text-teal-400">{sc}<span className="text-lg text-slate-400 font-normal">/35</span></div>
            <div className="text-sm text-slate-500 mt-1">Puntuación IPSS total</div>
            <div className={`text-lg font-black mt-1 ${sev.colorClass}`}>{sev.text}</div>
            <div className="text-sm text-slate-500 mt-1">Predominio: <strong className="text-slate-700 dark:text-slate-300">{ipssPredom(data.ipss)}</strong></div>
          </div>
        )}
      </div>

      {comp && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
            <span>😊</span> Calidad de Vida
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            ¿Cómo se sentiría si tuviera que pasar el resto de su vida con los síntomas prostáticos tal y como los siente ahora?
          </p>
          <div className="flex flex-wrap gap-2">
            {IPSS_QOL.map((o, i) => (
              <button
                key={i}
                onClick={() => actions.updateIPSSQoL(i)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-h-[42px] ${
                  data.ipss.qol === i
                    ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-300'
                }`}
              >
                {i} — {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {comp && (
        <button onClick={onNext} className="w-full bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg shadow-teal-700/25">
          Continuar →
        </button>
      )}
    </div>
  );
}
