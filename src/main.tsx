import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/**
 * Registro del service worker.
 *
 * Chrome en Android exige un service worker con manejador de `fetch` para
 * ofrecer la instalación real de la aplicación (WebAPK). Sin él, "Añadir a
 * pantalla de inicio" genera solo un acceso directo, la app no se ejecuta en
 * modo standalone y navigator.storage.persist() sigue siendo denegado.
 *
 * Solo se registra en producción: en desarrollo interferiría con el HMR de Vite.
 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Un fallo en el registro no debe impedir el uso de la aplicación.
    });
  });
}
