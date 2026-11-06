import { useId, type ReactNode } from 'react';

interface ControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (props: ControlProps) => ReactNode;
}

/** Label above, control, then one line of hint or error. */
export const Field = ({ label, hint, error, children }: FieldProps) => {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small text-ink-2">
        {label}
      </label>
      {children({ id, 'aria-describedby': message ? messageId : undefined, 'aria-invalid': error ? true : undefined })}
      {message && (
        <p id={messageId} className={`text-caption ${error ? 'text-danger' : 'text-ink-3'}`}>
          {message}
        </p>
      )}
    </div>
  );
};
