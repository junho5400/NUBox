import { useEffect, useState, type PropsWithChildren } from 'react';
import { ToastContext } from '../hooks/useToast';

const VISIBLE_MS = 4000;

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext value={(message) => setToast({ id: Date.now(), message })}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <p key={toast.id} className="bg-inverse px-4 py-3 text-white shadow-[0_8px_24px_rgba(23,24,26,0.12)]">
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext>
  );
};
