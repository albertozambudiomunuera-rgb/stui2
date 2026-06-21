import type { AppData } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { IIEF_QUESTIONS, iiefScore, iiefSeverity } from '../../lib/clinical';

interface IIEFTabProps {
  data: AppData;
  actions: ReturnType<typeof useAppData>;
  onNext: () => void;
}

export function IIEFTab({ data, actions, onNext }: IIEFTabProps) {
  const comp = data.iief.q.every((v) => v !== null);
  const sc = iiefScore(data.iief);
  const sev = iiefSeverity(sc);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
          <span>💊</span> IIEF-5 — Últimos 6 meses
        </h2>
        <p className="text-xs text-sky-700 dark:text-sky-400 leading-relaxed mb-5 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border-l-2 border-sky-500">
          Índice Internacional de Función Eréctil. 5 preguntas sobre la función sexual en los últimos 6 meses.
        </p>

        <div className="space-y-6">
          {IIEF_QUESTIONS.map((q, qi) => (
            <div key={qi} className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                <span className="text-sky-600 font-black">{qi + 1}.</span> {q.t}
              </p>
              <div className="flex flex-wrap gap-2">
                {q.opts.map((o, oi) => (
                  <button
                    key={oi}
                    onClick={() => actions.updateIIEF(qi, oi)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-h-[42px] ${
                      data.iief.q[qi] === oi
                        ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-300'
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
          <div className="mt-6 text-center p-5 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-800">
            <div className="font-mono text-5xl font-black text-sky-600">{sc}<span className="text-lg text-slate-400 font-normal">/25</span></div>
            <div className="text-sm text-slate-500 mt-1">Puntuación IIEF-5</div>
            <div className={`text-lg font-black mt-1 ${sev.colorClass}`}>{sev.text}</div>
          </div>
        )}
      </div>

      {comp && (
        <button onClick={onNext} className="w-full bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg shadow-sky-600/25">
          Continuar →
        </button>
      )}
    </div>
  );
}
