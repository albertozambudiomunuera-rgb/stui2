/**
 * Tiempo de uso de la app por sesión (lib/usage.ts).
 */
import { describe, it, expect } from 'vitest';
import type { UsageSession } from '../../types';
import { recordUsage, formatDuration, usageSummary, usageText, noteWithUsage } from '../usage';
import { appData, ipss } from './fixtures';
import { archiveCurrentVisit, visitMetrics, evolutionTable } from '../followup';
import { generateClinicalNote, splitClinicalNote } from '../clinical';

const t0 = new Date('2026-10-08T10:00:00Z');
const at = (sec: number) => new Date(t0.getTime() + sec * 1000);

describe('recordUsage', () => {
  it('el primer uso abre una sesión que empieza al inicio del tramo', () => {
    const u = recordUsage([], 'casa', 15, at(15));
    expect(u).toHaveLength(1);
    expect(u[0].start).toBe(t0.toISOString());
    expect(u[0].seconds).toBe(15);
  });
  it('tramos seguidos suman a la misma sesión', () => {
    let u = recordUsage([], 'casa', 15, at(15));
    u = recordUsage(u, 'casa', 15, at(30));
    expect(u).toHaveLength(1);
    expect(u[0].seconds).toBe(30);
  });
  it('una salida breve (≤5 min) continúa la sesión sin contar el tiempo fuera', () => {
    let u = recordUsage([], 'casa', 60, at(60));
    u = recordUsage(u, 'casa', 30, at(60 + 240 + 30)); // 4 min fuera
    expect(u).toHaveLength(1);
    expect(u[0].seconds).toBe(90);
  });
  it('una ausencia de más de 5 min abre una sesión nueva', () => {
    let u = recordUsage([], 'casa', 60, at(60));
    u = recordUsage(u, 'casa', 30, at(60 + 360 + 30)); // 6 min fuera
    expect(u).toHaveLength(2);
  });
  it('cambiar de modo abre una sesión nueva', () => {
    let u = recordUsage([], 'casa', 60, at(60));
    u = recordUsage(u, 'sala', 15, at(75));
    expect(u.map((s) => s.mode)).toEqual(['casa', 'sala']);
  });
  it('0 segundos no cambia nada', () => {
    const u: UsageSession[] = [];
    expect(recordUsage(u, 'casa', 0, t0)).toBe(u);
  });
});

describe('formatDuration', () => {
  it('formatos legibles', () => {
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(390)).toBe('6 min 30 s');
    expect(formatDuration(600)).toBe('10 min');
    expect(formatDuration(3900)).toBe('1 h 05 min');
  });
});

const session = (startSec: number, seconds: number, mode: 'casa' | 'sala' = 'casa'): UsageSession => ({
  start: at(startSec).toISOString(), lastActive: at(startSec + seconds).toISOString(), seconds, mode,
});

describe('usageSummary / usageText', () => {
  it('sin uso no hay bloque', () => {
    expect(usageSummary([])).toBeNull();
    expect(usageText([])).toBe('');
  });
  it('hasta 10 sesiones: detalle por sesión, total y media', () => {
    const u = [session(0, 300), session(3600, 120, 'sala')];
    const s = usageSummary(u)!;
    expect(s.sessions).toBe(2);
    expect(s.totalSec).toBe(420);
    expect(s.header[0]).toBe('Sesión');
    expect(s.rows[1][2]).toBe('Sala de Espera');
    expect(usageText(u)).toContain('TIEMPO DE USO DE LA APP: 7 min en 2 sesiones (media 3 min 30 s/sesión)');
  });
  it('más de 10 sesiones: se agrupan por día', () => {
    // 12 sesiones en 3 días: 4 por día, separadas 1 h, a partir de las 10:00 UTC
    const u = Array.from({ length: 12 }, (_, i) => session(Math.floor(i / 4) * 86400 + (i % 4) * 3600, 60));
    const s = usageSummary(u)!;
    expect(s.header[0]).toBe('Día');
    expect(s.rows).toHaveLength(3);
    expect(s.rows.reduce((n, r) => n + Number(r[2]), 0)).toBe(12);
  });
  it('el bloque va en el cuerpo de la nota, antes del pie de reglas', () => {
    const d = appData({ ipss: ipss([1, 1, 1, 1, 1, 1, 1], 2), usage: [session(0, 300)] });
    const { main, rules } = splitClinicalNote(noteWithUsage(generateClinicalNote(d), d.usage));
    expect(main).toContain('TIEMPO DE USO DE LA APP');
    expect(rules).not.toContain('TIEMPO DE USO');
  });
});

describe('tiempo de uso y seguimiento', () => {
  it('se archiva con la visita y el nuevo registro empieza a cero', () => {
    const d = appData({ ipss: ipss([1, 1, 1, 1, 1, 1, 1], 2), usage: [session(0, 300), session(7200, 150)] });
    const after = archiveCurrentVisit(d);
    expect(after.usage).toEqual([]);
    expect(after.history[0].metrics.usageMin).toBe(7.5);
    expect(after.history[0].snapshot.usage).toHaveLength(2);
  });
  it('aparece en la evolución; las visitas archivadas antes de medirlo muestran "—"', () => {
    const d = appData({ ipss: ipss([1, 1, 1, 1, 1, 1, 1], 2), usage: [session(0, 300)] });
    const archived = archiveCurrentVisit(d);
    delete archived.history[0].metrics.usageMin; // visita antigua sin el dato
    const cur = { ...archived, usage: [session(0, 600)] };
    expect(visitMetrics(cur).usageMin).toBe(10);
    const row = evolutionTable(cur).rows.find((r) => r[0].startsWith('Tiempo de uso'));
    expect(row?.slice(1)).toEqual(['—', '10', '—']);
  });
});
