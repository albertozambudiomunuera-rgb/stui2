import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { AppData, DiaryEntry } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { MiccionSheet } from '../modals/MiccionSheet';
import { BebidaSheet } from '../modals/BebidaSheet';
import { isNight, URGENCY_COLORS, URGENCY_TEXT_COLORS, URGENCY_LABELS, nowTime, padSeverity } from '../../lib/clinical';

interface DayTabProps {
  data: AppData;
  actions: ReturnType<typeof useAppData>;
  dayIndex: number;
  onToast: (msg: string) => void;
  onNext: () => void;
}

export function DayTab({ data, actions, dayIndex: di, onToast, onNext }: DayTabProps) {
  const [sheetType, setSheetType] = useState<'miccion' | 'bebida' | null>(null);
  const [padDry, setPadDry] = useState('');
  const [padWet, setPadWet] = useState('');
  const [padTime, setPadTime] = useState(nowTime());

  const day = data.days[di];
  const svoids = day.entries.filter((e) => e.void !== null && !e.catheter);
  const tvoid = svoids.reduce((s, e) => s + (e.void ?? 0), 0);
  const avgV = svoids.length ? Math.round(tvoid / svoids.length) : 0;
  const tdrink = day.entries.filter((e) => e.drinkAmt).reduce((s, e) => s + (e.drinkAmt ?? 0), 0);
  const sevUrg = day.entries.filter((e) => (e.urgency ?? 0) >= 3).length;
  const diurnal = day.wake && day.sleep ? svoids.filter((e) => !isNight(e.time, day.wake, day.sleep)).length : svoids.length;
  const nocturnal = day.wake && day.sleep ? svoids.filter((e) => isNight(e.time, day.wake, day.sleep)).length : 0;
  const sorted = [...day.entries].sort((a, b) => a.time.localeCompare(b.time));

  const handleSaveEntry = (di2: number, entry: Omit<DiaryEntry, 'id'>) => {
    actions.addEntry(di2, entry);
    const label = entry.void !== null ? 'Micción guardada' : 'Bebida anotada';
    onToast(label);
  };

  const handleAddPad = () => {
    const dry = parseFloat(padDry);
    const wet = parseFloat(padWet);
    if (isNaN(dry) || dry < 0) { alert('Indica el peso seco'); return; }
    if (isNaN(wet) || wet < dry) { alert('El peso mojado debe ser mayor que el seco'); return; }
    actions.addPad(di, { time: padTime || nowTime(), dry, wet, leak: +(wet - dry).toFixed(1) });
    setPadDry('');
    setPadWet('');
    onToast('Absorbente registrado');
  };

  const pads = day.pads ?? [];
  const padTotal = +(pads.reduce((s, e) => s + e.leak, 0)).toFixed(1);
  const padSev = padSeverity(padTotal);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Day meta */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-slate-100 text-base mb-3 flex items-center gap-2">
          <span>📅</span> Día {di + 1}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Fecha', type: 'date', val: day.date, key: 'date' as const },
            { label: '🌅 Levantarse', type: 'time', val: day.wake, key: 'wake' as const },
            { label: '🌙 Acostarse', type: 'time', val: day.sleep, key: 'sleep' as const },
          ].map(({ label, type, val, key }) => (
            <div key={key}>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1">{label}</label>
              <input
                type={type}
                value={val}
                onChange={(e) => actions.updateDayMeta(di, key, e.target.value)}
                className="w-full border-2 border-slate-100 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Micciones', val: svoids.length, sub: `${diurnal}d · ${nocturnal}n`, danger: false },
          { label: 'Vol. orinado', val: tvoid, unit: 'ml', sub: `prom. ${avgV}ml`, danger: false },
          { label: 'Ingesta', val: tdrink, unit: 'ml', sub: '', danger: false },
          { label: 'Urgencias ≥3', val: sevUrg, sub: '', danger: sevUrg > 0 },
        ].map(({ label, val, unit, sub, danger }) => (
          <div key={label} className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
            <div className={`font-mono text-xl font-black mt-0.5 ${danger ? 'text-red-500' : 'text-teal-700 dark:text-teal-400'}`}>
              {val}{unit && <span className="text-xs font-normal text-slate-400"> {unit}</span>}
            </div>
            {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 no-print">
        <button
          onClick={() => setSheetType('miccion')}
          className="bg-teal-700 hover:bg-teal-800 rounded-2xl py-5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-teal-700/30"
        >
          <span className="text-4xl">🚽</span>
          <span className="font-black text-lg text-white">Micción</span>
          <span className="text-xs text-teal-200">volumen + urgencia</span>
        </button>
        <button
          onClick={() => setSheetType('bebida')}
          className="bg-sky-600 hover:bg-sky-700 rounded-2xl py-5 flex flex-col items-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-sky-600/30"
        >
          <span className="text-4xl">🥤</span>
          <span className="font-black text-lg text-white">Bebida</span>
          <span className="text-xs text-sky-100">tipo + cantidad</span>
        </button>
      </div>

      {/* Entries list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <span>📋</span> Registros del día {di + 1}
          </h3>
          <span className="text-xs text-slate-400">{day.entries.length} anotacion{day.entries.length !== 1 ? 'es' : ''}</span>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <div className="text-4xl mb-2">📋</div>
            <p>Sin registros todavía.</p>
            <p className="text-xs mt-1">Usa los botones de arriba.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((e) => (
              <EntryCard key={e.id} entry={e} day={day} onDelete={() => actions.delEntry(di, e.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Pad test section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          🩲 Pad Test — Absorbentes del día {di + 1}
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Hora</label>
            <input type="time" value={padTime} onChange={(e) => setPadTime(e.target.value)}
              className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 font-mono text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Seco (g)</label>
            <input type="text" inputMode="decimal" value={padDry} placeholder="ej. 8" onChange={(e) => setPadDry(e.target.value)}
              className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Mojado (g)</label>
            <input type="text" inputMode="decimal" value={padWet} placeholder="ej. 23" onChange={(e) => setPadWet(e.target.value)}
              className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600" />
          </div>
        </div>
        <button onClick={handleAddPad}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-sm mb-3 transition-colors">
          + Registrar absorbente
        </button>
        {pads.length > 0 && (
          <div className="space-y-2">
            {[...pads].sort((a, b) => a.time.localeCompare(b.time)).map((pad) => (
              <div key={pad.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-mono font-bold text-teal-700 dark:text-teal-400 text-base">{pad.time}</div>
                  <div className="text-xs text-slate-500">{pad.dry}g → {pad.wet}g</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-lg text-rose-500">+{pad.leak}g</span>
                  <button onClick={() => actions.delPad(di, pad.id)}
                    className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className={`text-right text-sm font-black mt-1 ${padSev.colorClass}`}>
              Total: {padTotal}g — {padSev.text}
            </div>
          </div>
        )}
      </div>

      {(svoids.length > 0 || day.entries.length > 0) && (
        <button onClick={onNext}
          className="w-full border-2 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 font-black py-4 rounded-2xl text-base hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
          {di < 2 ? `Continuar con Día ${di + 2} →` : 'Ir al IPSS →'}
        </button>
      )}

      <MiccionSheet open={sheetType === 'miccion'} dayIndex={di} onClose={() => setSheetType(null)} onSave={handleSaveEntry} />
      <BebidaSheet open={sheetType === 'bebida'} dayIndex={di} onClose={() => setSheetType(null)} onSave={handleSaveEntry} />
    </div>
  );
}

function EntryCard({ entry: e, day, onDelete }: { entry: DiaryEntry; day: AppData['days'][number]; onDelete: () => void }) {
  const night = isNight(e.time, day.wake, day.sleep);
  const isBev = e.void === null && !e.catheter && (e.drink || e.drinkAmt) && e.urgency === null;

  return (
    <div className={`rounded-xl p-3 border-2 ${night ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800' : isBev ? 'bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-black text-lg ${isBev ? 'text-sky-600' : 'text-teal-700 dark:text-teal-400'}`}>
            {e.time}
          </span>
          {night && <span className="text-sm">🌙</span>}
          {e.firstMorning && <span className="text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 font-bold px-2 py-0.5 rounded-full">★ 1ª</span>}
        </div>
        <button onClick={onDelete}
          className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {e.void !== null && (
          <span className="font-mono font-bold text-sm bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800 px-2.5 py-1 rounded-lg">
            💧 {e.void} ml{e.incomplete ? ' ⚠️' : ''}
          </span>
        )}
        {e.catheter && (
          <span className="text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">🔵 Cateterismo</span>
        )}
        {e.urgency !== null && !e.catheter && (
          <span className="text-sm font-bold px-2.5 py-1 rounded-lg"
            style={{ background: URGENCY_COLORS[e.urgency], color: URGENCY_TEXT_COLORS[e.urgency] }}>
            Urg. {e.urgency} — {URGENCY_LABELS[e.urgency]}
          </span>
        )}
        {e.leak === 'urgency' && <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 px-2.5 py-1 rounded-lg">Escape urgencia</span>}
        {e.leak === 'effort' && <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2.5 py-1 rounded-lg">Escape esfuerzo</span>}
        {e.pad && <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">🩲 {e.pad}</span>}
        {(e.drink || e.drinkAmt) && (
          <span className="text-xs font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-2.5 py-1 rounded-lg">
            {e.drink || 'bebida'}{e.drinkAmt ? ` · ${e.drinkAmt} ml` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
