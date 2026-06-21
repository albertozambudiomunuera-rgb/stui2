import type { AppData } from '../types';

const DB_NAME = 'stuiDB';
const DB_VER = 1;
const STORE = 'appData';
const DATA_KEY = 'main';
const LS_KEY = 'stuiv1';
const DISCLAIMER_KEY = 'stuiv1_d';

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (_db) return res(_db);
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = (e) => { _db = (e.target as IDBOpenDBRequest).result; res(_db); };
    req.onerror = (e) => rej((e.target as IDBOpenDBRequest).error);
  });
}

export async function idbSave(val: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(val, DATA_KEY);
      tx.oncomplete = () => res(true);
      tx.onerror = (e) => rej((e.target as IDBRequest).error);
    });
  } catch {
    try { localStorage.setItem(LS_KEY, val); } catch { /* ignore */ }
    return false;
  }
}

export async function idbLoad(): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(DATA_KEY);
      req.onsuccess = (e) => res((e.target as IDBRequest).result ?? null);
      req.onerror = (e) => rej((e.target as IDBRequest).error);
    });
  } catch {
    try { return localStorage.getItem(LS_KEY); } catch { return null; }
  }
}

export async function idbClear(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(DATA_KEY);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(false);
    });
  } catch {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
    return false;
  }
}

export async function checkIDBAvailable(): Promise<boolean> {
  try { await openDB(); return true; } catch { return false; }
}

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
    if (sv !== null && typeof sv === 'object' && !Array.isArray(sv) && key in target && typeof tv === 'object' && !Array.isArray(tv) && tv !== null) {
      out[key] = deepMerge(tv as object, sv as object) as T[keyof T];
    } else if (sv !== undefined) {
      out[key] = sv as T[keyof T];
    }
  }
  return out;
}

export async function loadDataAsync(): Promise<AppData> {
  let raw = await idbLoad();
  if (!raw) { try { raw = localStorage.getItem(LS_KEY); } catch { /* ignore */ } }
  if (raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // Migrate old string notes to array
      if (typeof parsed.notes === 'string') parsed.notes = [];
      return deepMerge(emptyData(), parsed);
    } catch { /* ignore */ }
  }
  return emptyData();
}

export async function hasExistingData(): Promise<boolean> {
  const raw = await idbLoad();
  if (raw) return true;
  try { return !!localStorage.getItem(LS_KEY); } catch { return false; }
}

export function isDisclaimerAccepted(): boolean {
  try { return !!localStorage.getItem(DISCLAIMER_KEY); } catch { return false; }
}

export function acceptDisclaimer(): void {
  try { localStorage.setItem(DISCLAIMER_KEY, '1'); } catch { /* ignore */ }
}

export function exportBackup(data: AppData): void {
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
  return deepMerge(emptyData(), backup.data ?? backup);
}
