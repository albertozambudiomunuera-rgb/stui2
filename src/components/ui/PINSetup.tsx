/**
 * PINSetup — Pantalla de configuración / desbloqueo con PIN de 4 dígitos.
 *
 * mode='setup'  → Primera vez: pide el PIN dos veces para confirmarlo.
 * mode='unlock' → Visitas posteriores: pide el PIN para derivar la clave y descifrar datos.
 *
 * El teclado numérico es táctil-first y evita el teclado del sistema en móvil,
 * lo que impide que el PIN quede en el historial de autocompletado del dispositivo.
 */

import { useState } from 'react';
import { Lock, Delete, AlertCircle, ShieldCheck } from 'lucide-react';

interface PINSetupProps {
  mode: 'setup' | 'unlock';
  onSetup: (pin: string) => Promise<void>;
  onUnlock: (pin: string) => Promise<boolean>;
  /** Callback opcional para borrar todos los datos si el usuario olvida el PIN. */
  onForgotPIN?: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PINSetup({ mode, onSetup, onUnlock, onForgotPIN }: PINSetupProps) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);

  const currentPin = step === 'enter' ? pin : confirmPin;
  const setCurrentPin = step === 'enter' ? setPin : setConfirmPin;

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function handleDigit(key: string) {
    if (loading || currentPin.length >= 4) return;
    setError('');
    const next = currentPin + key;
    setCurrentPin(next);

    if (next.length < 4) return;

    // Auto-submit al completar 4 dígitos
    if (mode === 'unlock') {
      setLoading(true);
      const ok = await onUnlock(next);
      setLoading(false);
      if (!ok) {
        setPin('');
        triggerShake();
        const n = attempts + 1;
        setAttempts(n);
        setError(
          n >= 3
            ? 'PIN incorrecto. Si olvidaste tu PIN, puedes borrar los datos abajo.'
            : `PIN incorrecto. Inténtalo de nuevo (${n}/3).`
        );
      }
      return;
    }

    // Modo setup: primer paso → ir a confirmar
    if (step === 'enter') {
      setTimeout(() => setStep('confirm'), 120); // pequeña pausa visual
      return;
    }

    // Modo setup: confirmación
    if (pin !== next) {
      setConfirmPin('');
      triggerShake();
      setError('Los PINs no coinciden. Vuelve a intentarlo.');
      setTimeout(() => { setStep('enter'); setPin(''); }, 600);
      return;
    }

    setLoading(true);
    try {
      await onSetup(pin);
    } catch {
      setLoading(false);
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('Error al configurar el PIN. Inténtalo de nuevo.');
    }
  }

  function handleBackspace() {
    if (loading) return;
    setError('');
    setCurrentPin(currentPin.slice(0, -1));
  }

  const title = mode === 'setup'
    ? (step === 'enter' ? 'Crea tu PIN de acceso' : 'Confirma tu PIN')
    : 'Introduce tu PIN';

  const subtitle = mode === 'setup'
    ? (step === 'enter'
        ? 'Elige 4 dígitos para proteger tus datos clínicos'
        : 'Repite el PIN para confirmarlo')
    : 'Necesario para descifrar tus datos de salud';

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-700 via-teal-800 to-teal-900 flex flex-col items-center justify-center p-6">

      {/* Cabecera */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5 border border-white/20">
          <Lock size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">{title}</h1>
        <p className="text-sm text-teal-200 leading-relaxed max-w-xs mx-auto">{subtitle}</p>
      </div>

      {/* Puntos indicadores del PIN */}
      <div className={`flex gap-5 mb-8 transition-transform ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < currentPin.length
                ? 'bg-white border-white scale-110'
                : 'bg-transparent border-white/50'
            }`}
          />
        ))}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 mb-6 max-w-xs w-full">
          <AlertCircle size={16} className="text-red-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-200 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-xs">
        {KEYS.map((key, idx) => {
          if (key === '') return <div key={idx} />;

          if (key === '⌫') {
            return (
              <button
                key={idx}
                onPointerDown={(e) => { e.preventDefault(); handleBackspace(); }}
                disabled={loading || currentPin.length === 0}
                className="h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform disabled:opacity-30"
                aria-label="Borrar"
              >
                <Delete size={22} />
              </button>
            );
          }

          return (
            <button
              key={idx}
              onPointerDown={(e) => { e.preventDefault(); handleDigit(key); }}
              disabled={loading || currentPin.length >= 4}
              className="h-16 rounded-2xl bg-white/15 border border-white/20 text-white text-2xl font-bold active:scale-95 active:bg-white/25 transition-all disabled:opacity-40"
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Estado cargando (PBKDF2 puede tardar ~1s) */}
      {loading && (
        <div className="flex items-center gap-2 text-teal-200 text-sm mb-4 animate-pulse">
          <ShieldCheck size={16} />
          <span>{mode === 'setup' ? 'Configurando cifrado…' : 'Verificando PIN…'}</span>
        </div>
      )}

      {/* Nota de seguridad */}
      {mode === 'setup' && !loading && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-xs w-full text-center">
          <p className="text-xs text-teal-300 leading-relaxed">
            🔒 El PIN no se almacena. Si lo olvidas, los datos no pueden recuperarse.
            <br />Anótalo en un lugar seguro.
          </p>
        </div>
      )}

      {/* Opción de reset si olvidó el PIN */}
      {mode === 'unlock' && attempts >= 3 && onForgotPIN && (
        <button
          onClick={onForgotPIN}
          className="mt-6 text-xs text-red-300 underline underline-offset-2 hover:text-red-200 transition-colors"
        >
          Olvidé mi PIN — Borrar todos los datos
        </button>
      )}
    </div>
  );
}
