import { Link, NavLink } from 'react-router';

/** In-page tab. Place Tabs on a hairline; the nav overlaps it by 1px so the ink underline replaces the line instead of stacking on it. */
export const TAB_CLASS =
  'flex h-full shrink-0 items-center gap-1.5 border-b-2 border-transparent whitespace-nowrap text-ink-2 transition-colors duration-100 hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink';

/** App section link in the header: weight and ink mark the current one, no line. */
const NAV_CLASS =
  'flex h-full shrink-0 items-center whitespace-nowrap text-ink-3 transition-colors duration-100 hover:text-ink aria-[current=page]:font-medium aria-[current=page]:text-ink';

export interface TabItem {
  to: string;
  label: string;
  count?: number;
  current?: boolean;
}

/** A row of link tabs on a hairline. Use `nav` for app sections (router-matched). */
export const Tabs = ({ label, items, nav = false, className = '' }: { label: string; items: TabItem[]; nav?: boolean; className?: string }) => (
  <nav aria-label={label} className={`flex h-11 gap-6 overflow-x-auto overflow-y-hidden [scrollbar-width:none] ${nav ? '' : '-mb-px'} ${className}`}>
    {items.map((t) =>
      nav ? (
        <NavLink key={t.to} to={t.to} className={NAV_CLASS}>
          {t.label}
        </NavLink>
      ) : (
        <Link key={t.to} to={t.to} aria-current={t.current ? 'page' : undefined} className={TAB_CLASS}>
          {t.label}
          {t.count !== undefined && <span className="text-caption text-ink-3">{t.count}</span>}
        </Link>
      ),
    )}
  </nav>
);
