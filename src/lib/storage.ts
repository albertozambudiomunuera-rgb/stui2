/**
 * storage.ts — Capa de persistencia con cifrado transparente.
 *
 * Todas las escrituras pasan por encrypt() y todas las lecturas por decrypt()
 * si hay una clave activa en keyManager. Si no hay clave (modo 'none' o app
 * aún no inicializada) los datos se guardan/leen en claro para compatibilidad.
 *
 * Migración: los datos JSON legacy (sin prefijo "enc:v1:") se leen en claro y
 * se re-cifran automáticamente en la siguiente escritura.
 */

import type { AppData } from '../types';
import { openDB, DATA_STORE, DATA_KEY } from './idb';
import { getActiveKey } from './keyManager';
import { encrypt, decrypt, isEncryptedPayload } from './crypto';

const LS_KEY = 'stuiv1';
const DISCLAIMER_KEY = 'stuiv1_d';

// ── Helpers de cifrado para el storage ────────────────────────────────────────

async function encryptForStorage(plain: string): Promise<string> {
  const key = getActiveKey();
  return key ? encrypt(key, plain) : plain;
}

async function decryptFromStorage(raw: string): Promise<string> {
  const key = getActiveKey();
  if (!key) return raw;
  if (isEncryptedPayload(raw)) {
    return decrypt(key, raw);
  }
  // Dato legacy en texto plano — se devuelve tal cual; se cifrará en la siguiente escritura
  return raw;
}

// ── API de IndexedDB ───────────────────────────────────────────────────────────

export { openDB };

export async function idbSave(val: string): Promise<boolean> {
  const payload = await encryptForStorage(val);
  try {
    const db = await openDB();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(DATA_STORE, 'readwrite');
      tx.objectStore(DATA_STORE).put(payload, DATA_KEY);
      tx.oncomplete = () => res();
      tx.onerror = (e) => rej((e.target as IDBRequest).error);
    });
    // Mantiene localStorage sincronizado (cifrado) como respaldo redundante
    try { localStorage.setItem(LS_KEY, payload); } catch { /* ignore */ }
    return true;
  } catch {
    try { localStorage.setItem(LS_KEY, payload); } catch { /* ignore */ }
    return false;
  }
}

export async function idbLoad(): Promise<string | null> {
  try {
    const db = await openDB();
    const raw: string | null = await new Promise((res, rej) => {
      const tx = db.transaction(DATA_STORE, 'readonly');
      const req = tx.objectStore(DATA_STORE).get(DATA_KEY);
      req.onsuccess = (e) => res((e.target as IDBRequest).result ?? null);
      req.onerror = (e) => rej((e.target as IDBRequest).error);
    });
    if (!raw) return null;
    return decryptFromStorage(raw);
  } catch {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return decryptFromStorage(raw);
    } catch {
      return null;
    }
  }
}

export async function idbClear(): Promise<boolean> {
  try {
    const db = await openDB();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(DATA_STORE, 'readwrite');
      tx.objectStore(DATA_STORE).delete(DATA_KEY);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(false);
    });
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
    return true;
  } catch {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
    return false;
  }
}

export async function checkIDBAvailable(): Promise<boolean> {
  try { await openDB(); return true; } catch { return false; }
}

// ── Datos de la aplicación ────────────────────────────────────────────────────

export function emptyData(): AppData {
  return {
    patient: { name: '', age: '', sex: '', med: '' },
    screening: { iief: null, oab: null, iciq: null },
    days: [
      { date: '', wake: '', sleep: '', entries: [], pads: [] },
      { date: '', wake: '', sleep: '', entries: [], pads: [] },
      { date: '', wake: '', sleep: '', entries: [], pads: [] },
    ],
    ipss: { q: [null, null, null, null, null, null, null], qol: null },
    iief: { q: [null, null, null, null, null] },
    oab: { q: [null, null, null, null, null], qol: [null, null, null, null, null], impact: [] },
    iciq: { q: [null, null, null], vas: 5, when: [] },
    notes: [],
  };
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const out = { ...target } as T;
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv !== null && typeof sv === 'object' && !Array.isArray(sv) &&
      key in target && typeof tv === 'object' && !Array.isArray(tv) && tv !== null
    ) {
      out[key] = deepMerge(tv as object, sv as object) as T[keyof T];
    } else if (sv !== undefined) {
      out[key] = sv as T[keyof T];
    }
  }
  return out;
}

export async function loadDataAsync(): Promise<AppData> {
  const raw = await idbLoad(); // ya viene descifrado
  if (raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsed.notes === 'string') parsed.notes = [];
      return deepMerge(emptyData(), parsed);
    } catch { /* ignore */ }
  }
  return emptyData();
}

export async function hasExistingData(): Promise<boolean> {
  try {
    const db = await openDB();
    const raw: unknown = await new Promise((res, rej) => {
      const tx = db.transaction(DATA_STORE, 'readonly');
      const req = tx.objectStore(DATA_STORE).get(DATA_KEY);
      req.onsuccess = (e) => res((e.target as IDBRequest).result ?? null);
      req.onerror = (e) => rej((e.target as IDBRequest).error);
    });
    if (raw) return true;
  } catch { /* ignore */ }
  try { return !!localStorage.getItem(LS_KEY); } catch { return false; }
}

// ── Disclaimer ────────────────────────────────────────────────────────────────

export function isDisclaimerAccepted(): boolean {
  try { return !!localStorage.getItem(DISCLAIMER_KEY); } catch { return false; }
}

export function acceptDisclaimer(): void {
  try { localStorage.setItem(DISCLAIMER_KEY, '1'); } catch { /* ignore */ }
}

// ── Backup / Importación ──────────────────────────────────────────────────────

export function exportBackup(data: AppData): void {
  // Exporta los datos en claro (ya descifrados en memoria) para portabilidad
  const backup = {
    version: 2,
    app: 'STUI_App',
    exported: new Date().toISOString(),
    patient: data.patient,
    data,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const name = data.patient.name ? data.patient.name.replace(/\s+/g, '_') : 'paciente';
  a.href = url;
  a.download = `STUI_${name}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<AppData> {
  const text = await file.text();
  const backup = JSON.parse(text);
  if (!backup.data && !backup.patient) throw new Error('Archivo no válido');
  // Los datos importados se re-cifrarán al guardarse mediante idbSave
  return deepMerge(emptyData(), backup.data ?? backup);
}
