import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
}

type Variant = 'field' | 'filter' | 'bare';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown when no option matches the value. */
  placeholder?: string;
  /** Filter variant: inline label before the value. */
  label?: string;
  /** Filter variant: the value narrows a list, so it takes the accent. */
  active?: boolean;
  variant?: Variant;
  align?: 'left' | 'right';
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

const TRIGGER: Record<Variant, string> = {
  field:
    'h-9 w-full border border-line-strong bg-surface px-3 hover:border-ink-3 aria-expanded:border-accent aria-invalid:border-danger',
  filter: 'h-12 w-full px-4 hover:bg-canvas aria-expanded:bg-canvas',
  bare: 'h-8 px-2 hover:bg-canvas aria-expanded:bg-canvas',
};

/** A styled listbox. Replaces native <select> everywhere so menus match the app. */
export const Select = ({
  value,
  onChange,
  options,
  placeholder = 'Choose',
  label,
  active = false,
  variant = 'field',
  align = 'left',
  id,
  className = '',
  ...aria
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[highlight]?.scrollIntoView({ block: 'nearest' });
  }, [open, highlight]);

  const show = () => {
    setHighlight(Math.max(selectedIndex, 0));
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    button.current?.focus();
  };

  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      show();
    }
  };
  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(highlight + 1, last),
      ArrowUp: Math.max(highlight - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setHighlight(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(highlight);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key.length === 1) {
      const match = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (match >= 0) setHighlight(match);
    }
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onButtonKey}
        className={`flex items-center gap-2 text-left transition-colors duration-100 ${TRIGGER[variant]}`}
        {...aria}
      >
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          {label && <span className="shrink-0 text-small text-ink-3">{label}</span>}
          <span className={`min-w-0 flex-1 truncate ${selected ? (active ? 'text-accent' : 'text-ink') : 'text-ink-3'}`}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <Icon name="chevron-down" className={`text-ink-2 transition-transform duration-100 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listId}-${highlight}`}
          onKeyDown={onListKey}
          className={`absolute z-40 mt-1 max-h-72 min-w-full overflow-y-auto border border-line-strong bg-surface py-1 shadow-[0_8px_24px_rgba(23,24,26,0.10)] outline-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setHighlight(i)}
                onClick={() => choose(i)}
                className={`flex h-9 cursor-pointer items-center gap-3 px-3 whitespace-nowrap ${i === highlight ? 'bg-canvas' : ''} ${
                  isSelected ? 'text-accent' : 'text-ink'
                }`}
              >
                <span className="flex-1">{o.label}</span>
                <Icon name="check" className={isSelected ? '' : 'invisible'} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
