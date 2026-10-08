import { useState } from 'react';
import type { AppData, Visit } from '../../types';
import { evolutionTable, shortDate } from '../../lib/followup';
import { generateClinicalNote, splitClinicalNote } from '../../lib/clinical';
import { BottomSheet } from './BottomSheet';

// Tabla de evolución entre visitas (seguimiento). Solo valores y diferencia:
// sin colores de mejor/peor ni umbrales, igual que el resto del Resumen.
export function EvolutionSection({ data }: { data: AppData }) {
  const [openVisit, setOpenVisit] = useState<Visit | null>(null);
  if (!data.history.length) return null;

  const t = evolutionTable(data);
  const visits = data.history;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-1">📈 Evolución entre visitas</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Cambio = evaluación actual frente a la anterior. Toca una fecha para ver aquella evaluación.
      </p>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="text-left font-bold py-2 px-1 sticky left-0 bg-white dark:bg-slate-900">Medida</th>
              {visits.map((v) => (
                <th key={v.id} className="text-right font-bold py-2 px-2 whitespace-nowrap">
                  <button type="button" onClick={() => setOpenVisit(v)} className="underline decoration-dotted underline-offset-2">
                    {shortDate(v.closedAt)}
                  </button>
                </th>
              ))}
              <th className="text-right font-bold py-2 px-2">Actual</th>
              <th className="text-right font-bold py-2 px-2">Cambio</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r) => (
              <tr key={r[0]} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 px-1 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 min-w-[9rem]">{r[0]}</td>
                {r.slice(1, -1).map((v, i) => (
                  <td key={i} className="py-2 px-2 text-right font-mono text-slate-700 dark:text-slate-300">{v}</td>
                ))}
                <td className="py-2 px-2 text-right font-mono font-black text-slate-800 dark:text-slate-100">{r[r.length - 1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {t.footnotes.map((f) => (
        <p key={f} className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{f}</p>
      ))}

      <BottomSheet
        open={openVisit !== null}
        title={openVisit ? `Evaluación del ${shortDate(openVisit.closedAt)}` : ''}
        onClose={() => setOpenVisit(null)}
      >
        {openVisit && (
          <pre className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {splitClinicalNote(generateClinicalNote({ ...openVisit.snapshot, history: [] })).main}
          </pre>
        )}
      </BottomSheet>
    </div>
  );
}
