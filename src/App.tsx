import { useState, useEffect } from 'react';
import type { TabId } from './types';
import { loadDataAsync, hasExistingData, checkIDBAvailable, isDisclaimerAccepted, emptyData } from './lib/storage';
import { useAppData } from './hooks/useAppData';
import { Toast, useToast } from './components/ui/Toast';
import { Disclaimer } from './components/ui/Disclaimer';
import { Header } from './components/layout/Header';
import { EntryScreen } from './components/screens/EntryScreen';
import { RecommendationsScreen } from './components/screens/RecommendationsScreen';
import { ExpressMode } from './components/screens/ExpressMode';
import { PatientTab } from './components/tabs/PatientTab';
import { ScreeningTab } from './components/tabs/ScreeningTab';
import { DayTab } from './components/tabs/DayTab';
import { IPSSTab } from './components/tabs/IPSSTab';
import { IIEFTab } from './components/tabs/IIEFTab';
import { OABTab } from './components/tabs/OABTab';
import { ICIQTab } from './components/tabs/ICIQTab';
import { DashboardTab } from './components/tabs/DashboardTab';

type AppMode = 'loading' | 'entry' | 'app' | 'express';

export default function App() {
  const [mode, setMode] = useState<AppMode>('loading');
  const [activeTab, setActiveTab] = useState<TabId>('patient');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [idbActive, setIdbActive] = useState(true);
  const { toastMessage, toastVisible, showToast } = useToast();
  const actions = useAppData(emptyData());

  useEffect(() => {
    (async () => {
      const [data, , idbOk] = await Promise.all([
        loadDataAsync(),
        hasExistingData(),
        checkIDBAvailable(),
      ]);
      actions.restoreData(data);
      setIdbActive(idbOk);

      // Always show entry screen first - user chooses their mode
      setMode('entry');
    })();
  }, []);

  const handleChooseMode = (m: 'home' | 'express') => {
    if (m === 'home') {
      setMode('app');
      // Show disclaimer on first-time entry to app
      if (!isDisclaimerAccepted()) setShowDisclaimer(true);
    } else {
      // Reset data for Express mode (fresh start for waiting room)
      actions.restoreData(emptyData());
      setMode('express');
    }
  };

  const goToNextTab = (from: TabId): TabId => {
    const s = actions.data.screening;
    const seq: TabId[] = [
      'patient', 'screening', 'day-0', 'day-1', 'day-2', 'ipss',
      ...(s.iief ? ['iief' as TabId] : []),
      ...(s.oab ? ['oab' as TabId] : []),
      ...(s.iciq ? ['iciq' as TabId] : []),
      'dashboard',
    ];
    const idx = seq.indexOf(from);
    return seq[idx + 1] ?? 'dashboard';
  };

  const nav = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-700 to-teal-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-5xl mb-4 animate-pulse">🫀</div>
          <div className="text-sm opacity-70">Cargando STUI App…</div>
        </div>
      </div>
    );
  }

  if (mode === 'entry') {
    return (
      <>
        <EntryScreen
          onChoose={handleChooseMode}
          notes={actions.data.notes}
          onNotesChange={actions.updateNotes}
          onOpenRecommendations={() => setShowRecommendations(true)}
        />
        {showRecommendations && <RecommendationsScreen onClose={() => setShowRecommendations(false)} />}
      </>
    );
  }

  if (mode === 'express') {
    return (
      <ExpressMode
        data={actions.data}
        actions={actions}
        onExit={() => setMode('entry')}
        onSwitchHome={() => { setMode('app'); nav('patient'); }}
      />
    );
  }

  const d = actions.data;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Disclaimer visible={showDisclaimer} onAccept={() => setShowDisclaimer(false)} />
      <Toast message={toastMessage} visible={toastVisible} />

      {showRecommendations && <RecommendationsScreen onClose={() => setShowRecommendations(false)} />}
      <Header
        data={d}
        activeTab={activeTab}
        onTabChange={nav}
        onBackToEntry={() => setMode('entry')}
        onOpenRecommendations={() => setShowRecommendations(true)}
      />

      <main className="px-4 py-5 max-w-4xl mx-auto">
        {activeTab === 'patient' && (
          <PatientTab
            data={d}
            actions={actions}
            idbActive={idbActive}
            onToast={showToast}
            onNext={() => nav('screening')}
            onBackToEntry={() => setMode('entry')}
          />
        )}
        {activeTab === 'screening' && (
          <ScreeningTab
            data={d}
            actions={actions}
            onNext={() => nav('day-0')}
          />
        )}
        {(['day-0', 'day-1', 'day-2'] as TabId[]).map((id) => {
          const di = parseInt(id.slice(-1));
          return activeTab === id && (
            <DayTab
              key={id}
              data={d}
              actions={actions}
              dayIndex={di}
              onToast={showToast}
              onNext={() => nav(goToNextTab(id))}
            />
          );
        })}
        {activeTab === 'ipss' && (
          <IPSSTab
            data={d}
            actions={actions}
            onNext={() => nav(goToNextTab('ipss'))}
          />
        )}
        {activeTab === 'iief' && (
          <IIEFTab
            data={d}
            actions={actions}
            onNext={() => nav(goToNextTab('iief'))}
          />
        )}
        {activeTab === 'oab' && (
          <OABTab
            data={d}
            actions={actions}
            onNext={() => nav(goToNextTab('oab'))}
          />
        )}
        {activeTab === 'iciq' && (
          <ICIQTab
            data={d}
            actions={actions}
            onNext={() => nav('dashboard')}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTab data={d} />
        )}
      </main>

      <footer className="text-center py-6 px-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-4">
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          © 2026 Dr. Alberto Zambudio. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
