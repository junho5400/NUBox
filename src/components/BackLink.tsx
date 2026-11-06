import { Link } from 'react-router';
import { Icon } from './Icon';

export const BackLink = ({ to, children }: { to: string; children: string }) => (
  <Link to={to} className="inline-flex h-8 items-center gap-1.5 text-small text-ink-2 hover:text-accent">
    <Icon name="arrow-left" />
    {children}
  </Link>
);
