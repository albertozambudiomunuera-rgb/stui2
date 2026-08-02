import { Shield, AlertTriangle, ClipboardList } from 'lucide-react';
import { acceptDisclaimer } from '../../lib/storage';

interface DisclaimerProps {
  visible: boolean;
  onAccept: () => void;
}

export function Disclaimer({ visible, onAccept }: DisclaimerProps) {
  if (!visible) return null;

  const handleAccept = () => {
    acceptDisclaimer();
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-pop-in">
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 p-6 text-center text-white">
          <div className="text-5xl mb-3">🩺</div>
          <h2 className="text-lg font-black">STUI App — Evaluación Urológica</h2>
          <p className="text-sm opacity-80 mt-1">Evaluación urológica · AEU</p>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex gap-3 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
            <ClipboardList size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Los mismos cuestionarios, en digital</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Esta app recoge los mismos cuestionarios y el mismo diario miccional que se usan en papel en la consulta, para que puedas rellenarlos con calma y compartirlos con tu urólogo.</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
            <Shield size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Datos 100% locales — RGPD</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Todo se guarda únicamente en tu dispositivo mediante IndexedDB. Nada se envía a ningún servidor.</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40">
            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">No sustituye la consulta médica</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">La app no realiza mediciones, no emite diagnósticos y no recomienda tratamientos. Calcula las puntuaciones según las reglas publicadas de cada cuestionario y prepara un resumen. La interpretación corresponde siempre a un profesional sanitario.</p>
            </div>
          </div>
          <button
            onClick={handleAccept}
            className="w-full mt-2 bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white font-bold py-4 rounded-xl text-base transition-all shadow-lg shadow-teal-700/25"
          >
            Entendido — Comenzar
          </button>
        </div>
      </div>
    </div>
  );
}
