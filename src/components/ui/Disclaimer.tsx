import { Shield, AlertTriangle, ClipboardList } from 'lucide-react';
import { acceptDisclaimer } from '../../lib/storage';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface DisclaimerProps {
  visible: boolean;
  onAccept: () => void;
}

export function Disclaimer({ visible, onAccept }: DisclaimerProps) {
  // Antes del early return: los hooks no pueden ser condicionales. El hook
  // ya no hace nada internamente cuando visible=false.
  useBodyScrollLock(visible);
  if (!visible) return null;

  const handleAccept = () => {
    acceptDisclaimer();
    onAccept();
  };

  return (
    // Scroll en el contenedor exterior (inset-0, no vh) en vez de max-h en
    // vh en la tarjeta — ver el porqué en InstallPrompt.tsx. Sin esto, en
    // pantallas pequeñas o con letra grande del sistema, el botón
    // "Entendido — Comenzar" podía quedar inalcanzable.
    <div className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-pop-in">
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
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Los mismos que en papel, para rellenarlos con calma y compartirlos con tu urólogo.</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
            <Shield size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Datos 100% locales — RGPD</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Se guardan solo en este dispositivo. Nada se envía a ningún servidor.</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40">
            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">No sustituye la consulta médica</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">No diagnostica ni recomienda tratamiento: calcula puntuaciones y prepara un resumen. La interpretación es siempre del profesional sanitario.</p>
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
    </div>
  );
}
