import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

/* ─── Kegel infographic ─────────────────────────────────────── */
function KegeiInfographic() {
  const exercises = [
    {
      n: 1,
      pos: '🧍',
      text: 'De pie con piernas bien separadas. Manos en glúteos para asegurarte de que no los usas. Tensa el suelo pélvico hacia arriba y hacia adentro.',
    },
    {
      n: 2,
      pos: '🪑',
      text: 'Sentado sin apoyar la espalda. Curva la columna ligeramente hacia adentro y contrae el suelo pélvico. Vigila la respiración.',
    },
    {
      n: 3,
      pos: '🏋️',
      text: 'De pie con rodillas flexionadas y brazos apoyados en los muslos. Presiona los músculos del suelo pélvico hacia arriba y adentro.',
    },
    {
      n: 4,
      pos: '🪑',
      text: 'Sentado en silla sin apoyar la espalda, con un cojín entre las piernas. Contrae los músculos de la pelvis como si aguantaras la orina.',
    },
    {
      n: 5,
      pos: '🤸',
      text: 'Sentado o tumbado, cruza las piernas y aprieta las partes externas de los pies una contra otra. Ajusta la respiración.',
    },
    {
      n: 6,
      pos: '🧘',
      text: 'Sentado con piernas cruzadas y espalda recta. Tira hacia arriba del suelo pélvico separándolo del suelo. Respira correctamente.',
    },
  ];

  return (
    <div className="space-y-3 text-xs">

      {/* Medical note */}
      <div className="border-l-2 border-teal-400 pl-2 text-white/80 italic leading-relaxed">
        Contraer el suelo pélvico envía una señal refleja a la vejiga para que se relaje.
        Imagina que cortas el flujo de orina. <strong className="text-white not-italic">No contraigas abdomen, glúteos ni muslos.</strong>
      </div>

      {/* PREPARACIÓN */}
      <div className="rounded-xl overflow-hidden border border-white/20">
        <div className="bg-rose-900/50 px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-black text-rose-200 uppercase tracking-widest">Preparación</span>
        </div>
        <div className="bg-white/5 px-3 py-2 space-y-1.5 text-teal-100 leading-relaxed">
          <p>Relaja el suelo pélvico <strong className="text-white">3-4 minutos</strong> antes de comenzar, con respiraciones profundas por la nariz y expulsión lenta por la boca.</p>
          <div className="flex gap-1.5 items-start">
            <span className="text-rose-300 flex-shrink-0 mt-0.5">→</span>
            <span>Arrodíllate con el cuerpo inclinado hacia adelante, antebrazos en el suelo y cabeza entre las manos.</span>
          </div>
          <div className="flex gap-1.5 items-start">
            <span className="text-rose-300 flex-shrink-0 mt-0.5">→</span>
            <span>Tumbado en el suelo con las piernas sobre una silla y un cojín bajo la pelvis.</span>
          </div>
        </div>
      </div>

      {/* NORMAS */}
      <div className="rounded-xl overflow-hidden border border-white/20">
        <div className="bg-amber-900/40 px-3 py-1.5">
          <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">Normas</span>
        </div>
        <div className="bg-white/5 px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-2">
          {[
            { icon: '⏱️', text: '5 s contracción · 10 s relajación' },
            { icon: '🔄', text: 'Repite 5 veces cada ejercicio' },
            { icon: '🫁', text: 'Respira durante todo el ejercicio' },
            { icon: '📋', text: 'Tabla completa 5-10 veces/día' },
          ].map((n) => (
            <div key={n.text} className="flex gap-1.5 items-start">
              <span className="flex-shrink-0">{n.icon}</span>
              <span className="text-teal-100 leading-snug">{n.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* EXERCISES */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-white uppercase tracking-widest">Ejercicios</p>
        {exercises.map((ex) => (
          <div key={ex.n} className="flex gap-2 items-start bg-white/5 rounded-xl p-2.5 border border-white/10">
            {/* Number circle */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-teal-400 flex items-center justify-center">
              <span className="text-xs font-black text-teal-300">{ex.n}</span>
            </div>
            {/* Pose emoji + text */}
            <div className="flex gap-1.5 items-start min-w-0">
              <span className="text-lg flex-shrink-0 leading-none mt-0.5">{ex.pos}</span>
              <p className="text-teal-100 leading-relaxed">{ex.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="bg-teal-800/60 rounded-xl px-3 py-2 text-center">
        <p className="text-[10px] text-teal-200 leading-relaxed font-semibold">
          Realiza estos ejercicios de forma continuada. Los cambios son visibles a partir de <strong className="text-white">6-8 semanas</strong>.
          Deben formar parte del tratamiento pautado por tu médico.
        </p>
      </div>
    </div>
  );
}

/* ─── Block definitions ──────────────────────────────────────── */
const BLOCKS: BlockDef[] = [
  {
    id: 'bloque_1_liquidos',
    icon: '💧',
    title: 'Control de Líquidos y Alimentación',
    type: 'list',
    keyRule: 'No se trata de beber menos agua, sino de saber cuándo y qué beber.',
    items: [
      'Regula los horarios: si sufres nocturia o tienes un evento, reduce la ingesta 2 horas antes.',
      'Identifica los irritantes: la cafeína (café, té, cola) y el alcohol irritan el músculo de la vejiga y disparan la urgencia. Redúcelos progresivamente.',
      'No cortes el agua de golpe: la orina muy concentrada irrita más la vejiga e incrementa el riesgo de infección. Bebe lo suficiente para no tener sed.',
    ],
  },
  {
    id: 'bloque_2_estilo_vida',
    icon: '⚖️',
    title: 'Peso, Tabaco y Hábito Intestinal',
    type: 'list',
    intro: 'Lo que afecta a tu abdomen, afecta a tu vejiga.',
    items: [
      'Controla el sobrepeso: el exceso de peso presiona el suelo pélvico de forma continua, favoreciendo las pérdidas de orina. Perder peso reduce mecánicamente esta presión.',
      'Evita el estreñimiento: un recto lleno presiona la base de la vejiga. Mantén una dieta rica en fibra.',
      'Deja el tabaco: el tabaquismo agrava la urgencia y la frecuencia urinaria.',
    ],
  },
  {
    id: 'bloque_3_reeducacion',
    icon: '🧠',
    title: 'Reeducación de la Vejiga y Control de la Urgencia',
    type: 'sections',
    intro: 'El objetivo es recuperar el control de tu mente sobre el reflejo de orinar.',
    sections: [
      {
        name: 'Entrenamiento Vesical',
        text: 'Programa tus visitas al baño con intervalos fijos (p. ej. cada 2 horas) e incrémentalos poco a poco, incluso sin ganas. Rompe el hábito de ir "por si acaso".',
      },
      {
        name: 'Técnicas ante la Urgencia',
        text: 'Cuando sientas unas ganas súbitas, no corras. Detente y aplica:',
        bullets: [
          'Distracción cognitiva: cuenta hacia atrás de 3 en 3 desde 100.',
          'Presión en el periné (zona entre genitales y ano) o en la base del pene (hombres): activa un reflejo que relaja la vejiga.',
          '5 respiraciones profundas y lentas hasta que la urgencia ceda. Luego camina tranquilamente al baño.',
        ],
      },
    ],
  },
  {
    id: 'bloque_4_kegel',
    icon: '💪',
    title: 'Ejercicios de Kegel (Suelo Pélvico)',
    type: 'kegel',
  },
  {
    id: 'bloque_5_vaciado',
    icon: '🚿',
    title: 'Técnicas de Vaciado en el Baño',
    type: 'list',
    intro: 'Si sientes vaciado incompleto o goteo al terminar:',
    items: [
      'Doble micción: al terminar, espera 20-30 s, inclina el tronco ligeramente hacia adelante e inténtalo de nuevo.',
      'Ordeño uretral (hombres): introduce los dedos detrás del escroto tras orinar y presiona suavemente hacia adelante y arriba siguiendo el recorrido de la uretra. Evita el goteo postmiccional.',
    ],
  },
  {
    id: 'bloque_6_medicamentos',
    icon: '💊',
    title: 'Revisión de tus Medicamentos Habituales',
    type: 'warning',
    warning: 'Nunca suspendas un tratamiento por tu cuenta.',
    action: 'Muchos fármacos (especialmente diuréticos para la tensión) aumentan la producción de orina. Consulta con tu médico la posibilidad de tomar el diurético a primera hora de la mañana para mejorar tus noches.',
  },
];

/* ─── Types ──────────────────────────────────────────────────── */
type BlockDef =
  | { id: string; icon: string; title: string; type: 'list'; keyRule?: string; intro?: string; items: string[] }
  | { id: string; icon: string; title: string; type: 'sections'; intro?: string; sections: { name: string; text: string; bullets?: string[] }[] }
  | { id: string; icon: string; title: string; type: 'kegel' }
  | { id: string; icon: string; title: string; type: 'warning'; warning: string; action: string };

const ALARM_SYMPTOMS = ['hematuria (sangre en orina)', 'dolor agudo al orinar', 'fiebre', 'empeoramiento rápido'];

/* ─── Main component ─────────────────────────────────────────── */
export function RecommendationsSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-white/10">
        <BookOpen size={15} className="text-teal-200 flex-shrink-0" />
        <div>
          <span className="text-xs font-black text-white uppercase tracking-wider">Escuela de Salud Vesical</span>
          <p className="text-[10px] text-teal-300 mt-0.5">Guías AEU 2026 · Toca un bloque para leer</p>
        </div>
      </div>

      {/* Blocks */}
      <div className="divide-y divide-white/10">
        {BLOCKS.map((block) => {
          const isOpen = openId === block.id;
          return (
            <div key={block.id}>
              <button
                onClick={() => toggle(block.id)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{block.icon}</span>
                  <span className="text-xs font-bold text-white leading-snug">{block.title}</span>
                </span>
                {isOpen
                  ? <ChevronUp size={14} className="text-teal-300 flex-shrink-0" />
                  : <ChevronDown size={14} className="text-teal-300 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  {block.type === 'kegel' && <KegeiInfographic />}

                  {block.type === 'list' && (
                    <div className="space-y-2 text-xs text-teal-100 leading-relaxed">
                      {block.keyRule && (
                        <p className="italic text-white/80 border-l-2 border-teal-400 pl-2">{block.keyRule}</p>
                      )}
                      {block.intro && <p className="text-teal-200">{block.intro}</p>}
                      <ul className="space-y-1.5 list-none">
                        {block.items.map((item, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-teal-400 flex-shrink-0 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {block.type === 'sections' && (
                    <div className="space-y-3 text-xs text-teal-100 leading-relaxed">
                      {block.intro && <p className="text-teal-200">{block.intro}</p>}
                      {block.sections.map((sec) => (
                        <div key={sec.name} className="space-y-1">
                          <p className="font-bold text-white">{sec.name}</p>
                          <p>{sec.text}</p>
                          {sec.bullets && (
                            <ul className="space-y-1 mt-1">
                              {sec.bullets.map((b, i) => (
                                <li key={i} className="flex gap-1.5 pl-2">
                                  <span className="text-teal-400 flex-shrink-0 mt-0.5">›</span>
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {block.type === 'warning' && (
                    <div className="space-y-2 text-xs text-teal-100 leading-relaxed">
                      <p className="font-bold text-amber-300">⚠️ {block.warning}</p>
                      <p>{block.action}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alarm disclaimer */}
      <div className="mx-3 mb-3 mt-1 bg-red-900/30 rounded-xl p-3 border border-red-400/30 flex gap-2">
        <AlertTriangle size={13} className="text-red-300 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-red-200 leading-relaxed">
          <span className="font-bold">Síntomas de alarma: </span>
          {ALARM_SYMPTOMS.join(', ')}. Si aparece alguno, solicita consulta urológica prioritaria.
        </p>
      </div>
    </div>
  );
}
