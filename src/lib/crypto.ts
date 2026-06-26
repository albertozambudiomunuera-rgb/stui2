/**
 * crypto.ts — Primitivas AES-256-GCM + PBKDF2 usando Web Crypto API nativa.
 * Sin dependencias externas. Todo el procesamiento ocurre en el navegador.
 *
 * Formato del payload cifrado: "enc:v1:<base64(iv[12] + ciphertext)>"
 * La presencia del prefijo "enc:v1:" identifica datos cifrados vs. JSON legacy.
 */

const AES_ALGO = { name: 'AES-GCM', length: 256 } as const;
const IV_BYTES = 12;
const PBKDF2_ITERATIONS = 200_000; // mínimo NIST recomendado para PBKDF2-SHA256
export const ENCRYPTED_PREFIX = 'enc:v1:';

// ── Helpers de codificación ────────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// ── Claves AES ────────────────────────────────────────────────────────────────

/** Genera una clave AES-256-GCM nueva y aleatoria (Opción A). */
export function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(AES_ALGO, true, ['encrypt', 'decrypt']);
}

/** Exporta una CryptoKey a formato JWK para persistencia en IndexedDB. */
export function exportKeyJWK(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/** Importa una clave desde JWK (recuperada de IndexedDB). */
export function importKeyJWK(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, AES_ALGO, true, ['encrypt', 'decrypt']);
}

// ── Derivación de clave desde PIN (Opción B) ───────────────────────────────────

/** Genera un salt criptográfico aleatorio de 16 bytes. */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function saltToBase64(salt: Uint8Array): string {
  return bytesToBase64(salt);
}

export function base64ToSalt(b64: string): Uint8Array {
  return base64ToBytes(b64);
}

/**
 * Deriva una clave AES-256-GCM a partir de un PIN usando PBKDF2-SHA-256.
 * La clave resultante NO es extractable (nunca abandona el motor crypto).
 */
export async function deriveKeyFromPIN(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const pinBytes = new TextEncoder().encode(pin);
  const baseKey = await crypto.subtle.importKey('raw', pinBytes, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    AES_ALGO,
    false,          // la clave derivada no puede exportarse
    ['encrypt', 'decrypt']
  );
}

// ── Cifrado / Descifrado ───────────────────────────────────────────────────────

/**
 * Cifra un texto plano con AES-256-GCM.
 * Devuelve un string con prefijo "enc:v1:" seguido de base64(iv + ciphertext).
 */
export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const packed = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  packed.set(iv);
  packed.set(new Uint8Array(ciphertext), IV_BYTES);
  return ENCRYPTED_PREFIX + bytesToBase64(packed);
}

/**
 * Descifra un payload producido por `encrypt`.
 * Lanza DOMException si la clave es incorrecta o el payload está corrupto.
 */
export async function decrypt(key: CryptoKey, payload: string): Promise<string> {
  const b64 = payload.startsWith(ENCRYPTED_PREFIX)
    ? payload.slice(ENCRYPTED_PREFIX.length)
    : payload;
  const packed = base64ToBytes(b64);
  const iv = packed.slice(0, IV_BYTES);
  const ciphertext = packed.slice(IV_BYTES);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

/** Indica si un valor almacenado es un payload cifrado (vs. JSON legacy en claro). */
export function isEncryptedPayload(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}
