import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { ToastContext } from './toast-context';

const TONES = {
  success: { icon: CheckCircle2, className: 'border-green-200 bg-green-50 text-green-900' },
  error: { icon: XCircle, className: 'border-red-200 bg-red-50 text-red-900' },
  info: { icon: Info, className: 'border-navy-100 bg-navy-50 text-navy-900' },
};

const DURATION_MS = 4000;

export default function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (tone, message) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map(({ id, tone, message }) => {
          const { icon: Icon, className } = TONES[tone];
          return (
            <div
              key={id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border p-3 shadow-lg',
                className,
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-base">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="-m-1 rounded p-1 opacity-70 hover:opacity-100"
                aria-label={t('actions.close')}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
