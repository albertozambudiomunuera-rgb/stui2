/**
 * SecurityChoice — Pregunta "¿PIN sí o no?", una sola pregunta directa para
 * reducir la fricción (la versión anterior mostraba dos tarjetas largas con
 * insignias y un panel técnico expandible, engorroso sobre todo para
 * pacientes mayores). El texto legal/RGPD se conserva pero relegado a una
 * nota pequeña al pie, sin competir visualmente con la pregunta principal.
 *
 * YA NO se muestra al arrancar la app: el primer arranque activa el modo
 * 'auto' en silencio (useSecureInit.ts). Este componente se reutiliza tal
 * cual como la oferta contextual de PIN que App.tsx dispara una sola vez,
 * en Modo Casa, justo antes de rellenar el Perfil — donde tiene sentido
 * preguntar, en vez de antes de que el paciente haya visto nada de la app.
 *
 * "Sí" → PINSetup pide el PIN y luego lo repite para confirmarlo.
 * "No" → sigue con el cifrado automático transparente ya activo, sin pedir
 * nada más.
 */

import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import type { StoredMode } from '../../lib/keyManager';

interface SecurityChoiceProps {
  onChoose: (mode: StoredMode) => Promise<void>;
}

export function SecurityChoice({ onChoose }: SecurityChoiceProps) {
  const [loading, setLoading] = useState<StoredMode | null>(null);

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
        <h1 className="text-3xl font-black text-white mb-3 leading-tight">
          ¿Quieres proteger<br />tus datos con un PIN?
        </h1>
        <p className="text-base text-teal-200 leading-relaxed max-w-xs mx-auto">
          Un código de 4 dígitos para que solo tú puedas ver tus datos de salud en este dispositivo.
        </p>
      </div>

      {/* Sí / No */}
      <div className="w-full max-w-sm space-y-4 mb-8">
        <button
          onClick={() => handleChoose('pin')}
          disabled={!!loading}
          className="w-full bg-white rounded-2xl py-5 flex items-center justify-center gap-3 shadow-2xl shadow-black/30 active:scale-[0.97] transition-all disabled:opacity-60"
        >
          {loading === 'pin' ? (
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Lock size={24} className="text-teal-700" />
          )}
          <span className="font-black text-xl text-slate-800">
            {loading === 'pin' ? 'Configurando…' : 'Sí, quiero PIN'}
          </span>
        </button>

        <button
          onClick={() => handleChoose('auto')}
          disabled={!!loading}
          className="w-full bg-white/10 border-2 border-white/30 rounded-2xl py-5 flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:opacity-60"
        >
          {loading === 'auto' && (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span className="font-bold text-lg text-white">
            {loading === 'auto' ? 'Configurando…' : 'No, continuar sin PIN'}
          </span>
        </button>
      </div>

      {/* Legal/RGPD — nota pequeña al pie, no distrae de la pregunta principal */}
      <p className="text-xs text-teal-400/70 text-center max-w-xs leading-relaxed">
        Tus datos se cifran (AES-256) y se guardan solo en este dispositivo — nunca salen de aquí (RGPD).
        Con PIN, la clave se deriva de tu código y nadie sin él puede leer tus datos, ni siquiera tú si lo olvidas.
        Puedes cambiar esta elección borrando los datos de la app desde los ajustes del navegador.
      </p>
    </div>
  );
}
