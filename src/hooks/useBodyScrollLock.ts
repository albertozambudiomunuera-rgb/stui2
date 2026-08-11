import { useEffect } from 'react';

/**
 * Bloquea el scroll del body mientras un overlay a pantalla completa está
 * visible. `overflow: hidden` a secas NO basta en Safari/iOS: el fondo
 * puede seguir rebotando (elastic bounce) por debajo de un elemento
 * `fixed` aunque el body diga overflow hidden, dejando el header mal
 * dibujado y la pantalla sin abrir del todo. La técnica que sí funciona en
 * iOS es fijar el body en su sitio (position: fixed + top negativo con el
 * scroll actual) y restaurarlo al cerrar, no solo ocultar el overflow.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
