/**
 * keyManager.ts — Gestión del ciclo de vida de la clave criptográfica activa.
 *
 * El modo de cifrado ya no es una constante estática compilada: se determina en
 * tiempo de ejecución a partir de la elección que el usuario hace en el primer
 * arranque y que queda persistida en localStorage.
 *
 *  'auto' → Clave AES-256 generada automáticamente y almacenada en IDB.
 *            Cifrado transparente, sin interacción del usuario.
 *
 *  'pin'  → Clave derivada del PIN mediante PBKDF2-SHA256.
 *            La clave NUNCA se almacena; solo el salt y un centinela de verificación.
 *            Sin el PIN los datos son irrecuperables.
 */

export type StoredMode = 'auto' | 'pin';

// ── Persistencia de la elección del usuario ────────────────────────────────────

const MODE_LS_KEY = 'stuiv1_sec_mode';

/** Devuelve el modo elegido por el usuario, o null si aún no ha elegido. */
export function getStoredMode(): StoredMode | null {
  try {
    const v = localStorage.getItem(MODE_LS_KEY);
    return v === 'auto' || v === 'pin' ? v : null;
  } catch { return null; }
}

/** Persiste la elección del usuario para que se aplique en recargas futuras. */
export function setStoredMode(mode: StoredMode): void {
  try { localStorage.setItem(MODE_LS_KEY, mode); } catch { /* ignore */ }
}

/** Elimina la elección almacenada (reset completo). */
export function clearStoredMode(): void {
  try { localStorage.removeItem(MODE_LS_KEY); } catch { /* ignore */ }
}

// ── Constantes internas ────────────────────────────────────────────────────────

const KEY_RECORD_ID = 'main';
const SALT_LS_KEY = 'stuiv1_pin_salt';
const SENTINEL_VALUE = '{"stui_sentinel":1}';

// ── Estado del módulo (singleton) ─────────────────────────────────────────────

let _activeKey: CryptoKey | null = null;

// ── API pública ────────────────────────────────────────────────────────────────

/** Devuelve la clave activa o null si el cifrado no está inicializado. */
export function getActiveKey(): CryptoKey | null {
  return _activeKey;
}

/** True cuando la clave está lista para cifrar/descifrar. */
export function isKeyReady(): boolean {
  return _activeKey !== null;
}

/** Borra la clave activa de memoria (útil para "cerrar sesión" en modo PIN). */
export function clearActiveKey(): void {
  _activeKey = null;
}

// ── Modo auto: clave AES aleatoria persistida en IDB ──────────────────────────

/**
 * Carga la clave AES desde IDB o genera y persiste una nueva.
 * Debe llamarse una sola vez al iniciar la app en modo 'auto'.
 */
export async function initAutoKey(db: IDBDatabase): Promise<void> {
  const stored = await _getKeyRecord(db, KEY_RECORD_ID) as { jwk: JsonWebKey } | null;
  if (stored?.jwk) {
    _activeKey = await importKeyJWK(stored.jwk);
  } else {
    const key = await generateAESKey();
    const jwk = await exportKeyJWK(key);
    await _putKeyRecord(db, KEY_RECORD_ID, { jwk });
    _activeKey = key;
  }
}

// ── Modo PIN: clave derivada de PBKDF2 ────────────────────────────────────────

/** Indica si ya existe un PIN configurado (salt presente en localStorage). */
export function isPINConfigured(): boolean {
  try { return !!localStorage.getItem(SALT_LS_KEY); } catch { return false; }
}

/**
 * Primera configuración del PIN.
 * Deriva la clave, persiste el salt y un centinela cifrado, y activa la clave.
 */
export async function setupPINKey(pin: string, db: IDBDatabase): Promise<void> {
  const salt = generateSalt();
  const key = await deriveKeyFromPIN(pin, salt);
  const sentinel = await encrypt(key, SENTINEL_VALUE);
  localStorage.setItem(SALT_LS_KEY, saltToBase64(salt));
  await _putKeyRecord(db, KEY_RECORD_ID, { sentinel });
  _activeKey = key;
}

/**
 * Desbloqueo con PIN. Verifica el centinela cifrado y activa la clave.
 * Devuelve false si el PIN es incorrecto sin lanzar excepción.
 */
export async function unlockWithPIN(pin: string, db: IDBDatabase): Promise<boolean> {
  try {
    const saltB64 = localStorage.getItem(SALT_LS_KEY);
    if (!saltB64) return false;
    const salt = base64ToSalt(saltB64);
    const key = await deriveKeyFromPIN(pin, salt);
    const record = await _getKeyRecord(db, KEY_RECORD_ID) as { sentinel?: string } | null;
    if (!record?.sentinel) return false;
    const plain = await decrypt(key, record.sentinel);
    if (plain !== SENTINEL_VALUE) return false;
    _activeKey = key;
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina la configuración PIN (salt + centinela).
 * Llamar junto con idbClear() y clearStoredMode() para un reset completo.
 */
export function clearPINSetup(): void {
  try { localStorage.removeItem(SALT_LS_KEY); } catch { /* ignore */ }
}

// ── Helpers IDB privados ───────────────────────────────────────────────────────

import { KEY_STORE } from './idb';
import {
  generateAESKey, exportKeyJWK, importKeyJWK,
  deriveKeyFromPIN, generateSalt, saltToBase64, base64ToSalt,
  encrypt, decrypt,
} from './crypto';

function _getKeyRecord(db: IDBDatabase, id: string): Promise<unknown> {
  return new Promise((res, rej) => {
    const tx = db.transaction(KEY_STORE, 'readonly');
    const req = tx.objectStore(KEY_STORE).get(id);
    req.onsuccess = (e) => res((e.target as IDBRequest).result ?? null);
    req.onerror = (e) => rej((e.target as IDBRequest).error);
  });
}

function _putKeyRecord(db: IDBDatabase, id: string, value: unknown): Promise<void> {
  return new Promise((res, rej) => {
    const tx = db.transaction(KEY_STORE, 'readwrite');
    tx.objectStore(KEY_STORE).put(value, id);
    tx.oncomplete = () => res();
    tx.onerror = (e) => rej((e.target as IDBRequest).error);
  });
}
