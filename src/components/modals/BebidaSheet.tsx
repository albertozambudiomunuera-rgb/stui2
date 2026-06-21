import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { nowTime, DRINKS } from '../../lib/clinical';
import type { DiaryEntry } from '../../types';

interface BebidaSheetProps {
  open: boolean;
  dayIndex: number;
  onClose: () => void;
  onSave: (di: number, entry: Omit<DiaryEntry, 'id'>) => void;
}

type BebidaDraft = {
  time: string;
  drink: string;
  drinkAmt: string;
};

function emptyDraft(): BebidaDraft {
  return { time: nowTime(), drink: '', drinkAmt: '' };
}

export function BebidaSheet({ open, dayIndex, onClose, onSave }: BebidaSheetProps) {
  const [draft, setDraft] = useState<BebidaDraft>(emptyDraft);

  const handleSave = () => {
    if (!draft.time) { alert('La hora es obligatoria'); return; }
    if (!draft.drink && !draft.drinkAmt) { alert('Selecciona o escribe una bebida'); return; }
    onSave(dayIndex, {
      time: draft.time,
      void: null,
      urgency: null,
      leak: '',
      pad: '',
      incomplete: false,
      firstMorning: false,
      catheter: false,
      drink: draft.drink,
      drinkAmt: parseFloat(draft.drinkAmt) || null,
    } as Omit<DiaryEntry, 'id'>);
    onClose();
    setDraft(emptyDraft());
  };

  return (
    <BottomSheet
      open={open}
      title={`🥤 Anotar bebida — Día ${dayIndex + 1}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            ¿Qué has bebido? Toca para seleccionar
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {DRINKS.map((d) => (
              <button
                key={d.n}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, drink: d.n, drinkAmt: String(d.ml) }))}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                  draft.drink === d.n
                    ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800 hover:border-sky-300'
                }`}
              >
                <span className="text-2xl">{d.e}</span>
                <span className={`text-sm font-bold ${draft.drink === d.n ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{d.n}</span>
                <span className={`text-xs ${draft.drink === d.n ? 'text-sky-100' : 'text-slate-400'}`}>{d.ml} ml</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">O escribe otro tipo</label>
          <div className="grid grid-cols-[1fr_80px] gap-2">
            <input
              type="text"
              value={draft.drink}
              placeholder="tipo de bebida..."
              onChange={(e) => setDraft((d) => ({ ...d, drink: e.target.value }))}
              className="border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-sky-400 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <input
              type="text"
              inputMode="decimal"
              value={draft.drinkAmt}
              placeholder="ml"
              onChange={(e) => setDraft((d) => ({ ...d, drinkAmt: e.target.value }))}
              className="border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-sky-400 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Hora</label>
          <input
            type="time"
            value={draft.time}
            onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
            className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-base font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-sky-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[56px] bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl text-base shadow-lg shadow-sky-600/25 active:scale-[0.98] transition-all"
          >
            Guardar bebida
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[56px] bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 font-black rounded-xl text-base border border-sky-100 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
