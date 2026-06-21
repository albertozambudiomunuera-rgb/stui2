import type { TabId, AppData } from '../../types';

interface HeaderProps {
  data: AppData;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; show: (data: AppData) => boolean }[] = [
  { id: 'patient', label: 'Perfil', show: () => true },
  { id: 'screening', label: 'Cribado', show: () => true },
  { id: 'day-0', label: 'Día 1', show: () => true },
  { id: 'day-1', label: 'Día 2', show: () => true },
  { id: 'day-2', label: 'Día 3', show: () => true },
  { id: 'ipss', label: 'IPSS', show: () => true },
  { id: 'iief', label: 'IIEF-5', show: (d) => d.screening.iief === true },
  { id: 'oab', label: 'OAB-q', show: (d) => d.screening.oab === true },
  { id: 'iciq', label: 'ICIQ-SF', show: (d) => d.screening.iciq === true },
  { id: 'dashboard', label: 'Informe', show: () => true },
];

const TAB_ICONS: Record<TabId, string> = {
  patient: '👤',
  screening: '📋',
  'day-0': '📅',
  'day-1': '📅',
  'day-2': '📅',
  ipss: '📊',
  iief: '💊',
  oab: '🔵',
  iciq: '💧',
  dashboard: '🏥',
};

export function Header({ data, activeTab, onTabChange }: HeaderProps) {
  const p = data.patient;
  const visibleTabs = TABS.filter((t) => t.show(data));

  const getDayBadge = (di: number) => data.days[di].entries.length;

  return (
    <header className="bg-gradient-to-br from-teal-700 to-teal-900 sticky top-0 z-50 shadow-lg">
      <div className="px-4 pt-safe pt-3 pb-0">
        {/* Top row */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src="/Logo-AEU-Corporativo.png"
            alt="AEU"
            className="h-9 flex-shrink-0 object-contain"
          />
          <div className="flex-1 min-w-0">
            <div className="font-black text-white text-base leading-tight truncate">
              {p.name || 'Evaluación STUI'}
            </div>
            {p.name && (
              <div className="text-white/70 text-xs mt-0.5 truncate">
                {[p.age, p.sex ? (p.sex === 'M' ? '♂ Varón' : '♀ Mujer') : null].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          {/* Day progress dots */}
          <div className="flex gap-1.5 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                title={`Día ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${data.days[i].entries.length > 0 ? 'bg-emerald-400' : 'bg-white/25'}`}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const badge = tab.id.startsWith('day-') ? getDayBadge(parseInt(tab.id.slice(-1))) : 0;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap min-h-[44px] flex-shrink-0 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-sm">{TAB_ICONS[tab.id]}</span>
                <span>{tab.label}</span>
                {badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-teal-700 text-white' : 'bg-white/25 text-white'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
