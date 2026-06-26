/**
 * SecurityChoice — Pantalla de bienvenida mostrada solo en el primer arranque.
 *
 * El usuario decide si quiere proteger sus datos con un PIN personal (cifrado
 * vinculado a su clave) o continuar con cifrado automático transparente.
 * La elección queda persistida y no vuelve a mostrarse.
 */

import { useState } from 'react';
import { Lock, Zap, ShieldCheck, ChevronRight, Info } from 'lucide-react';
import type { StoredMode } from '../../lib/keyManager';

interface SecurityChoiceProps {
  onChoose: (mode: StoredMode) => Promise<void>;
}

export function SecurityChoice({ onChoose }: SecurityChoiceProps) {
  const [loading, setLoading] = useState<StoredMode | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleChoose = async (mode: StoredMode) => {
    setLoading(mode);
    await onChoose(mode);
    // El componente se desmonta cuando el status cambia a 'ready' o 'setup-pin'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-700 via-teal-800 to-teal-900 flex flex-col items-center justify-center p-6">

      {/* Cabecera */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <ShieldCheck size={38} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2 leading-tight">
          ¿Cómo quieres proteger<br />tus datos de salud?
        </h1>
        <p className="text-sm text-teal-200 leading-relaxed max-w-xs mx-auto">
          Elige el nivel de seguridad para tus datos clínicos guardados en este dispositivo.
        </p>
      </div>

      {/* Opciones */}
      <div className="w-full max-w-sm space-y-4 mb-8">

        {/* Opción PIN — Recomendada */}
        <button
          onClick={() => handleChoose('pin')}
          disabled={!!loading}
          className="w-full bg-white rounded-2xl p-5 text-left shadow-2xl shadow-black/30 hover:shadow-black/40 active:scale-[0.97] transition-all group disabled:opacity-60"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 group-active:scale-90 transition-transform">
              <Lock size={26} className="text-teal-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-base text-slate-800">Proteger con PIN</span>
                <span className="text-[10px] font-black bg-teal-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Crea un código de 4 dígitos. Tus datos se cifran con AES-256
                usando una clave derivada de ese PIN. Sin él, nadie puede leer la información.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full">
                  🔐 Cifrado AES-256 con PIN
                </span>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full">
                  ✅ RGPD · máxima seguridad
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Opción Auto — Sin PIN */}
        <button
          onClick={() => handleChoose('auto')}
          disabled={!!loading}
          className="w-full bg-white rounded-2xl p-5 text-left shadow-xl shadow-black/20 hover:shadow-black/30 active:scale-[0.97] transition-all group disabled:opacity-60"
        >
          <div className="flex items-start gap-4">
            {loading === 'auto' ? (
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-active:scale-90 transition-transform">
                <Zap size={26} className="text-amber-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-black text-base text-slate-800 mb-1">
                {loading === 'auto' ? 'Configurando cifrado…' : 'Continuar sin PIN'}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                El navegador genera automáticamente una clave AES-256 aleatoria.
                Los datos nunca quedan en texto plano, pero no se requiere PIN para acceder.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                  ⚡ Acceso inmediato
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                  🛡️ Cifrado técnico básico
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* Nota informativa expandible */}
      <div className="w-full max-w-sm">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full flex items-center gap-2 text-teal-300 text-xs mb-2 hover:text-white transition-colors"
        >
          <Info size={13} />
          <span>{showInfo ? 'Ocultar información técnica' : '¿Cuál es la diferencia?'}</span>
        </button>

        {showInfo && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-xs text-teal-100 leading-relaxed space-y-2">
            <p>
              <strong className="text-white">Con PIN:</strong> la clave criptográfica se deriva
              matemáticamente de tu PIN. Ni la clave ni el PIN se guardan nunca.
              Si olvidas el PIN, los datos no pueden recuperarse.
            </p>
            <p>
              <strong className="text-white">Sin PIN:</strong> se genera una clave aleatoria y
              se almacena en el mismo perfil del navegador. Los datos no quedan en texto plano,
              pero alguien con acceso físico al dispositivo y perfil del navegador podría,
              en teoría, recuperar también la clave.
            </p>
            <p className="text-teal-300">
              En ambos casos, <strong className="text-white">ningún dato sale del dispositivo</strong>.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-teal-400/70 mt-8 text-center max-w-xs">
        Puedes cambiar esta configuración borrando los datos de la app desde los ajustes del navegador.
      </p>
    </div>
  );
}
