import { createContext, useContext } from 'react';

export const ToastContext = createContext<((message: string) => void) | null>(null);

/** Returns a function that shows a short confirmation at the bottom of the screen. */
export const useToast = (): ((message: string) => void) => {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside ToastProvider');
  return show;
};
