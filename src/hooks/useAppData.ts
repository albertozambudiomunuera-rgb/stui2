import { useState, useCallback, useRef } from 'react';
import type { AppData, DiaryEntry, PadEntry } from '../types';
import { idbSave, idbClear } from '../lib/storage';
import { uid } from '../lib/clinical';

const LS_KEY = 'stuiv1';

export function useAppData(initialData: AppData) {
  const [data, setData] = useState<AppData>(initialData);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((newData: AppData) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const str = JSON.stringify(newData);
      idbSave(str);
      try { localStorage.setItem(LS_KEY, str); } catch { /* ignore */ }
    }, 300);
  }, []);

  const update = useCallback(<K extends keyof AppData>(key: K, val: AppData[K]) => {
    setData((prev) => {
      const next = { ...prev, [key]: val };
      save(next);
      return next;
    });
  }, [save]);

  const updatePatient = useCallback((field: keyof AppData['patient'], val: string) => {
    setData((prev) => {
      const next = { ...prev, patient: { ...prev.patient, [field]: val } };
      save(next);
      return next;
    });
  }, [save]);

  const updateScreening = useCallback((field: keyof AppData['screening'], val: boolean | null) => {
    setData((prev) => {
      const next = { ...prev, screening: { ...prev.screening, [field]: val } };
      save(next);
      return next;
    });
  }, [save]);

  const updateDayMeta = useCallback((di: number, field: 'date' | 'wake' | 'sleep', val: string) => {
    setData((prev) => {
      const days = [...prev.days];
      days[di] = { ...days[di], [field]: val };
      const next = { ...prev, days };
      save(next);
      return next;
    });
  }, [save]);

  const addEntry = useCallback((di: number, entry: Omit<DiaryEntry, 'id'>) => {
    setData((prev) => {
      const days = [...prev.days];
      days[di] = { ...days[di], entries: [...days[di].entries, { ...entry, id: uid() }] };
      const next = { ...prev, days };
      save(next);
      return next;
    });
  }, [save]);

  const delEntry = useCallback((di: number, id: string) => {
    setData((prev) => {
      const days = [...prev.days];
      days[di] = { ...days[di], entries: days[di].entries.filter((e) => e.id !== id) };
      const next = { ...prev, days };
      save(next);
      return next;
    });
  }, [save]);

  const addPad = useCallback((di: number, pad: Omit<PadEntry, 'id'>) => {
    setData((prev) => {
      const days = [...prev.days];
      days[di] = { ...days[di], pads: [...(days[di].pads ?? []), { ...pad, id: uid() }] };
      const next = { ...prev, days };
      save(next);
      return next;
    });
  }, [save]);

  const delPad = useCallback((di: number, id: string) => {
    setData((prev) => {
      const days = [...prev.days];
      days[di] = { ...days[di], pads: (days[di].pads ?? []).filter((e) => e.id !== id) };
      const next = { ...prev, days };
      save(next);
      return next;
    });
  }, [save]);

  const updateIPSS = useCallback((qi: number, val: number) => {
    setData((prev) => {
      const q = [...prev.ipss.q];
      q[qi] = val;
      const next = { ...prev, ipss: { ...prev.ipss, q } };
      save(next);
      return next;
    });
  }, [save]);

  const updateIPSSQoL = useCallback((val: number) => {
    setData((prev) => {
      const next = { ...prev, ipss: { ...prev.ipss, qol: val } };
      save(next);
      return next;
    });
  }, [save]);

  const updateIIEF = useCallback((qi: number, val: number) => {
    setData((prev) => {
      const q = [...prev.iief.q];
      q[qi] = val;
      const next = { ...prev, iief: { ...prev.iief, q } };
      save(next);
      return next;
    });
  }, [save]);

  const updateOAB = useCallback((qi: number, val: number) => {
    setData((prev) => {
      const q = [...prev.oab.q];
      q[qi] = val;
      const next = { ...prev, oab: { ...prev.oab, q } };
      save(next);
      return next;
    });
  }, [save]);

  const updateOABQoL = useCallback((qi: number, val: number) => {
    setData((prev) => {
      const qol = [...prev.oab.qol];
      qol[qi] = val;
      const next = { ...prev, oab: { ...prev.oab, qol } };
      save(next);
      return next;
    });
  }, [save]);

  const toggleOABImpact = useCallback((i: number) => {
    setData((prev) => {
      const arr = [...prev.oab.impact];
      const idx = arr.indexOf(i);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(i);
      const next = { ...prev, oab: { ...prev.oab, impact: arr } };
      save(next);
      return next;
    });
  }, [save]);

  const updateICIQ = useCallback((qi: number, val: number) => {
    setData((prev) => {
      const q = [...prev.iciq.q];
      q[qi] = val;
      const next = { ...prev, iciq: { ...prev.iciq, q } };
      save(next);
      return next;
    });
  }, [save]);

  const updateICIQVas = useCallback((val: number) => {
    setData((prev) => {
      const next = { ...prev, iciq: { ...prev.iciq, vas: val } };
      save(next);
      return next;
    });
  }, [save]);

  const toggleICIQWhen = useCallback((i: number) => {
    setData((prev) => {
      const arr = [...prev.iciq.when];
      const idx = arr.indexOf(i);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(i);
      const next = { ...prev, iciq: { ...prev.iciq, when: arr } };
      save(next);
      return next;
    });
  }, [save]);

  const updateNotes = useCallback((val: string) => {
    setData((prev) => {
      const next = { ...prev, notes: val };
      save(next);
      return next;
    });
  }, [save]);

  const resetData = useCallback(async (emptyDataFn: () => AppData) => {
    await idbClear();
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
    const fresh = emptyDataFn();
    setData(fresh);
  }, []);

  const restoreData = useCallback((restored: AppData) => {
    setData(restored);
    save(restored);
  }, [save]);

  return {
    data,
    updatePatient,
    updateScreening,
    updateDayMeta,
    addEntry,
    delEntry,
    addPad,
    delPad,
    updateIPSS,
    updateIPSSQoL,
    updateIIEF,
    updateOAB,
    updateOABQoL,
    toggleOABImpact,
    updateICIQ,
    updateICIQVas,
    toggleICIQWhen,
    updateNotes,
    resetData,
    restoreData,
    update,
  };
}
