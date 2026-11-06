import { useEffect, useId, useRef, type PropsWithChildren } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
}

/** Modal built on <dialog>, so focus trapping and Escape come from the browser. */
export const Dialog = ({ open, title, onClose, children }: PropsWithChildren<DialogProps>) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] overflow-visible border border-line-strong bg-surface p-0 text-ink shadow-[0_16px_48px_rgba(23,24,26,0.14)] backdrop:bg-inverse/20"
    >
      {open && (
        <div className="flex flex-col gap-6 p-6">
          <h2 id={titleId} className="text-heading font-medium">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
};
