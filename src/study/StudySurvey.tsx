// ESTUDIO-VALIDACION — punto de entrada de la encuesta en el informe: abre la
// ventana sola la primera vez y deja un botón para retomarla o revisarla.
import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle } from 'lucide-react';
import type { StudySurvey as Survey } from '../types';
import { STUDY_SURVEY_ENABLED } from './config';
import { SurveyModal } from './SurveyModal';
import { normalizeStudy, answeredCount, totalItems, isStudyComplete } from './scoring';

interface StudySurveyProps {
  study: Survey | undefined;
  onChange: (fn: (prev: Survey | undefined) => Survey) => void;
  /** Se cumplen las condiciones para ofrecerla (p. ej. IPSS completo). */
  ready: boolean;
}

export function StudySurvey({ study, onChange, ready }: StudySurveyProps) {
  const [open, setOpen] = useState(false);

  // Se abre sola una única vez; al abrirse queda marcada como ofrecida, así
  // "Ahora no" o cerrar la app no la hacen reaparecer en cada visita.
  useEffect(() => {
    if (!STUDY_SURVEY_ENABLED || !ready || study?.prompted) return;
    onChange((prev) => ({ ...normalizeStudy(prev), prompted: true }));
    setOpen(true);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!STUDY_SURVEY_ENABLED || !ready) return null;
  const s = normalizeStudy(study);
  const done = isStudyComplete(s);
  const n = answeredCount(s);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`no-print w-full flex items-center gap-3 rounded-2xl p-4 text-left border-2 transition-all min-h-[56px] ${done ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800' : 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800'}`}
      >
        {done ? <CheckCircle size={22} className="text-emerald-600 flex-shrink-0" /> : <ClipboardList size={22} className="text-indigo-700 flex-shrink-0" />}
        <span className="flex-1">
          <span className={`block text-sm font-black ${done ? 'text-emerald-800 dark:text-emerald-300' : 'text-indigo-800 dark:text-indigo-300'}`}>
            {done ? 'Encuesta del estudio completada' : n > 0 ? 'Completar encuesta del estudio' : 'Responder encuesta del estudio'}
          </span>
          <span className="block text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {done ? 'Gracias. Puedes revisar tus respuestas.' : `Sobre tu experiencia con la app · ${n}/${totalItems()} respuestas`}
          </span>
        </span>
      </button>
      {open && <SurveyModal study={study} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}
