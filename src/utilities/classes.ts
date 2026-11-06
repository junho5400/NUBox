export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';
export type ButtonSize = 'md' | 'sm';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors duration-100 disabled:cursor-not-allowed';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:bg-hover disabled:text-ink-3',
  secondary:
    'border border-line-strong bg-surface text-ink hover:bg-hover disabled:border-line disabled:bg-surface disabled:text-ink-3',
  quiet: 'text-ink hover:bg-hover disabled:bg-transparent disabled:text-ink-3',
  destructive:
    'border border-line-strong bg-surface text-danger hover:border-danger hover:bg-danger/5 disabled:border-line disabled:text-ink-3',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'h-9 px-4',
  sm: 'h-7 px-3',
};

export const buttonClass = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string =>
  `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;

export const INPUT_CLASS =
  'w-full border border-line-strong bg-surface px-3 text-ink placeholder:text-ink-3 hover:border-ink-3 focus:border-accent focus:outline-none aria-invalid:border-danger disabled:bg-canvas disabled:text-ink-3';
