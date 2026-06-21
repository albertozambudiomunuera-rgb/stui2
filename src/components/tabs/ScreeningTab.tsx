import type { AppData } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { CheckCircle, Lock, Unlock } from 'lucide-react';

interface ScreeningTabProps {
  data: AppData;
  actions: ReturnType<typeof useAppData>;
  onNext: () => void;
}

interface ScrCardProps {
  badge: React.ReactNode;
  question: string;
  value: boolean | null;
  onYes: () => void;
  onNo: () => void;
  accentClass: string;
}

function ScrCard({ badge, question, value, onYes, onNo, accentClass }: ScrCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border-l-4 border border-slate-100 dark:border-slate-800 ${accentClass}`}>
      <div className="mb-3">{badge}</div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{question}</p>
      <div className="flex gap-3">
        <button
          onClick={onYes}
          className={`flex-1 min-h-[52px] rounded-xl font-black text-base border-2 transition-all ${
            value === true
              ? 'bg-teal-700 border-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-teal-300'
          }`}
        >
          Sí
        </button>
        <button
          onClick={onNo}
          className={`flex-1 min-h-[52px] rounded-xl font-black text-base border-2 transition-all ${
            value === false
              ? 'bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
      {active ? <Unlock size={11} /> : <Lock size={11} />}
      {label}
    </span>
  );
}

export function ScreeningTab({ data, actions, onNext }: ScreeningTabProps) {
  const s = data.screening;
  const sex = data.patient.sex;
  const oabAnswered = s.oab !== null;
  const canContinue = oabAnswered;

  const summaryItems = [
    { label: 'Diario miccional (3 días)', done: true },
    { label: 'IPSS', done: true },
    ...(sex === 'M' ? [{ label: s.iief ? 'IIEF-5 activado' : 'IIEF-5 — No aplica', done: s.iief === true, na: s.iief === false }] : []),
    { label: s.oab ? 'OAB-q activado' : 'OAB-q — No aplica', done: s.oab === true, na: s.oab === false },
    ...(sex === 'F' ? [{ label: s.iciq ? 'ICIQ-SF activado' : 'ICIQ-SF — No aplica', done: s.iciq === true, na: s.iciq === false }] : []),
  ] as { label: string; done: boolean; na?: boolean }[];

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-900/10 rounded-2xl p-5 border border-teal-100 dark:border-teal-800">
        <h2 className="font-black text-teal-800 dark:text-teal-300 text-base mb-2">🎯 3 preguntas de cribado</h2>
        <p className="text-sm text-teal-700/80 dark:text-teal-400/80 leading-relaxed">
          Responde estas preguntas para activar solo los cuestionarios que te corresponden.
        </p>
      </div>

      {sex === 'M' && (
        <ScrCard
          badge={<Badge active={s.iief === true} label={s.iief === true ? 'IIEF-5 activado' : 'IIEF-5 bloqueado'} />}
          question="¿Ha notado cambios en la calidad de sus erecciones en los últimos 6 meses?"
          value={s.iief}
          onYes={() => actions.updateScreening('iief', true)}
          onNo={() => actions.updateScreening('iief', false)}
          accentClass="border-l-sky-400"
        />
      )}

      <ScrCard
        badge={<Badge active={s.oab === true} label={s.oab === true ? 'OAB-q activado' : 'OAB-q bloqueado'} />}
        question="¿Su síntoma principal es el miedo repentino a no llegar al baño a tiempo (urgencia miccional)?"
        value={s.oab}
        onYes={() => actions.updateScreening('oab', true)}
        onNo={() => actions.updateScreening('oab', false)}
        accentClass="border-l-sky-500"
      />

      {sex === 'F' && (
        <ScrCard
          badge={<Badge active={s.iciq === true} label={s.iciq === true ? 'ICIQ-SF activado' : 'ICIQ-SF bloqueado'} />}
          question="¿Tiene pérdidas involuntarias de orina (al toser, estornudar, hacer ejercicio o sin motivo aparente)?"
          value={s.iciq}
          onYes={() => actions.updateScreening('iciq', true)}
          onNo={() => actions.updateScreening('iciq', false)}
          accentClass="border-l-teal-500"
        />
      )}

      {oabAnswered && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Cuestionarios activados para este perfil
          </h3>
          <div className="flex flex-wrap gap-2">
            {summaryItems.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border ${
                  item.na
                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    : item.done
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800'
                }`}
              >
                {item.na ? '—' : item.done ? '✅' : '⏳'} {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {canContinue && (
        <button
          onClick={onNext}
          className="w-full bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg shadow-teal-700/25"
        >
          Continuar → Diario Miccional
        </button>
      )}
    </div>
  );
}
