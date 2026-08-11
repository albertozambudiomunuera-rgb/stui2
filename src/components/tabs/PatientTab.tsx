import { useRef, useState } from 'react';
import { User, Info, HardDrive, Download, Upload, Trash2, Shield, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppData } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { exportBackup, importBackup, emptyData } from '../../lib/storage';

interface PatientTabProps {
  data: AppData;
  actions: ReturnType<typeof useAppData>;
  idbActive: boolean;
  onToast: (msg: string) => void;
  onNext: () => void;
  onBackToEntry?: () => void;
  /** false si la app no está instalada como PWA (riesgo de perder datos). */
  installed?: boolean;
  /** Reabre el aviso de instalación a pantalla completa (ya visto una vez, ahora bajo demanda). */
  onOpenInstallHelp?: () => void;
}

export function PatientTab({ data, actions, idbActive, onToast, onNext, onBackToEntry, installed, onOpenInstallHelp }: PatientTabProps) {
  const p = data.patient;
  const fileRef = useRef<HTMLInputElement>(null);
  // Colapsados por defecto: son secciones informativas/de mantenimiento que
  // distraían de lo importante (rellenar datos y continuar) y con las que
  // los pacientes mayores se "tropezaban" al bajar por la pantalla.
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const handleExport = () => {
    exportBackup(data);
    onToast('Backup descargado');
  };

  const handleImport = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const restored = await importBackup(file);
      actions.restoreData(restored);
      onToast('Datos restaurados correctamente');
    } catch (err) {
      alert('Error al leer el archivo: ' + (err as Error).message);
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('¿Borrar todos los datos? Esta acción no se puede deshacer.')) {
      actions.resetData(emptyData);
      onToast('Datos borrados');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />

      {onBackToEntry && (
        <div className="flex justify-end">
          <button
            onClick={onBackToEntry}
            className="flex items-center gap-1.5 pl-3 pr-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Cambiar modo (Casa vs Sala de Espera)"
          >
            <ArrowLeft size={14} />
            Cambiar modo
          </button>
        </div>
      )}

      {/* Recordatorio pequeño y no bloqueante — el aviso a pantalla completa
          solo sale una vez; a partir de ahí, si sigue sin instalarse, basta
          con este aviso discreto y reabrible, no una interrupción cada vez. */}
      {installed === false && onOpenInstallHelp && (
        <button
          onClick={onOpenInstallHelp}
          className="w-full flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <span className="flex-1 text-sm text-amber-800 dark:text-amber-400 leading-snug">
            ¿Tienes la app instalada? Si no, tus datos podrían perderse — toca para ver cómo instalarla.
          </span>
        </button>
      )}

      {/* Patient data card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-slate-100 text-base mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center">
            <User size={16} className="text-teal-700 dark:text-teal-400" />
          </div>
          Datos del paciente
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={p.name}
              placeholder="María García López"
              onChange={(e) => actions.updatePatient('name', e.target.value)}
              className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Edad</label>
              <input
                type="text"
                value={p.age}
                placeholder="58 años"
                onChange={(e) => actions.updatePatient('age', e.target.value)}
                className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Sexo biológico</label>
              <select
                value={p.sex}
                onChange={(e) => actions.updatePatient('sex', e.target.value)}
                className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors"
              >
                <option value="">— Seleccionar —</option>
                <option value="M">Varón</option>
                <option value="F">Mujer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Peso (kg, opcional)</label>
              <input
                type="text"
                inputMode="decimal"
                value={p.weight}
                placeholder="70"
                onChange={(e) => actions.updatePatient('weight', e.target.value)}
                className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 -mt-2">El peso se usa para expresar el volumen del día registrado en ml/kg (referencia: 40 ml/kg). Sin peso, ese cálculo no es posible.</p>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Medicación vesical (opcional)</label>
            <input
              type="text"
              value={p.med}
              placeholder="ej. solifenacina 5mg"
              onChange={(e) => actions.updatePatient('med', e.target.value)}
              className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Café / día (opcional)</label>
              <input
                type="text"
                inputMode="numeric"
                value={p.coffeePerDay}
                placeholder="ej. 2 tazas"
                onChange={(e) => actions.updatePatient('coffeePerDay', e.target.value)}
                className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Cola / día (opcional)</label>
              <input
                type="text"
                inputMode="numeric"
                value={p.colaPerDay}
                placeholder="ej. 1 lata"
                onChange={(e) => actions.updatePatient('colaPerDay', e.target.value)}
                className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">¿Fuma? (opcional)</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => actions.updatePatient('smoker', 'no')}
                className={`flex-1 py-3 rounded-xl text-base font-bold border-2 transition-all ${
                  p.smoker === 'no'
                    ? 'bg-teal-700 border-teal-700 text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => actions.updatePatient('smoker', 'yes')}
                className={`flex-1 py-3 rounded-xl text-base font-bold border-2 transition-all ${
                  p.smoker === 'yes'
                    ? 'bg-teal-700 border-teal-700 text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Sí
              </button>
            </div>
          </div>
          {p.smoker === 'yes' && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Cigarrillos / día aprox.</label>
              <input
                type="text"
                inputMode="numeric"
                value={p.cigarettesPerDay}
                placeholder="ej. 10"
                onChange={(e) => actions.updatePatient('cigarettesPerDay', e.target.value)}
                className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg shadow-teal-700/25"
      >
        Continuar → Cribado
      </button>

      {/* How it works — desplegable, colapsado por defecto para no distraer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHowItWorks((v) => !v)}
          className="w-full flex items-center justify-between gap-2 p-5 text-left"
        >
          <span className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info size={16} className="text-teal-700 dark:text-teal-400" />
            </div>
            ¿Quieres saber cómo funciona la app?
          </span>
          {showHowItWorks ? <ChevronUp size={18} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-500 flex-shrink-0" />}
        </button>
        {showHowItWorks && (
          <div className="px-5 pb-5 space-y-3">
            {[
              { e: '📋', t: 'Cribado', d: '3 preguntas rápidas que activan los cuestionarios que necesitas' },
              { e: '📊', t: 'Cuestionarios', d: 'IPSS y, si aplica, IIEF-5, OAB e ICIQ-SF' },
              { e: '🗓️', t: 'Diario miccional', d: '3 días de registro (micción + bebidas), al final' },
              { e: '🏥', t: 'Informe', d: 'Resumen PDF listo para la consulta' },
            ].map((item) => (
              <div key={item.t} className="flex gap-3 items-start p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <span className="text-lg flex-shrink-0">{item.e}</span>
                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-700 dark:text-slate-300">{item.t}:</strong> {item.d}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup panel — desplegable, más discreto que el botón de Continuar */}
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBackup((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-slate-500 dark:text-slate-400"
        >
          <span className="text-sm font-bold flex items-center gap-1.5">
            <HardDrive size={14} />
            Datos y copia de seguridad
          </span>
          {showBackup ? <ChevronUp size={15} className="flex-shrink-0" /> : <ChevronDown size={15} className="flex-shrink-0" />}
        </button>
        {showBackup && (
          <div className="px-4 pb-4">
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-3 ${idbActive ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
              <Shield size={12} />
              {idbActive ? 'IndexedDB activo — RGPD compliant' : 'localStorage (limitado)'}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Tus datos se guardan automáticamente. Haz una copia antes de cambiar de navegador o dispositivo.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleExport} className="flex flex-col items-center gap-1.5 p-3 bg-teal-700 text-white rounded-xl font-bold text-xs min-h-[72px] hover:bg-teal-800 active:scale-95 transition-all shadow-md shadow-teal-700/25">
                <Download size={20} />
                Descargar backup
              </button>
              <button onClick={handleImport} className="flex flex-col items-center gap-1.5 p-3 bg-sky-600 text-white rounded-xl font-bold text-xs min-h-[72px] hover:bg-sky-700 active:scale-95 transition-all shadow-md shadow-sky-600/25">
                <Upload size={20} />
                Restaurar backup
              </button>
              <button onClick={handleReset} className="flex flex-col items-center gap-1.5 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs min-h-[72px] hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 transition-all border border-rose-100 dark:border-rose-800">
                <Trash2 size={20} />
                Borrar datos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
