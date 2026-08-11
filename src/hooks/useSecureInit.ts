/**
 * useSecureInit — Inicialización del sistema de cifrado con flujo híbrido opt-in.
 *
 * Máquina de estados:
 *
 *   'initializing' ──► sin elección guardada ──► activa 'auto' en silencio ──► 'ready'
 *                  └──► modo 'auto' guardado ──► init clave ──► 'ready'
 *                  └──► modo 'pin' guardado  ──► PIN existe ──► 'unlock-pin'
 *                                             └► PIN nuevo  ──► 'setup-pin'
 *
 *   'setup-pin'    ──► user crea PIN ──► 'ready'
 *   'unlock-pin'   ──► PIN correcto  ──► 'ready'
 *
 * El primer arranque YA NO pregunta nada (antes había un estado
 * 'choose-mode' bloqueante aquí): se activa el modo 'auto' directamente, sin
 * pantalla. La oferta de proteger los datos con PIN se hace más tarde, en
 * contexto, justo antes de rellenar el Perfil en Modo Casa — ver App.tsx
 * (showPinOffer) y storage.ts (upgradeToPIN).
 */

import { useState, useEffect } from 'react';
import { openDB } from '../lib/idb';
import {
  getStoredMode, setStoredMode,
  initAutoKey,
  isPINConfigured, setupPINKey, unlockWithPIN,
} from '../lib/keyManager';
import { markPinOfferSeen } from '../lib/storage';

export type SecureStatus =
  | 'initializing'   // abriendo IDB, leyendo preferencias
  | 'ready'          // clave activa; la app puede leer/escribir datos cifrados
  | 'setup-pin'      // modo PIN, primera vez: solicitar creación de PIN
  | 'unlock-pin'     // modo PIN, retorno: solicitar PIN para descifrar
  | 'error';

export interface UseSecureInitResult {
  status: SecureStatus;
  error: string | null;
  /** (Modo PIN) Configura el PIN por primera vez. */
  submitSetupPIN: (pin: string) => Promise<void>;
  /** (Modo PIN) Verifica el PIN e inicializa la clave. Devuelve false si es incorrecto. */
  submitUnlockPIN: (pin: string) => Promise<boolean>;
}

export function useSecureInit(): UseSecureInitResult {
  const [status, setStatus] = useState<SecureStatus>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const database = await openDB();
        setDb(database);

        const mode = getStoredMode();

        // Primera vez en la app: se activa 'auto' sin preguntar nada. La
        // oferta de PIN llega más tarde, en contexto (App.tsx).
        if (!mode) {
          setStoredMode('auto');
          await initAutoKey(database);
          setStatus('ready');
          return;
        }

        if (mode === 'auto') {
          // Quien ya tenía un modo guardado de antes de este cambio (pasó
          // por la antigua pantalla de elección) no debe ver la nueva
          // oferta contextual de PIN — ya decidió.
          markPinOfferSeen();
          await initAutoKey(database);
          setStatus('ready');
          return;
        }

        // Modo PIN ya elegido de antes: tampoco vuelve a preguntarse.
        markPinOfferSeen();
        setStatus(isPINConfigured() ? 'unlock-pin' : 'setup-pin');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al inicializar el almacenamiento seguro');
        setStatus('error');
      }
    })();
  }, []);

  const submitSetupPIN = async (pin: string): Promise<void> => {
    if (!db) throw new Error('Base de datos no disponible');
    await setupPINKey(pin, db);
    setStatus('ready');
  };

  const submitUnlockPIN = async (pin: string): Promise<boolean> => {
    if (!db) return false;
    const ok = await unlockWithPIN(pin, db);
    if (ok) setStatus('ready');
    return ok;
  };

  return { status, error, submitSetupPIN, submitUnlockPIN };
}
