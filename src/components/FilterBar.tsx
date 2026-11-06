import type { PropsWithChildren } from 'react';
import { Icon } from './Icon';

/** The one ruled strip in the app: search and the filters that narrow a list. */
export const FilterBar = ({ children }: PropsWithChildren) => (
  <div className="flex flex-wrap border-t border-l border-line-strong *:border-r *:border-b *:border-line-strong">
    {children}
  </div>
);

interface SearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}

export const FilterSearch = ({ value, onChange, placeholder, className = '' }: SearchProps) => (
  <label className={`flex min-w-0 items-center gap-2.5 px-4 focus-within:bg-canvas ${className}`}>
    <Icon name="search" className="text-ink-3" />
    <span className="sr-only">Search</span>
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-3 focus-visible:outline-none"
    />
  </label>
);

/** A standalone search box with the same square frame as the strip. */
export const SearchBox = (props: SearchProps) => (
  <div className="border border-line-strong">
    <FilterSearch {...props} className={`[&_input]:h-9 ${props.className ?? ''}`} />
  </div>
);
