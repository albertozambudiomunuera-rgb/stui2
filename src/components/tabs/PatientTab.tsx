import { useRef } from 'react';
import { User, Info, HardDrive, Download, Upload, Trash2, Shield } from 'lucide-react';
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
}

export function PatientTab({ data, actions, idbActive, onToast, onNext, onBackToEntry }: PatientTabProps) {
  const p = data.patient;
  const fileRef = useRef<HTMLInputElement>(null);

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
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={p.name}
              placeholder="María García López"
              onChange={(e) => actions.updatePatient('name', e.target.value)}
              className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Edad</label>
              <input
                type="text"
                value={p.age}
                placeholder="58 años"
                onChange={(e) => actions.updatePatient('age', e.target.value)}
                className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Sexo biológico</label>
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
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Medicación vesical (opcional)</label>
            <input
              type="text"
              value={p.med}
              placeholder="ej. solifenacina 5mg"
              onChange={(e) => actions.updatePatient('med', e.target.value)}
              className="w-full border-2 border-teal-100 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:border-teal-500 focus:outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-slate-100 text-base mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center">
            <Info size={16} className="text-teal-700 dark:text-teal-400" />
          </div>
          Cómo funciona esta app
        </h2>
        <div className="space-y-3">
          {[
            { e: '📋', t: 'Cribado', d: '3 preguntas rápidas que activan los cuestionarios que necesitas' },
            { e: '🗓️', t: 'Diario miccional', d: '3 días de registro (micción + bebidas)' },
            { e: '📊', t: 'IPSS', d: 'Puntuación internacional de síntomas prostáticos' },
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
      </div>

      {/* Backup panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="font-black text-slate-800 dark:text-slate-100 text-base mb-3 flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center">
            <HardDrive size={16} className="text-teal-700 dark:text-teal-400" />
          </div>
          Datos y copia de seguridad
        </h2>
        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-3 ${idbActive ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
          <Shield size={12} />
          {idbActive ? 'IndexedDB activo — RGPD compliant' : 'localStorage (limitado)'}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
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

      <button
        onClick={onNext}
        className="w-full bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg shadow-teal-700/25"
      >
        Continuar → Cribado
      </button>

      {onBackToEntry && (
        <button
          onClick={onBackToEntry}
          className="w-full mt-2 border-2 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 font-bold py-3 rounded-2xl text-sm hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
        >
          ← Cambiar modo (Casa vs Sala de Espera)
        </button>
      )}
    </div>
  );
}
