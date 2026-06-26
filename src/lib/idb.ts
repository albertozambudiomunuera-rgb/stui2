/**
 * idb.ts — Capa base de IndexedDB.
 * Centraliza la apertura de la base de datos y la definición de los object stores,
 * evitando dependencias circulares entre storage.ts y keyManager.ts.
 *
 * v2: añade el store '_keys' para almacenar material criptográfico.
 */

export const DB_NAME = 'stuiDB';
export const DB_VER = 2;
export const DATA_STORE = 'appData';
export const KEY_STORE = '_keys';
export const DATA_KEY = 'main';

let _db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (_db) return res(_db);
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      // Crea el store de datos clínicos si aún no existe (instalación fresca)
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE);
      }
      // Crea el store de claves criptográficas (añadido en v2)
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE);
      }
    };
    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      res(_db);
    };
    req.onerror = (e) => rej((e.target as IDBOpenDBRequest).error);
  });
}
