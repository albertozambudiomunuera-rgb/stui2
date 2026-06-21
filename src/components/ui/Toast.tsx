import { useState, useRef, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;
  return (
    <div className="fixed top-safe top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none animate-slide-down">
      <div className="flex items-center gap-2 bg-teal-800 dark:bg-teal-700 text-white rounded-2xl px-5 py-3 text-sm font-bold shadow-2xl whitespace-nowrap">
        <CheckCircle size={16} />
        {message}
      </div>
    </div>
  );
}

export function useToast() {
  const [state, setState] = useState({ message: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ message: msg, visible: true });
    timerRef.current = setTimeout(() => setState((p) => ({ ...p, visible: false })), 2400);
  }, []);

  return { toastMessage: state.message, toastVisible: state.visible, showToast };
}
