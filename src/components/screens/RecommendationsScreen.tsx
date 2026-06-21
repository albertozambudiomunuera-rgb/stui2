import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

/* ─── Kegel infographic (light background) ───────────────────── */
function KegeiInfographic() {
  const exercises = [
    { n: 1, emoji: '🧍', pos: 'De pie', text: 'Piernas bien separadas, manos en glúteos para asegurarte de que no los usas. Tensa el suelo pélvico hacia arriba y hacia adentro.' },
    { n: 2, emoji: '🪑', pos: 'Sentado', text: 'Sin apoyar la espalda. Curva la columna ligeramente hacia adentro y contrae el suelo pélvico. Vigila la respiración.' },
    { n: 3, emoji: '🏋️', pos: 'De pie (rodillas flex.)', text: 'Rodillas flexionadas, brazos apoyados en muslos. Presiona los músculos del suelo pélvico hacia arriba y adentro.' },
    { n: 4, emoji: '🪑', pos: 'Sentado con resistencia', text: 'En silla, separa las piernas con un cojín entre ellas. Contrae los músculos de la pelvis como si aguantaras la orina.' },
    { n: 5, emoji: '🤸', pos: 'Sentado/Tumbado', text: 'Cruza las piernas y aprieta las partes externas de los pies una contra otra. Ajusta la respiración.' },
    { n: 6, emoji: '🧘', pos: 'Sentado en suelo', text: 'Piernas cruzadas, espalda recta. Tira hacia arriba del suelo pélvico separándolo del suelo. Respira correctamente.' },
  ];

  return (
    <div className="space-y-4">
      {/* What is pelvic floor */}
      <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
        <h3 className="font-black text-teal-800 text-sm mb-2">¿Qué es el suelo pélvico?</h3>
        <p className="text-xs text-teal-700 leading-relaxed">
          Conjunto de músculos en la parte inferior de la pelvis que rodean la uretra, la vagina, el ano y el recto.
          Son los encargados de mantener el control sobre estos orificios.
          Cuando se debilitan, pueden aparecer <strong>pérdidas de orina</strong>.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['Vejiga', 'Uretra', 'Recto', 'Ano', 'Vagina', 'Esfínteres'].map((s) => (
            <div key={s} className="bg-white rounded-xl px-2 py-1.5 text-[10px] font-semibold text-teal-700 border border-teal-100 text-center">{s}</div>
          ))}
        </div>
      </div>

      {/* Identification */}
      <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
        <p className="text-xs font-black text-rose-700 mb-1">¿Cómo identificar el músculo?</p>
        <p className="text-xs text-rose-700 leading-relaxed">
          Imagina que intentas <strong>cortar el flujo de orina</strong> o detener un gas.
          Ese es el músculo correcto. <strong>No contraigas abdomen, glúteos ni muslos.</strong>
        </p>
      </div>

      {/* Preparation */}
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="bg-rose-700 px-4 py-2">
          <span className="text-xs font-black text-white uppercase tracking-widest">Preparación</span>
        </div>
        <div className="bg-rose-50 px-4 py-3 space-y-2">
          <p className="text-xs text-rose-800 leading-relaxed">Relaja el suelo pélvico <strong>3-4 minutos</strong> antes con respiraciones profundas por la nariz y expulsión lenta por la boca.</p>
          <div className="grid gap-2 mt-1">
            <div className="bg-white rounded-xl p-3 border border-rose-100 flex gap-2.5 items-start">
              <span className="text-xl flex-shrink-0 mt-0.5">🧎</span>
              <span className="text-xs text-slate-700 leading-relaxed">Arrodíllate con el cuerpo inclinado hacia adelante, antebrazos en el suelo y cabeza entre las manos.</span>
            </div>
            <div className="bg-white rounded-xl p-3 border border-rose-100 flex gap-2.5 items-start">
              <span className="text-xl flex-shrink-0 mt-0.5">🛋️</span>
              <span className="text-xs text-slate-700 leading-relaxed">Tumbado en el suelo con piernas sobre una silla y cojín bajo la pelvis.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="bg-amber-600 px-4 py-2">
          <span className="text-xs font-black text-white uppercase tracking-widest">Normas</span>
        </div>
        <div className="bg-amber-50 px-4 py-3 grid grid-cols-2 gap-3">
          {[
            { icon: '⏱️', text: '5 s contracción → 10 s relajación' },
            { icon: '🔄', text: 'Repite 5 veces cada ejercicio' },
            { icon: '🫁', text: 'Respira durante todo el ejercicio' },
            { icon: '📋', text: 'Tabla completa 5-10 veces/día' },
          ].map((n) => (
            <div key={n.text} className="flex gap-2 items-start">
              <span className="flex-shrink-0 text-lg leading-none">{n.icon}</span>
              <span className="text-xs text-amber-900 leading-snug">{n.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exercises */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Ejercicios</p>
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div key={ex.n} className="flex gap-3 items-start bg-teal-50 rounded-2xl p-3 border border-teal-100">
              <div className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-dashed border-teal-500 flex items-center justify-center bg-white">
                <span className="text-sm font-black text-teal-600">{ex.n}</span>
              </div>
              <div className="flex gap-2 items-start min-w-0">
                <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{ex.emoji}</span>
                <div>
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-wider mb-0.5">{ex.pos}</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{ex.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-teal-700 rounded-2xl px-4 py-3 text-center">
        <p className="text-xs text-white font-semibold leading-relaxed">
          Los cambios son visibles a partir de <strong>6-8 semanas</strong> de práctica diaria.
          Deben formar parte del tratamiento pautado por tu médico.
        </p>
      </div>
    </div>
  );
}

/* ─── Block content renderers ────────────────────────────────── */
function Block1() {
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 border-l-4 border-l-blue-500">
        <p className="text-xs font-black text-blue-800 leading-relaxed">
          No se trata de beber menos agua, sino de saber <em>cuándo</em> y <em>qué</em> beber.
          Tu médico evaluará tu caso con el Diario Miccional.
        </p>
      </div>
      {[
        { icon: '⏰', title: 'Regula los horarios', text: 'Si sufres nocturia o tienes un evento importante, reduce la ingesta de líquidos 2 horas antes.' },
        { icon: '☕', title: 'Identifica los irritantes vesicales', text: 'La cafeína (café, té, cola) y el alcohol actúan como diuréticos directos e irritan el músculo de la vejiga, disparando la urgencia. Redúcelos progresivamente.' },
        { icon: '💧', title: 'No cortes el agua de golpe', text: 'La orina muy concentrada irrita aún más la vejiga e incrementa el riesgo de infección. Bebe lo suficiente para no tener sed.' },
      ].map((item) => (
        <div key={item.icon} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-3 items-start">
          <span className="text-2xl flex-shrink-0">{item.icon}</span>
          <div>
            <p className="font-black text-slate-800 text-xs mb-1">{item.title}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Block2() {
  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 border-l-4 border-l-emerald-500">
        <p className="text-xs font-black text-emerald-800">Lo que afecta a tu abdomen, afecta a tu vejiga.</p>
      </div>
      {[
        { icon: '⚖️', title: 'Controla el sobrepeso', text: 'El exceso de peso genera presión intraabdominal continua sobre el suelo pélvico y la vejiga, favoreciendo las pérdidas de orina. Perder peso reduce mecánicamente esta presión.' },
        { icon: '🥗', title: 'Evita el estreñimiento', text: 'Un recto lleno e impactado presiona directamente la base de la vejiga, impidiendo que se llene o vacíe correctamente. Mantén una dieta rica en fibra.' },
        { icon: '🚭', title: 'Deja el tabaco', text: 'El tabaquismo está fuertemente vinculado con el empeoramiento de la urgencia y la frecuencia urinaria.' },
      ].map((item) => (
        <div key={item.icon} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-3 items-start">
          <span className="text-2xl flex-shrink-0">{item.icon}</span>
          <div>
            <p className="font-black text-slate-800 text-xs mb-1">{item.title}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Block3() {
  return (
    <div className="space-y-3">
      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 border-l-4 border-l-indigo-500">
        <p className="text-xs font-black text-indigo-800 leading-relaxed">
          Cuando sufres de Vejiga Hiperactiva, el cerebro y la vejiga pierden la coordinación.
          El objetivo es recuperar el control de tu mente sobre el reflejo de orinar.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex gap-2 items-center mb-2">
          <span className="text-xl">🗓️</span>
          <p className="font-black text-slate-800 text-xs">Entrenamiento Vesical</p>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Programa tus visitas al baño con intervalos fijos (p. ej. cada 2 horas) e increméntalos poco a poco,
          <strong> incluso si no tienes ganas</strong>. Esto ayuda a romper el hábito de ir «por si acaso»
          y aumenta la capacidad real de la vejiga.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex gap-2 items-center mb-2">
          <span className="text-xl">🛑</span>
          <p className="font-black text-slate-800 text-xs">Técnicas ante la Urgencia</p>
        </div>
        <p className="text-xs text-slate-500 mb-3">Cuando sientas unas ganas súbitas, <strong>no corras al baño</strong>. Detente y aplica:</p>
        <div className="space-y-2">
          {[
            { icon: '🧮', text: 'Distracción cognitiva: cuenta hacia atrás de 3 en 3 desde 100, o planifica tu agenda semanal.' },
            { icon: '🤏', text: 'Presión en el periné (zona entre genitales y ano) o en la base del pene (hombres): activa un reflejo que relaja la vejiga.' },
            { icon: '🫁', text: '5 respiraciones profundas y lentas hasta que la urgencia disminuya. Luego camina tranquilamente al baño.' },
          ].map((b) => (
            <div key={b.icon} className="flex gap-2.5 items-start bg-indigo-50 rounded-xl p-2.5 border border-indigo-100">
              <span className="text-base flex-shrink-0">{b.icon}</span>
              <p className="text-xs text-indigo-800 leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Block5() {
  return (
    <div className="space-y-3">
      <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 border-l-4 border-l-sky-500">
        <p className="text-xs font-black text-sky-800">Si sientes vaciado incompleto o goteo postmiccional, aplica estas técnicas:</p>
      </div>
      {[
        {
          icon: '🔄',
          title: 'Doble Micción (Double Voiding)',
          text: 'Al terminar de orinar, no te levantes inmediatamente. Espera 20-30 segundos en postura relajada, inclina el tronco ligeramente hacia adelante e inténtalo de nuevo. Ayuda a evacuar el residuo de orina.',
        },
        {
          icon: '👆',
          title: 'Ordeño Uretral (solo hombres)',
          text: 'Para evitar el goteo postmiccional que mancha la ropa: introduce los dedos detrás del escroto tras orinar y presiona suavemente hacia adelante y hacia arriba, siguiendo el recorrido de la uretra hasta la punta del pene.',
        },
      ].map((item) => (
        <div key={item.icon} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-3 items-start">
          <span className="text-2xl flex-shrink-0">{item.icon}</span>
          <div>
            <p className="font-black text-slate-800 text-xs mb-1">{item.title}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Block6() {
  return (
    <div className="space-y-3">
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 border-l-4 border-l-amber-500">
        <div className="flex gap-2 items-start">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <p className="text-xs font-black text-amber-800 leading-relaxed">
            Nunca suspendas un tratamiento por tu cuenta.
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-3 items-start">
        <span className="text-2xl flex-shrink-0">💊</span>
        <div>
          <p className="font-black text-slate-800 text-xs mb-1">Optimiza los horarios con tu médico</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Muchos fármacos esenciales, especialmente los <strong>diuréticos para la tensión arterial</strong>,
            aumentan la producción de orina. Consulta con tu médico la posibilidad de tomarlos
            a <strong>primera hora de la mañana</strong> para mejorar tus noches.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab configuration ──────────────────────────────────────── */
const TABS = [
  { id: 'liquidos',     icon: '💧', short: 'Líquidos',   title: 'Control de Líquidos y Alimentación',          content: <Block1 /> },
  { id: 'estilo',       icon: '⚖️', short: 'Estilo',     title: 'Peso, Tabaco y Hábito Intestinal',             content: <Block2 /> },
  { id: 'reeducacion',  icon: '🧠', short: 'Urgencia',   title: 'Reeducación Vesical y Control de la Urgencia', content: <Block3 /> },
  { id: 'kegel',        icon: '💪', short: 'Kegel',      title: 'Ejercicios de Kegel · Suelo Pélvico',         content: <KegeiInfographic /> },
  { id: 'vaciado',      icon: '🚿', short: 'Vaciado',    title: 'Técnicas de Vaciado en el Baño',              content: <Block5 /> },
  { id: 'medicacion',   icon: '💊', short: 'Medicación', title: 'Revisión de Medicamentos Habituales',          content: <Block6 /> },
];

const ALARM = ['hematuria (sangre en orina)', 'dolor agudo al orinar', 'fiebre', 'empeoramiento rápido'];

/* ─── Main component ─────────────────────────────────────────── */
export function RecommendationsScreen({ onClose }: Props) {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-700 to-teal-900 flex-shrink-0">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-3 mb-3">
            <img src="/Logo-AEU-Corporativo.png" alt="AEU" className="h-8 flex-shrink-0 object-contain" />
            <div className="flex-1 min-w-0">
              <div className="font-black text-white text-sm leading-tight">Escuela de Salud Vesical</div>
              <div className="text-teal-300 text-[10px] mt-0.5">Guías clínicas AEU 2026</div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-xl flex-shrink-0">
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Tab nav */}
          <nav className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap min-h-[44px] flex-shrink-0 transition-all ${
                  active === i
                    ? 'bg-white text-teal-700'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.short}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Block title */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <h2 className="font-black text-slate-800 text-sm leading-snug">
          {tab.icon} {tab.title}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-6 max-w-2xl mx-auto w-full">
        {tab.content}

        {/* Alarm footer */}
        <div className="mt-5 bg-red-50 rounded-2xl p-3 border border-red-100 flex gap-2">
          <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-700 leading-relaxed">
            <span className="font-black">Síntomas de alarma: </span>
            {ALARM.join(', ')}. Si aparece alguno, solicita consulta urológica prioritaria.
          </p>
        </div>
      </div>
    </div>
  );
}
