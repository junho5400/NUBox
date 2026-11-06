import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { INPUT_CLASS } from '../utilities/classes';

export const TextInput = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${INPUT_CLASS} h-9 ${className}`} />
);

export const TextArea = ({ className = '', rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} rows={rows} className={`${INPUT_CLASS} py-2 ${className}`} />
);

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  hint?: string;
}

const CHOICE_BOX =
  'mt-[3px] grid size-4 shrink-0 appearance-none place-content-center border border-line-strong bg-surface checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Square checkbox; the accent fills it when checked. */
export const Checkbox = ({ label, hint, className = '', ...props }: ChoiceProps) => (
  <label className={`flex cursor-pointer gap-3 ${className}`}>
    <span className="relative flex">
      <input type="checkbox" {...props} className={`peer ${CHOICE_BOX}`} />
      <svg viewBox="0 0 16 16" aria-hidden="true" className="pointer-events-none absolute top-[3px] left-0 hidden size-4 fill-none stroke-white stroke-2 peer-checked:block">
        <path d="M4 8.5l2.5 2.5L12 5.5" />
      </svg>
    </span>
    <span>
      {label}
      {hint && <span className="block text-small text-ink-2">{hint}</span>}
    </span>
  </label>
);

/** Square radio; a smaller accent square marks the choice. */
export const Radio = ({ label, hint, className = '', ...props }: ChoiceProps) => (
  <label className={`flex cursor-pointer gap-3 ${className}`}>
    <span className="relative flex">
      <input type="radio" {...props} className={`peer ${CHOICE_BOX} checked:bg-surface`} />
      <span className="pointer-events-none absolute top-[7px] left-1 hidden size-2 bg-accent peer-checked:block" />
    </span>
    <span>
      {label}
      {hint && <span className="block text-small text-ink-2">{hint}</span>}
    </span>
  </label>
);
