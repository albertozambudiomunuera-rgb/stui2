import { useState, useEffect, useRef } from 'react';
import { X, Home, Printer } from 'lucide-react';
import type { AppData } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import {
  IPSS_QUESTIONS, IPSS_QOL, IIEF_QUESTIONS, OAB_QUESTIONS,
  ICIQ_Q1_OPTS, ICIQ_Q2_OPTS,
  ipssScore, ipssComplete, ipssSeverity, ipssPredom,
  iiefScore, iiefSeverity,
  oabScore,
  iciqScore, iciqSeverity,
  generateClinicalNote, computeStats, padSeverity,
} from '../../lib/clinical';

interface ExpressModeProps {
  data: AppData;
  actions: ReturnType<typeof useAppData>;
  onExit: () => void;
  onSwitchHome: () => void;
}

type ExpressTab = 'screening' | 'ipss' | 'iief' | 'oab' | 'iciq' | 'result';

const RED = '#4052D6';

export function ExpressMode({ actions, onExit, onSwitchHome }: ExpressModeProps) {
  const data = actions.data;
  const [activeTab, setActiveTab] = useState<ExpressTab>('screening');
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const timeStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;

  const sex = data.patient.sex;

  const tabs: ExpressTab[] = sex === 'M'
    ? ['screening', 'ipss', ...(data.screening.iief ? ['iief' as ExpressTab] : []), 'oab', 'result']
    : sex === 'F'
    ? ['screening', 'ipss', 'oab', 'iciq', 'result']
    : ['screening'];

  const tabLabel: Record<ExpressTab, string> = {
    screening: '🎯 Cribado', ipss: '📊 IPSS', iief: '💊 IIEF-5',
    oab: '🚨 OAB', iciq: '💧 ICIQ', result: '✅ Resultado',
  };

  const goNext = () => {
    const idx = tabs.indexOf(activeTab);
    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
  };

  const progress = activeTab === 'screening' ? 0 :
    Math.round((data.ipss.q.filter(v => v !== null).length / 8) * 100);

  return (
    <div className="fixed inset-0 z-[400] bg-white dark:bg-slate-950 overflow-y-auto">
      <div className="sticky top-0 z-10 shadow-lg" style={{ backgroundColor: RED }}>
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/Logo-AEU-Corporativo.png"
              alt="AEU"
              className="h-6 flex-shrink-0 object-contain"
            />
            <span className="text-white font-black text-base">Modo Sala de Espera</span>
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-lg">EXPRÉS</span>
            <span className="ml-auto font-mono text-sm font-bold text-white/90">{timeStr}</span>
            <button onClick={onExit} className="p-1.5 bg-white/20 rounded-lg">
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="h-1 -mx-4 mb-0" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div className="h-full bg-white/80 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <nav className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap min-h-[44px] transition-all ${
                  activeTab === t ? 'bg-white dark:bg-slate-950 text-blue-700' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}>
                {tabLabel[t]}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto pb-10">
        {activeTab === 'screening' && <ExpressScreening data={data} actions={actions} onNext={goNext} />}
        {activeTab === 'ipss' && <ExpressIPSS data={data} actions={actions} onNext={goNext} />}
        {activeTab === 'iief' && <ExpressIIEF data={data} actions={actions} onNext={goNext} />}
        {activeTab === 'oab' && <ExpressOAB data={data} actions={actions} onNext={goNext} />}
        {activeTab === 'iciq' && <ExpressICIQ data={data} actions={actions} onNext={goNext} />}
        {activeTab === 'result' && <ExpressResult data={data} elapsed={elapsed} onSwitchHome={() => { onExit(); onSwitchHome(); }} />}
      </div>
    </div>
  );
}

function ExpressScreening({ data, actions, onNext }: { data: AppData; actions: ReturnType<typeof useAppData>; onNext: () => void }) {
  const s = data.screening;
  const sex = data.patient.sex;

  const canContinue =
    sex !== null &&
    s.oab !== null &&
    (sex !== 'M' || s.iief !== null) &&
    (sex !== 'F' || s.iciq !== null);

  const handleSexSelect = (v: 'M' | 'F') => {
    actions.updatePatient('sex', v);
    if (v === 'M') {
      actions.updateScreening('iciq', false);
    } else {
      actions.updateScreening('iief', false);
      actions.updateScreening('iciq', true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 border border-blue-200 mb-2" style={{ backgroundColor: '#eef0ff' }}>
        <p className="font-bold text-sm" style={{ color: RED }}>🎯 Responde estas preguntas para activar solo los cuestionarios que te corresponden.</p>
      </div>

      {/* Sex selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-full mb-3 ${sex ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
          {sex ? `✅ Sexo: ${sex === 'M' ? 'Varón' : 'Mujer'}` : 'Sexo biológico'}
        </span>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed mb-4">¿Cuál es el sexo biológico del paciente?</p>
        <div className="flex gap-3">
          <button onClick={() => handleSexSelect('M')}
            className={`flex-1 min-h-[48px] rounded-xl font-black text-base border-2 transition-all ${sex === 'M' ? 'text-white border-transparent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'}`}
            style={sex === 'M' ? { backgroundColor: RED } : {}}>
            ♂ Varón
          </button>
          <button onClick={() => handleSexSelect('F')}
            className={`flex-1 min-h-[48px] rounded-xl font-black text-base border-2 transition-all ${sex === 'F' ? 'text-white border-transparent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'}`}
            style={sex === 'F' ? { backgroundColor: RED } : {}}>
            ♀ Mujer
          </button>
        </div>
      </div>

      {/* OAB — shown once sex is selected, for both sexes */}
      {sex && (
        <ScrCard
          question="¿Su síntoma principal es el miedo repentino a no llegar al baño a tiempo (urgencia miccional)?"
          label="OAB-q"
          value={s.oab}
          onYes={() => actions.updateScreening('oab', true)}
          onNo={() => actions.updateScreening('oab', false)}
        />
      )}

      {/* IIEF screening — only for males, after OAB */}
      {sex === 'M' && (
        <ScrCard
          question="¿Ha notado cambios en la calidad de sus erecciones en los últimos 6 meses?"
          label="IIEF-5"
          value={s.iief}
          onYes={() => actions.updateScreening('iief', true)}
          onNo={() => actions.updateScreening('iief', false)}
        />
      )}

      {/* ICIQ — only for females */}
      {sex === 'F' && (
        <ScrCard
          question="¿Tiene pérdidas involuntarias de orina (al toser, estornudar, hacer ejercicio o sin motivo aparente)?"
          label="ICIQ-SF"
          value={s.iciq}
          onYes={() => actions.updateScreening('iciq', true)}
          onNo={() => actions.updateScreening('iciq', false)}
        />
      )}

      <button onClick={onNext} disabled={!canContinue}
        className="w-full text-white font-black py-4 rounded-xl text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        style={{ backgroundColor: RED }}>
        {canContinue ? 'Continuar → IPSS' : !sex ? 'Selecciona el sexo para empezar' : s.oab === null ? 'Responde las preguntas de cribado' : sex === 'M' && s.iief === null ? 'Responde también la pregunta de erección' : 'Completa el cribado'}
      </button>
    </div>
  );
}

function ScrCard({ question, label, value, onYes, onNo }: { question: string; label: string; value: boolean | null; onYes: () => void; onNo: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
      <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-full mb-3 ${value === true ? 'bg-emerald-100 text-emerald-700' : value === false ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-700'}`}>
        {value === true ? `✅ ${label} activado` : value === false ? `— ${label} no aplica` : label}
      </span>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{question}</p>
      <div className="flex gap-3">
        <button onClick={onYes} className={`flex-1 min-h-[48px] rounded-xl font-black text-base border-2 transition-all ${value === true ? 'bg-teal-700 border-teal-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-teal-300'}`}>Sí</button>
        <button onClick={onNo} className={`flex-1 min-h-[48px] rounded-xl font-black text-base border-2 transition-all ${value === false ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 text-slate-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>No</button>
      </div>
    </div>
  );
}

function ExpressIPSS({ data, actions, onNext }: { data: AppData; actions: ReturnType<typeof useAppData>; onNext: () => void }) {
  const sc = ipssScore(data.ipss);
  const comp = ipssComplete(data.ipss);
  const sev = ipssSeverity(sc);
  return (
    <div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
        <h3 className="font-black text-slate-800 dark:text-slate-100 text-base mb-1">📊 IPSS — Últimos 30 días</h3>
        <p className="text-xs text-slate-500 mb-5">Indica con qué frecuencia has tenido cada síntoma.</p>
        <div className="space-y-5">
          {IPSS_QUESTIONS.map((q, qi) => (
            <div key={qi} className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed"><span className="text-teal-600 font-black">{qi + 1}. </span>{q.t}</p>
              <div className="flex flex-wrap gap-2">
                {q.opts.map((o, oi) => (
                  <button key={oi} onClick={() => actions.updateIPSS(qi, oi)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all min-h-[40px] ${data.ipss.q[qi] === oi ? 'bg-teal-700 border-teal-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-teal-300'}`}>
                    {oi} — {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3"><span className="text-teal-600 font-black">8. </span>¿Cómo se sentiría si tuviera que vivir con estos síntomas el resto de su vida?</p>
            <div className="flex flex-wrap gap-2">
              {IPSS_QOL.map((o, i) => (
                <button key={i} onClick={() => actions.updateIPSSQoL(i)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all min-h-[40px] ${data.ipss.qol === i ? 'bg-teal-700 border-teal-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-teal-300'}`}>
                  {i} — {o}
                </button>
              ))}
            </div>
          </div>
        </div>
        {comp && (
          <div className="mt-5 text-center p-4 bg-teal-50 rounded-xl border border-teal-100">
            <div className="font-mono text-4xl font-black text-teal-700">{sc}<span className="text-base text-slate-400 font-normal">/35</span></div>
            <div className={`text-base font-black mt-1 ${sev.colorClass}`}>{sev.text} · {ipssPredom(data.ipss)}</div>
          </div>
        )}
      </div>
      <button onClick={onNext} disabled={!comp}
        className="w-full text-white font-black py-4 rounded-xl text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        style={{ backgroundColor: RED }}>
        {comp ? 'Siguiente →' : `Responde todas las preguntas (${data.ipss.q.filter((v) => v !== null).length + (data.ipss.qol !== null ? 1 : 0)}/8)`}
      </button>
    </div>
  );
}

function ExpressIIEF({ data, actions, onNext }: { data: AppData; actions: ReturnType<typeof useAppData>; onNext: () => void }) {
  const comp = data.iief.q.length === 5 && data.iief.q.every((v) => v !== null);
  const sc = comp ? iiefScore(data.iief) : 0;
  const sev = iiefSeverity(sc);
  return (
    <div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
        <h3 className="font-black text-slate-800 dark:text-slate-100 text-base mb-1">💊 IIEF-5 — Últimos 6 meses</h3>
        <p className="text-xs text-slate-500 mb-5">Función eréctil. Solo 5 preguntas.</p>
        <div className="space-y-5">
          {IIEF_QUESTIONS.map((q, qi) => (
            <div key={qi} className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed"><span className="text-sky-600 font-black">{qi + 1}. </span>{q.t}</p>
              <div className="flex flex-wrap gap-2">
                {q.opts.map((o, oi) => {
                  const isSel = data.iief.q[qi] !== null && data.iief.q[qi] === oi;
                  return (
                    <button key={oi} onClick={() => actions.updateIIEF(qi, oi)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all min-h-[40px] ${isSel ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-sky-300'}`}>
                      {oi} — {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {comp && (
          <div className="mt-5 text-center p-4 bg-sky-50 rounded-xl border border-sky-100">
            <div className="font-mono text-4xl font-black text-sky-600">{sc}<span className="text-base text-slate-400 font-normal">/25</span></div>
            <div className={`text-base font-black mt-1 ${sev.colorClass}`}>{sev.text}</div>
          </div>
        )}
      </div>
      <button onClick={onNext} disabled={!comp}
        className="w-full text-white font-black py-4 rounded-xl text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        style={{ backgroundColor: RED }}>
        {comp ? 'Siguiente →' : `Responde todas las preguntas (${data.iief.q.filter((v) => v !== null).length}/5)`}
      </button>
    </div>
  );
}

function ExpressOAB({ data, actions, onNext }: { data: AppData; actions: ReturnType<typeof useAppData>; onNext: () => void }) {
  const isComplete = data.oab.q.filter((v) => v !== null).length === OAB_QUESTIONS.length;
  return (
    <div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
        <h3 className="font-black text-slate-800 dark:text-slate-100 text-base mb-1">🚨 OAB — Vejiga Hiperactiva</h3>
        <p className="text-xs text-slate-500 mb-5">5 preguntas sobre síntomas del último mes.</p>
        <div className="space-y-5">
          {OAB_QUESTIONS.map((q, qi) => (
            <div key={qi} className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed"><span className="font-black" style={{ color: RED }}>{qi + 1}. </span>{q.t}</p>
              <div className="flex flex-wrap gap-2">
                {q.opts.map((o, oi) => (
                  <button key={oi} onClick={() => actions.updateOAB(qi, oi)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all min-h-[40px] ${data.oab.q[qi] === oi ? 'text-white border-transparent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-blue-300'}`}
                    style={data.oab.q[qi] === oi ? { backgroundColor: RED } : {}}>
                    {oi} — {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onNext} disabled={!isComplete}
        className="w-full text-white font-black py-4 rounded-xl text-base shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed"
        style={isComplete ? { backgroundColor: RED } : {}}>
        Continuar →
      </button>
    </div>
  );
}

function ExpressICIQ({ data, actions, onNext }: { data: AppData; actions: ReturnType<typeof useAppData>; onNext: () => void }) {
  const iciq = data.iciq;
  const comp = iciq.q[0] !== null && iciq.q[1] !== null;
  const sc = comp ? iciqScore(data) : 0;
  const sev = iciqSeverity(sc);
  return (
    <div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
        <h3 className="font-black text-slate-800 dark:text-slate-100 text-base mb-1">💧 ICIQ-SF — Incontinencia urinaria</h3>
        <p className="text-xs text-slate-500 mb-5">3 preguntas sobre pérdidas de orina.</p>
        <div className="space-y-5">
          <div className="pb-5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3"><span className="text-teal-600 font-black">1. </span>¿Con qué frecuencia pierde orina?</p>
            <div className="flex flex-wrap gap-2">
              {ICIQ_Q1_OPTS.map(({ v, t }) => (
                <button key={v} onClick={() => actions.updateICIQ(0, v)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all min-h-[40px] ${iciq.q[0] === v ? 'bg-teal-700 border-teal-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-teal-300'}`}>
                  {v} — {t}
                </button>
              ))}
            </div>
          </div>
          <div className="pb-5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3"><span className="text-teal-600 font-black">2. </span>¿Qué cantidad de orina pierde habitualmente?</p>
            <div className="flex flex-wrap gap-2">
              {ICIQ_Q2_OPTS.map(({ v, t }) => (
                <button key={v} onClick={() => actions.updateICIQ(1, v)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all min-h-[40px] ${iciq.q[1] === v ? 'bg-teal-700 border-teal-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-teal-300'}`}>
                  {v} — {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3"><span className="text-teal-600 font-black">3. </span>¿En qué medida afectan estas pérdidas a su vida diaria? <span className="text-slate-400">(0=nada · 10=mucho)</span></p>
            <div className="flex flex-wrap gap-2">
              {[0,1,2,3,4,5,6,7,8,9,10].map((v) => (
                <button key={v} onClick={() => actions.updateICIQVas(v)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold border-2 transition-all ${iciq.vas === v ? 'bg-teal-700 border-teal-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-teal-300'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
        {comp && (
          <div className="mt-5 text-center p-4 bg-teal-50 rounded-xl border border-teal-100">
            <div className="font-mono text-4xl font-black text-teal-700">{sc}<span className="text-base text-slate-400 font-normal">/21</span></div>
            <div className={`text-base font-black mt-1 ${sev.colorClass}`}>{sev.text}</div>
          </div>
        )}
      </div>
      <button onClick={onNext} disabled={!comp}
        className="w-full text-white font-black py-4 rounded-xl text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        style={{ backgroundColor: RED }}>
        {comp ? 'Ver Resultado →' : `Responde las preguntas 1 y 2 para continuar`}
      </button>
    </div>
  );
}

function ExpressResult({ data, elapsed, onSwitchHome }: { data: AppData; elapsed: number; onSwitchHome: () => void }) {
  const p = data.patient;
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  const hasIPSS = ipssComplete(data.ipss);
  const ipssVal = ipssScore(data.ipss);
  const ipssSev = ipssSeverity(ipssVal);
  const hasIIEF = data.screening.iief && data.iief.q.every((v) => v !== null);
  const iiefVal = iiefScore(data.iief);
  const iiefSev = iiefSeverity(iiefVal);
  const hasOAB = data.screening.oab && data.oab.q.every((v) => v !== null);
  const oabVal = oabScore(data);
  const hasICIQ = data.screening.iciq && data.iciq.q[0] !== null;
  const iciqVal = iciqScore(data);
  const iciqSev = iciqSeverity(iciqVal);
  const allPads = data.days.flatMap((d) => d.pads ?? []);
  const padTotal = +(allPads.reduce((s2, e) => s2 + e.leak, 0)).toFixed(1);
  const padSev = padSeverity(padTotal);
  const hasDiary = data.days.some((d) => d.entries.length > 0);
  const s = hasDiary ? computeStats(data) : null;

  const suggestions: string[] = [];
  if (hasIPSS) {
    if (ipssVal >= 20) suggestions.push(`IPSS grave (${ipssVal}/35): sintomatología obstructiva-irritativa grave. Predominio ${ipssPredom(data.ipss)}.`);
    else if (ipssVal >= 8) suggestions.push(`IPSS moderado (${ipssVal}/35): sintomatología de impacto clínico significativo. Predominio ${ipssPredom(data.ipss)}.`);
    else suggestions.push(`IPSS leve (${ipssVal}/35): sintomatología leve. Predominio ${ipssPredom(data.ipss)}.`);
    if (data.ipss.qol !== null && data.ipss.qol >= 4) suggestions.push(`Calidad de vida afectada (QoL ${data.ipss.qol}/6: ${IPSS_QOL[data.ipss.qol]}).`);
  }
  if (hasIIEF) {
    if (iiefVal <= 7) suggestions.push(`Disfunción eréctil severa (IIEF-5 ${iiefVal}/25).`);
    else if (iiefVal <= 11) suggestions.push(`Disfunción eréctil moderada (IIEF-5 ${iiefVal}/25).`);
    else if (iiefVal <= 16) suggestions.push(`Disfunción eréctil leve-moderada (IIEF-5 ${iiefVal}/25).`);
    else if (iiefVal <= 21) suggestions.push(`Disfunción eréctil leve (IIEF-5 ${iiefVal}/25).`);
    else suggestions.push(`Función eréctil conservada (IIEF-5 ${iiefVal}/25).`);
  }
  if (hasOAB) {
    if (data.oab.q[0] === 0) suggestions.push('Sin urgencia miccional (OAB-q pregunta 1 = 0).');
    else if (oabVal > 18) suggestions.push(`Síntomas de vejiga hiperactiva graves (OAB-q ${oabVal}/25).`);
    else if (oabVal > 10) suggestions.push(`Síntomas de vejiga hiperactiva moderados (OAB-q ${oabVal}/25).`);
    else suggestions.push(`Síntomas de vejiga hiperactiva leves (OAB-q ${oabVal}/25).`);
  }
  if (hasICIQ) {
    if (iciqVal === 0) suggestions.push('Sin incontinencia urinaria (ICIQ-SF 0/21).');
    else suggestions.push(`${iciqSev.text} (ICIQ-SF ${iciqVal}/21).`);
  }
  if (!suggestions.length) suggestions.push('Completa el IPSS y los cuestionarios para ver la interpretación de los resultados.');

  const note = generateClinicalNote(data);

  const scoreCards = [
    hasIPSS && { title: 'IPSS', val: ipssVal, max: '/35', sev: ipssSev, accent: 'teal', extra: `${ipssPredom(data.ipss)}${data.ipss.qol !== null ? ' · QoL: ' + IPSS_QOL[data.ipss.qol] : ''}` },
    s && { title: 'Diario', val: s.avgD, max: '/día', sev: { text: `CVF: ${s.maxV}ml`, colorClass: 'text-slate-600 dark:text-slate-400' }, accent: 'sky', extra: `Nocturia: ${s.avgN}/noche${s.npI !== null ? ` · IPN: ${s.npI}%` : ''}` },
    hasIIEF && { title: 'IIEF-5', val: iiefVal, max: '/25', sev: iiefSev, accent: 'sky', extra: null },
    hasOAB && { title: 'OAB-q', val: oabVal, max: '/25', sev: oabVal === 0 ? { text: 'Sin síntomas', colorClass: 'text-emerald-500' } : oabVal <= 10 ? { text: 'Leve', colorClass: 'text-sky-500' } : oabVal <= 18 ? { text: 'Moderado', colorClass: 'text-amber-500' } : { text: 'Grave', colorClass: 'text-red-500' }, accent: 'slate', extra: null },
    allPads.length > 0 && { title: 'Pad Test', val: `${padTotal}g`, max: '', sev: padSev, accent: 'slate', extra: `${allPads.length} absorbente(s)` },
    hasICIQ && { title: 'ICIQ-SF', val: iciqVal, max: '/21', sev: iciqSev, accent: 'teal', extra: null },
  ].filter(Boolean) as Array<{ title: string; val: number | string; max: string; sev: { text: string; colorClass: string }; accent: string; extra: string | null }>;

  const accentMap: Record<string, string> = {
    teal: 'border-teal-500',
    sky: 'border-sky-500',
    slate: 'border-slate-500',
  };

  const handlePrint = () => {
    const fecha = new Date().toLocaleDateString('es-ES');
    const scoreRows = [
      hasIPSS ? `<tr><td><b>IPSS</b></td><td>${ipssVal}/35</td><td>${ipssSev.text}</td><td>Predominio: ${ipssPredom(data.ipss)}${data.ipss.qol !== null ? ' | QoL: ' + data.ipss.qol + '/6' : ''}</td></tr>` : '',
      s ? `<tr><td><b>Diario miccional</b></td><td>${s.n} días</td><td>CVF ${s.maxV}ml · IPN ${s.npI !== null ? s.npI + '%' : 'n/d'}</td><td>Nocturia ${s.avgN}/noche · IUU ${s.ul} ep.</td></tr>` : '',
      hasIIEF ? `<tr><td><b>IIEF-5</b></td><td>${iiefVal}/25</td><td>${iiefSev.text}</td><td></td></tr>` : '',
      hasOAB ? `<tr><td><b>OAB-q</b></td><td>${oabVal}/25</td><td>${oabVal === 0 ? 'Sin síntomas' : oabVal <= 10 ? 'Leve' : oabVal <= 18 ? 'Moderado' : 'Grave'}</td><td></td></tr>` : '',
      allPads.length > 0 ? `<tr><td><b>Pad Test</b></td><td>${padTotal}g</td><td>${padSev.text}</td><td>${allPads.length} absorbente(s)</td></tr>` : '',
      hasICIQ ? `<tr><td><b>ICIQ-SF</b></td><td>${iciqVal}/21</td><td>${iciqSev.text}</td><td></td></tr>` : '',
    ].filter(Boolean).join('');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Informe STUI — ${p.name || 'Paciente'}</title>
<style>
body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1a1a1a;font-size:14px}
h1{color:#4052D6;font-size:22px;margin-bottom:4px}.sub{color:#666;font-size:13px;margin-bottom:24px}
h2{color:#3040b0;font-size:15px;border-bottom:2px solid #a5b4fc;padding-bottom:6px;margin:24px 0 12px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#eef0ff;padding:8px 10px;text-align:left;font-size:11px;color:#475569;border-bottom:2px solid #a5b4fc;text-transform:uppercase}
td{padding:8px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
.algo{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:16px}
.algo h3{color:#92400e;font-size:14px;margin:0 0 10px}
.algo li{color:#78350f;margin-bottom:6px;line-height:1.5}
.note{background:#eef0ff;border:1px solid #a5b4fc;border-radius:8px;padding:14px;font-family:monospace;font-size:12px;white-space:pre-wrap;line-height:1.8}
.footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
@media print{body{margin:20px auto}}
</style></head><body>
<h1>Resumen Clínico STUI — Modo Exprés</h1>
<div class="sub">Paciente: <b>${p.name || '—'}</b>${p.age ? ' · ' + p.age : ''}${p.sex ? ' · ' + (p.sex === 'M' ? 'Varón' : 'Mujer') : ''} &nbsp;|&nbsp; Duración: ${min}:${sec < 10 ? '0' : ''}${sec} &nbsp;|&nbsp; Fecha: ${fecha}</div>
<h2>Puntuaciones</h2>
<table><thead><tr><th>Cuestionario</th><th>Puntuación</th><th>Severidad</th><th>Notas</th></tr></thead><tbody>${scoreRows || '<tr><td colspan="4" style="color:#94a3b8">Sin datos suficientes</td></tr>'}</tbody></table>
${suggestions.length ? `<div class="algo"><h3>📊 Interpretación de resultados</h3><ul>${suggestions.map((sg) => `<li>${sg}</li>`).join('')}</ul></div>` : ''}
${data.notes?.length ? `<h2>💬 Notas del Paciente para el Médico</h2>${data.notes.map((n) => `<div style="background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:12px;margin-bottom:8px;font-size:13px;color:#4c1d95;line-height:1.7"><div style="font-size:11px;color:#9333ea;margin-bottom:4px">${new Date(n.date).toLocaleString('es-ES')}</div><div style="white-space:pre-wrap">${n.text}</div></div>`).join('')}` : ''}
<h2>Nota para Historia Clínica</h2>
<div class="note">${note}</div>
<div class="footer">Generado con STUI App · Oficina de Salud Digital · AEU · ${fecha}</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (w) { w.document.write(html); w.document.close(); }
    else alert('Tu navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio.');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${RED}, #2030a0)` }}>
        <div className="text-lg font-black">{p.name || 'Paciente'}</div>
        <div className="text-sm text-white/80 mt-1">
          {[p.sex ? (p.sex === 'M' ? '♂ Varón' : '♀ Mujer') : null, `${min}:${sec < 10 ? '0' : ''}${sec} min`].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* Score cards */}
      {scoreCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {scoreCards.map((c) => (
            <div key={c.title} className={`bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 border-t-4 ${accentMap[c.accent]}`}>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{c.title}</div>
              <div className="font-mono text-3xl font-black text-slate-800 dark:text-slate-100">{c.val}<span className="text-sm text-slate-400 font-normal">{c.max}</span></div>
              <div className={`text-xs font-black mt-1 ${c.sev.colorClass}`}>{c.sev.text}</div>
              {c.extra && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">{c.extra}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Interpretation */}
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-2xl p-5">
        <h3 className="font-black text-sky-800 dark:text-sky-300 text-sm mb-3">📊 Interpretación de resultados</h3>
        <div className="space-y-2">
          {suggestions.map((sg, i) => (
            <div key={i} className="flex gap-2 text-sm text-sky-800 dark:text-sky-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
              {sg}
            </div>
          ))}
        </div>
      </div>

      {/* Clinical note */}
      <div>
        <h3 className="font-black text-slate-700 dark:text-slate-300 text-sm mb-3 flex items-center gap-2">
          <span className="w-px h-4 bg-blue-400" />
          Nota para Historia Clínica
        </h3>
        <pre className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">
          {note}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <button onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 text-white font-black py-4 rounded-2xl text-sm shadow-lg active:scale-[0.98] transition-all min-h-[56px]"
          style={{ backgroundColor: RED }}>
          <Printer size={18} />
          Generar PDF para el urólogo
        </button>
        <button onClick={onSwitchHome}
          className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-4 px-5 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all min-h-[56px]">
          <Home size={18} />
        </button>
      </div>
    </div>
  );
}
