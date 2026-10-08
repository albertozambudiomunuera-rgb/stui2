import { useEffect, useRef } from 'react';
import type { UsageMode } from '../types';

const TICK_MS = 15_000;
// Un tramo nunca suma más que esto: si el temporizador se congela (móvil en
// reposo sin que llegue 'visibilitychange'), no se cuenta ese hueco como uso.
const MAX_CHUNK_S = 30;

/**
 * Mide el tiempo con la app visible en un modo (Casa o Sala de Espera) y lo
 * va sumando a la sesión en curso. Con mode = null (bienvenida, cargando) no
 * mide nada.
 */
export function useUsageTracker(mode: UsageMode | null, record: (mode: UsageMode, seconds: number, now: Date) => void) {
  const recordRef = useRef(record);
  recordRef.current = record;

  useEffect(() => {
    if (!mode) return;
    let last: number | null = document.visibilityState === 'visible' ? Date.now() : null;

    const flush = () => {
      if (last === null) return;
      const now = Date.now();
      const seconds = Math.min(MAX_CHUNK_S, Math.round((now - last) / 1000));
      last = now;
      if (seconds > 0) recordRef.current(mode, seconds, new Date(now));
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') { flush(); last = null; }
      else last = Date.now();
    };

    const timer = setInterval(flush, TICK_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [mode]);
}
