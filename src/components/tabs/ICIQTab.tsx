import type { AppData } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { ICIQ_Q1_OPTS, ICIQ_Q2_OPTS, ICIQ_WHEN, iciqScore, iciqSeverity } from '../../lib/clinical';

interface ICIQTabProps {
  data: AppData;
  actions: ReturnType<typeof useAppData>;
  onNext: () => void;
}

export function ICIQTab({ data, actions, onNext }: ICIQTabProps) {
  const comp = data.iciq.q[0] !== null && data.iciq.q[1] !== null;
  const sc = iciqScore(data);
  const sev = iciqSeverity(sc);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
          <span>💧</span> ICIQ-SF — Incontinencia urinaria
        </h2>
        <p className="text-xs text-teal-700 dark:text-teal-400 leading-relaxed mb-5 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border-l-2 border-teal-400">
          Cuestionario Internacional de Incontinencia. Preguntas 1+2+3 dan la puntuación diagnóstica. Cualquier valor {'>'} 0 es diagnóstico de incontinencia urinaria.
        </p>

        <div className="space-y-6">
          {/* Q1 */}
          <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
              <span className="text-teal-600 font-black">1.</span> ¿Con qué frecuencia pierde orina?
            </p>
            <div className="flex flex-wrap gap-2">
              {ICIQ_Q1_OPTS.map((o) => (
                <button key={o.v} onClick={() => actions.updateICIQ(0, o.v)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-h-[42px] ${
                    data.iciq.q[0] === o.v ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-300'
                  }`}>{o.v} — {o.t}</button>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
              <span className="text-teal-600 font-black">2.</span> ¿Cuánta orina cree que se le escapa habitualmente?
            </p>
            <div className="flex flex-wrap gap-2">
              {ICIQ_Q2_OPTS.map((o) => (
                <button key={o.v} onClick={() => actions.updateICIQ(1, o.v)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all min-h-[42px] ${
                    data.iciq.q[1] === o.v ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-300'
                  }`}>{o.v} — {o.t}</button>
              ))}
            </div>
          </div>

          {/* Q3 VAS */}
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
              <span className="text-teal-600 font-black">3.</span> ¿En qué medida estos escapes han afectado su vida diaria? (0 = nada, 10 = mucho)
            </p>
            <input
              type="range"
              min="0"
              max="10"
              value={data.iciq.vas}
              onChange={(e) => actions.updateICIQVas(parseInt(e.target.value))}
              style={{ background: `linear-gradient(to right, #0d9488 ${data.iciq.vas * 10}%, #e2e8f0 ${data.iciq.vas * 10}%)` }}
              className="w-full"
            />
            <div className="text-center font-mono text-3xl font-black text-teal-700 dark:text-teal-400 mt-2">{data.iciq.vas}</div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0 — Nada</span>
              <span>10 — Mucho</span>
            </div>
          </div>
        </div>

        {comp && (
          <div className="mt-6 text-center p-5 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800">
            <div className="font-mono text-5xl font-black text-teal-700 dark:text-teal-400">{sc}<span className="text-lg text-slate-400 font-normal">/21</span></div>
            <div className="text-sm text-slate-500 mt-1">Puntuación ICIQ-SF (preg. 1+2+3)</div>
            <div className={`text-lg font-black mt-1 ${sev.colorClass}`}>{sev.text}</div>
          </div>
        )}
      </div>

      {comp && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-2">🕐 Pregunta 4 — ¿Cuándo pierde orina?</h3>
          <p className="text-xs text-slate-500 mb-3">Señale todo lo que le ocurra:</p>
          <div className="space-y-2">
            {ICIQ_WHEN.map((w, i) => {
              const sel = data.iciq.when.includes(i);
              return (
                <button key={i} onClick={() => actions.toggleICIQWhen(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    sel ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-teal-100'
                  }`}>
                  <input type="checkbox" checked={sel} readOnly className="w-4 h-4 accent-teal-600 flex-shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">{w}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {comp && (
        <button onClick={onNext} className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg shadow-teal-600/25">
          Ver Informe →
        </button>
      )}
    </div>
  );
}
