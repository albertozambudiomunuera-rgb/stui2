import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { nowTime, URGENCY_COLORS, URGENCY_TEXT_COLORS, URGENCY_LABELS } from '../../lib/clinical';
import type { DiaryEntry } from '../../types';

interface MiccionSheetProps {
  open: boolean;
  dayIndex: number;
  onClose: () => void;
  onSave: (di: number, entry: Omit<DiaryEntry, 'id'>) => void;
}

type MiccionDraft = {
  time: string;
  void: string;
  urgency: number | null;
  leak: '' | 'urgency' | 'effort';
  pad: '' | 'ropa interior' | 'protector' | 'pañal';
  incomplete: boolean;
  firstMorning: boolean;
  catheter: boolean;
  drink: '';
  drinkAmt: null;
};

function emptyDraft(): MiccionDraft {
  return { time: nowTime(), void: '', urgency: null, leak: '', pad: '', incomplete: false, firstMorning: false, catheter: false, drink: '', drinkAmt: null };
}

export function MiccionSheet({ open, dayIndex, onClose, onSave }: MiccionSheetProps) {
  const [draft, setDraft] = useState<MiccionDraft>(emptyDraft);
  const [showMore, setShowMore] = useState(false);

  const handleSave = () => {
    if (!draft.time) { alert('La hora es obligatoria'); return; }
    onSave(dayIndex, {
      time: draft.time,
      void: parseFloat(draft.void) || null,
      urgency: draft.urgency,
      leak: draft.leak,
      pad: draft.pad,
      incomplete: draft.incomplete,
      firstMorning: draft.firstMorning,
      catheter: draft.catheter,
      drink: '',
      drinkAmt: null,
    } as Omit<DiaryEntry, 'id'>);
    onClose();
    setDraft(emptyDraft());
  };

  return (
    <BottomSheet
      open={open}
      title={`🚽 Registrar micción — Día ${dayIndex + 1}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Hora</label>
            <input
              type="time"
              value={draft.time}
              onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
              className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-lg font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">ml orinados</label>
            <input
              type="text"
              inputMode="decimal"
              value={draft.void}
              placeholder="ej. 250"
              onChange={(e) => setDraft((d) => ({ ...d, void: e.target.value }))}
              className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            Urgencia — ¿Cuántas ganas tenías?
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, urgency: d.urgency === g ? null : g }))}
                style={draft.urgency === g ? { background: URGENCY_COLORS[g], color: URGENCY_TEXT_COLORS[g] } : undefined}
                className={`flex-1 min-h-[52px] rounded-xl text-xl font-black border-2 transition-all ${
                  draft.urgency === g
                    ? 'border-transparent shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className={`text-sm font-semibold mt-2 text-center transition-colors ${draft.urgency !== null ? '' : 'text-slate-400'}`}
            style={draft.urgency !== null ? { color: URGENCY_COLORS[draft.urgency] } : undefined}>
            {draft.urgency !== null ? `${draft.urgency} — ${URGENCY_LABELS[draft.urgency]}` : 'Toca un número para seleccionar'}
          </p>
        </div>

        {/* More options toggle */}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="w-full border-2 border-dashed border-teal-200 dark:border-teal-800 text-slate-500 dark:text-slate-400 rounded-xl py-3 text-sm font-semibold hover:border-teal-400 transition-colors"
        >
          {showMore ? '▲ Ocultar opciones' : '▼ Escape / absorbente / otras opciones'}
        </button>

        {showMore && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Escape de orina</label>
                <select
                  value={draft.leak}
                  onChange={(e) => setDraft((d) => ({ ...d, leak: e.target.value as MiccionDraft['leak'] }))}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">— No —</option>
                  <option value="urgency">Urgencia</option>
                  <option value="effort">Esfuerzo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Absorbente</label>
                <select
                  value={draft.pad}
                  onChange={(e) => setDraft((d) => ({ ...d, pad: e.target.value as MiccionDraft['pad'] }))}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">— No —</option>
                  <option value="ropa interior">Ropa interior</option>
                  <option value="protector">Protector</option>
                  <option value="pañal">Pañal</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
              {[
                { key: 'firstMorning', label: '★ Primera del día' },
                { key: 'incomplete', label: '⚠️ Vaciado incompleto' },
                { key: 'catheter', label: '🔵 Cateterismo' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={draft[key as 'firstMorning' | 'incomplete' | 'catheter']}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
                    className="w-5 h-5 accent-teal-600 rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[56px] bg-teal-700 hover:bg-teal-800 text-white font-black rounded-xl text-base shadow-lg shadow-teal-700/25 active:scale-[0.98] transition-all"
          >
            Guardar micción
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[56px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-black rounded-xl text-base border border-teal-100 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
