import { Home, Building2, MessageSquareHeart } from 'lucide-react';
import { RecommendationsSection } from '../ui/RecommendationsSection';

interface EntryScreenProps {
  onChoose: (mode: 'home' | 'express') => void;
  notes: string;
  onNotesChange: (val: string) => void;
}

export function EntryScreen({ onChoose, notes, onNotesChange }: EntryScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-700 via-teal-800 to-teal-900 flex flex-col items-center justify-center p-6">
      {/* Logo + Welcome */}
      <div className="text-center mb-12 animate-fade-in">
        <img
          src="/Logo-AEU-Corporativo.png"
          alt="AEU"
          className="h-20 mx-auto mb-6 object-contain drop-shadow-lg"
        />
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          STUI App
        </h1>
        <p className="text-sm text-teal-100 font-semibold">
          Asociación Española de Urología
        </p>
      </div>

      {/* Main message */}
      <div className="w-full max-w-md mb-8 text-center">
        <h2 className="text-2xl font-black text-white mb-3">
          Bienvenido a tu Evaluación Urinaria
        </h2>
        <p className="text-sm text-teal-100 leading-relaxed">
          Selecciona tu situación actual para personalizar tu experiencia
        </p>
      </div>

      {/* Data storage info banner */}
      <div className="w-full max-w-md mb-10 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="flex items-start gap-2">
          <span className="text-xl flex-shrink-0 mt-0.5">🔒</span>
          <div className="text-left">
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              Privacidad Garantizada (RGPD)
            </p>
            <p className="text-xs text-teal-100 leading-relaxed">
              Todos tus datos se guardan <strong>solo en tu dispositivo</strong> mediante IndexedDB. Nada se envía a servidores externos.
            </p>
          </div>
        </div>
      </div>

      {/* Choice buttons */}
      <div className="w-full max-w-md space-y-4 mb-8">
        {/* Option A: Home */}
        <button
          onClick={() => onChoose('home')}
          className="w-full bg-white dark:bg-slate-100 rounded-2xl p-5 text-left shadow-2xl shadow-black/30 hover:shadow-2xl hover:shadow-black/40 active:scale-[0.97] transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-active:scale-90 transition-transform">
              <Home size={28} className="text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg text-slate-800 mb-1">
                🏠 Voy a preparar mi consulta
              </div>
              <div className="text-sm text-slate-600 leading-relaxed mb-3">
                Tengo mi cita en unos días. Quiero empezar el Diario Miccional de 3 días y todos los cuestionarios médicos.
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-full">
                <span>⏱️</span> Flujo completo · ~15 min/día
              </span>
            </div>
          </div>
        </button>

        {/* Option B: Express */}
        <button
          onClick={() => onChoose('express')}
          className="w-full bg-white dark:bg-slate-100 rounded-2xl p-5 text-left shadow-2xl shadow-black/30 hover:shadow-2xl hover:shadow-black/40 active:scale-[0.97] transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-active:scale-90 transition-transform">
              <Building2 size={28} className="text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg text-slate-800 mb-1">
                🏥 Estoy hoy en la Sala de Espera
              </div>
              <div className="text-sm text-slate-600 leading-relaxed mb-3">
                Tengo la consulta hoy mismo y no he rellenado nada. Solo los cuestionarios esenciales, rápido.
              </div>
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-black px-3 py-1.5 rounded-full">
                <span>⚡</span> Plan Rápido · ~3 minutos
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Recomendaciones + Mis Notas */}
      <div className="w-full max-w-md space-y-3 mb-6">
        {/* Recomendaciones */}
        <RecommendationsSection />

        {/* Mis notas para el médico */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquareHeart size={16} className="text-teal-200 flex-shrink-0" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Mis notas para el médico</span>
          </div>
          <p className="text-xs text-teal-200 mb-2 leading-relaxed">
            Escribe aquí tus dudas, miedos o lo que no quieres olvidar contarle al médico.
          </p>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Ej: Me preocupa levantarme tantas veces por la noche, quiero preguntar si es normal…"
            rows={3}
            className="w-full bg-white/10 text-white placeholder-teal-300/60 text-xs rounded-xl p-3 border border-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-white/30 leading-relaxed"
          />
        </div>
      </div>

      {/* Bottom explanation */}
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-xs text-teal-200 leading-relaxed text-center">
            Rellena los formularios y guarda el resumen final para que el médico pueda verlo en la consulta.
          </p>
        </div>
      </div>

      <footer className="w-full max-w-md mt-8 text-center">
        <p className="text-xs text-teal-300/60">
          © 2026 Dr. Alberto Zambudio. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
