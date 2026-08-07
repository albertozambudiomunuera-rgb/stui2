import { useState, useEffect } from 'react';
import type { TabId } from './types';
import { loadDataAsync, hasExistingData, checkIDBAvailable, isDisclaimerAccepted, emptyData, idbClear } from './lib/storage';
import { clearPINSetup, clearStoredMode } from './lib/keyManager';
import { useAppData } from './hooks/useAppData';
import { useSecureInit } from './hooks/useSecureInit';
import { SecurityChoice } from './components/ui/SecurityChoice';
import { PINSetup } from './components/ui/PINSetup';
import { Toast, useToast } from './components/ui/Toast';
import { Disclaimer } from './components/ui/Disclaimer';
import { InstallPrompt, isInstalled } from './components/ui/InstallPrompt';
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
import { diaryUnlocked } from './lib/clinical';

type AppMode = 'loading' | 'entry' | 'app' | 'express';

export default function App() {
  const [mode, setMode] = useState<AppMode>('loading');
  const [activeTab, setActiveTab] = useState<TabId>('patient');
  const [tabHistory, setTabHistory] = useState<TabId[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [idbActive, setIdbActive] = useState(true);
  const { toastMessage, toastVisible, showToast } = useToast();
  const actions = useAppData(emptyData());
  const secure = useSecureInit();

  // Cargar datos clínicos solo cuando el sistema de cifrado esté listo
  useEffect(() => {
    if (secure.status !== 'ready') return;
    (async () => {
      const [data, , idbOk] = await Promise.all([
        loadDataAsync(),
        hasExistingData(),
        checkIDBAvailable(),
      ]);
      actions.restoreData(data);
      setIdbActive(idbOk);
      setMode('entry');
      // El aviso de instalación ya NO se muestra aquí: el diario de 3 días
      // (Modo Casa) es el único flujo que dura días y puede sufrir un
      // desalojo de IndexedDB entre sesiones. El Modo Sala de Espera se
      // rellena en una sola sentada con la pestaña abierta, sin ese riesgo
      // — mostrar el aviso ahí solo genera ruido y confunde a pacientes
      // mayores. Se dispara en handleChooseMode solo para 'home'.
    })();
  }, [secure.status]);

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    if (!isInstalled()) setShowInstallPrompt(true);
  };

  const handleForgotPIN = async () => {
    await idbClear();
    clearPINSetup();
    clearStoredMode(); // vuelve a mostrar la pantalla de elección al reiniciar
    window.location.reload();
  };

  const handleChooseMode = (m: 'home' | 'express') => {
    if (m === 'home') {
      setMode('app');
      // Show disclaimer on first-time entry to app
      if (!isDisclaimerAccepted()) {
        setShowDisclaimer(true);
      } else if (!isInstalled()) {
        // Sin disclaimer pendiente, el aviso de instalación puede mostrarse
        // ya. Si hay disclaimer pendiente, espera a que se acepte
        // (handleDisclaimerAccept) para no apilar dos pantallas completas.
        setShowInstallPrompt(true);
      }
    } else {
      // El Modo Sala de Espera comparte los mismos datos que el modo Casa.
      // Antes se borraban aquí sin avisar cada vez que se entraba en Exprés,
      // lo que hacía perder el trabajo de un paciente que solo había pulsado
      // la X para salir un momento (p.ej. para enseñarlo en consulta) y
      // volvía a entrar después. Ahora solo se borra si el paciente/personal
      // lo confirma explícitamente.
      const hasData = actions.data.patient.name.trim() !== ''
        || actions.data.days.some((d) => d.entries.length > 0)
        || actions.data.ipss.q.some((v) => v !== null)
        || actions.data.iief.q.some((v) => v !== null)
        || actions.data.oab.q.some((v) => v !== null)
        || actions.data.iciq.q.some((v) => v !== null);
      if (hasData) {
        const empezarDeNuevo = confirm(
          'Hay datos guardados de un uso anterior del Modo Sala de Espera.\n\n' +
          'Aceptar → borrarlos y empezar con un paciente nuevo.\n' +
          'Cancelar → seguir con esos datos (por ejemplo, si aún no has terminado).'
        );
        if (empezarDeNuevo) actions.restoreData(emptyData());
      }
      setMode('express');
    }
  };

  const goToNextTab = (from: TabId): TabId => {
    const s = actions.data.screening;
    // El diario miccional (day-0/1/2) va al final, después de los
    // cuestionarios: se rellena a lo largo de 3 días, así que dejarlo para
    // el final evita interrumpir con una espera de varios días el flujo de
    // cuestionarios, que se completa de un tirón.
    const seq: TabId[] = [
      'patient', 'screening', 'ipss',
      ...(s.iief ? ['iief' as TabId] : []),
      ...(s.oab ? ['oab' as TabId] : []),
      ...(s.iciq ? ['iciq' as TabId] : []),
      ...(diaryUnlocked(actions.data) ? ['day-0' as TabId, 'day-1' as TabId, 'day-2' as TabId] : []),
      'dashboard',
    ];
    const idx = seq.indexOf(from);
    return seq[idx + 1] ?? 'dashboard';
  };

  const nav = (tab: TabId) => {
    setTabHistory((h) => [...h, activeTab]);
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setTabHistory((h) => {
      if (h.length === 0) return h;
      setActiveTab(h[h.length - 1]);
      return h.slice(0, -1);
    });
    window.scrollTo(0, 0);
  };

  if (mode === 'loading') {
    // Primer arranque: el usuario elige su nivel de seguridad
    if (secure.status === 'choose-mode') {
      return <SecurityChoice onChoose={secure.chooseMode} />;
    }
    // Modo PIN, primera vez: configurar PIN
    if (secure.status === 'setup-pin') {
      return (
        <PINSetup
          mode="setup"
          onSetup={secure.submitSetupPIN}
          onUnlock={secure.submitUnlockPIN}
        />
      );
    }
    // Modo PIN, retorno: desbloquear
    if (secure.status === 'unlock-pin') {
      return (
        <PINSetup
          mode="unlock"
          onSetup={secure.submitSetupPIN}
          onUnlock={secure.submitUnlockPIN}
          onForgotPIN={handleForgotPIN}
        />
      );
    }
    if (secure.status === 'error') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-teal-700 to-teal-900 flex items-center justify-center p-6">
          <div className="text-center text-white max-w-sm">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="font-bold mb-2">Error al inicializar el almacenamiento seguro</p>
            <p className="text-sm opacity-70">{secure.error}</p>
          </div>
        </div>
      );
    }
    // 'initializing' o modo auto cargando: spinner estándar
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
          notesCount={actions.data.notes.length}
          onAddNote={actions.addNote}
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
        onSwitchHome={() => { setMode('app'); setTabHistory([]); setActiveTab('patient'); }}
      />
    );
  }

  const d = actions.data;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Disclaimer visible={showDisclaimer} onAccept={handleDisclaimerAccept} />
      {showInstallPrompt && (
        <InstallPrompt onContinue={() => setShowInstallPrompt(false)} />
      )}
      <Toast message={toastMessage} visible={toastVisible} />

      {showRecommendations && <RecommendationsScreen onClose={() => setShowRecommendations(false)} />}
      <Header
        data={d}
        activeTab={activeTab}
        onTabChange={nav}
        canGoBack={tabHistory.length > 0}
        onBack={goBack}
        onBackToEntry={() => { setMode('entry'); setTabHistory([]); }}
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
            onBackToEntry={() => { setMode('entry'); setTabHistory([]); }}
          />
        )}
        {activeTab === 'screening' && (
          <ScreeningTab
            data={d}
            actions={actions}
            onNext={() => nav(goToNextTab('screening'))}
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
            onNext={() => nav(goToNextTab('iciq'))}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTab data={d} onAddNote={actions.addNote} onDeleteNote={actions.deleteNote} />
        )}
      </main>

      <footer className="text-center py-6 px-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-4">
        <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed">
          © 2026 Dr. Alberto Zambudio · Oficina de Salud Digital AEU · Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
