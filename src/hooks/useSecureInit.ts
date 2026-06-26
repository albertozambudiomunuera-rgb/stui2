/**
 * useSecureInit — Inicialización del sistema de cifrado con flujo híbrido opt-in.
 *
 * Máquina de estados:
 *
 *   'initializing' ──► sin elección guardada ──► 'choose-mode'
 *                  └──► modo 'auto' guardado ──► init clave ──► 'ready'
 *                  └──► modo 'pin' guardado  ──► PIN existe ──► 'unlock-pin'
 *                                             └► PIN nuevo  ──► 'setup-pin'
 *
 *   'choose-mode'  ──► user elige 'auto' ──► init clave ──► 'ready'
 *                  └──► user elige 'pin' ──────────────────► 'setup-pin'
 *
 *   'setup-pin'    ──► user crea PIN ──► 'ready'
 *   'unlock-pin'   ──► PIN correcto  ──► 'ready'
 */

import { useState, useEffect } from 'react';
import { openDB } from '../lib/idb';
import {
  type StoredMode,
  getStoredMode, setStoredMode,
  initAutoKey,
  isPINConfigured, setupPINKey, unlockWithPIN,
} from '../lib/keyManager';

export type SecureStatus =
  | 'initializing'   // abriendo IDB, leyendo preferencias
  | 'choose-mode'    // primer arranque: el usuario debe elegir su nivel de seguridad
  | 'ready'          // clave activa; la app puede leer/escribir datos cifrados
  | 'setup-pin'      // modo PIN, primera vez: solicitar creación de PIN
  | 'unlock-pin'     // modo PIN, retorno: solicitar PIN para descifrar
  | 'error';

export interface UseSecureInitResult {
  status: SecureStatus;
  error: string | null;
  /** Primera vez: el usuario elige su modo de seguridad. */
  chooseMode: (mode: StoredMode) => Promise<void>;
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

        // Primera vez en la app: mostrar pantalla de elección
        if (!mode) {
          setStatus('choose-mode');
          return;
        }

        if (mode === 'auto') {
          await initAutoKey(database);
          setStatus('ready');
          return;
        }

        // Modo PIN: determinar si es primera vez o retorno
        setStatus(isPINConfigured() ? 'unlock-pin' : 'setup-pin');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al inicializar el almacenamiento seguro');
        setStatus('error');
      }
    })();
  }, []);

  const chooseMode = async (mode: StoredMode): Promise<void> => {
    if (!db) throw new Error('Base de datos no disponible');
    setStoredMode(mode);
    if (mode === 'auto') {
      await initAutoKey(db);
      setStatus('ready');
    } else {
      setStatus('setup-pin');
    }
  };

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

  return { status, error, chooseMode, submitSetupPIN, submitUnlockPIN };
}
