/**
 * sw.js — Service worker de STUIapp.
 *
 * POR QUÉ EXISTE
 * Chrome en Android exige un service worker con manejador de `fetch` para
 * considerar la aplicación instalable y generar un WebAPK real. Sin él,
 * "Añadir a pantalla de inicio" crea únicamente un acceso directo que abre el
 * navegador: display-mode sigue siendo 'browser' y el almacenamiento NO pasa a
 * persistente, que es justo lo que necesitamos evitar para el diario de 3 días.
 *
 * ESTRATEGIA: RED PRIMERO
 * Es una aplicación clínica. Servir una versión antigua de los algoritmos de
 * puntuación sería peor que no funcionar. Por eso siempre se intenta la red
 * primero y la caché solo actúa como respaldo cuando no hay conexión.
 *
 * NO SE CACHEAN DATOS CLÍNICOS. Los datos del paciente viven cifrados en
 * IndexedDB y nunca pasan por aquí: este service worker solo maneja los
 * archivos estáticos de la propia aplicación.
 *
 * NO REALIZA NINGUNA PETICIÓN A TERCEROS. Solo intercepta peticiones del mismo
 * origen, en coherencia con la política de cero transmisión de datos.
 */

const CACHE = 'stuiapp-v1';

// Recursos mínimos para que la aplicación arranque sin conexión.
const ESENCIALES = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ESENCIALES))
      // Si algún recurso falla no bloqueamos la instalación del worker.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET y solo mismo origen: nunca interceptamos nada externo.
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Copia en caché solo las respuestas correctas, para uso sin conexión.
        if (res && res.status === 200 && res.type === 'basic') {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => undefined);
        }
        return res;
      })
      .catch(async () => {
        // Sin conexión: servimos lo que haya en caché.
        const enCache = await caches.match(req);
        if (enCache) return enCache;
        // Navegación sin caché: devolvemos el documento raíz.
        if (req.mode === 'navigate') {
          const raiz = await caches.match('/index.html');
          if (raiz) return raiz;
        }
        return Response.error();
      })
  );
});
