import { useState } from 'react';
import { Link } from 'react-router';
import { useItemPrivate } from '../hooks/useData';
import type { Desk, Item } from '../types/item';
import { buttonClass } from '../utilities/classes';
import { formatDays, formatLongDate } from '../utilities/dates';
import { daysHeld, isPastHolding } from '../utilities/items';
import { Button } from './Button';
import { CloseDialog } from './CloseDialog';
import { Detail, DetailList } from './DetailList';
import { Icon } from './Icon';
import { ItemPhoto } from './ItemPhoto';
import { ReleaseDialog } from './ReleaseDialog';
import { TransferDialog } from './TransferDialog';

interface Props {
  item: Item;
  desks: Desk[];
  closeTo: string;
}

export const ItemPanel = ({ item, desks, closeTo }: Props) => {
  const priv = useItemPrivate(item.id);
  const [dialog, setDialog] = useState<'release' | 'transfer' | 'close' | null>(null);
  const desk = desks.find((d) => d.id === item.deskId);
  const days = daysHeld(item);
  const p = priv.status === 'ready' ? priv.data : null;

  return (
    <aside aria-label={item.name} className="flex flex-col gap-6 px-4 pt-5 pb-10 md:px-8">
      <div className="flex items-center justify-between">
        <span className="text-caption text-ink-3">{item.number}</span>
        <div className="-mr-3 flex gap-1">
          {item.status === 'available' && (
            <Link to={`/inventory/${item.id}/edit`} className={buttonClass('quiet', 'sm')}>
              Edit
            </Link>
          )}
          <Link to={closeTo} className={buttonClass('quiet', 'sm')}>
            <Icon name="close" />
            Close
          </Link>
        </div>
      </div>
      <div>
        <h2 className="text-title">{item.name}</h2>
        <p className="mt-1 text-small text-ink-3">
          {item.category}
          {item.sensitive && ' · Sensitive'}
        </p>
      </div>
      <ItemPhoto item={item} showSensitive />
      <DetailList>
        {item.status === 'available' && (
          <Detail label="Held">
            {isPastHolding(item, desk) ? (
              <span className="text-danger">
                {formatDays(days)}, past the {desk?.holdingDays ?? 30}-day limit
              </span>
            ) : (
              formatDays(days)
            )}
          </Detail>
        )}
        <Detail label="Found">
          {formatLongDate(item.foundOn)}
          {item.foundAt && <span className="block text-ink-2">{item.foundAt}</span>}
        </Detail>
        <Detail label="Desk">{desk?.name ?? 'Unknown'}</Detail>
        {item.description && <Detail label="Description">{item.description}</Detail>}
        {p?.details && <Detail label="Private">{p.details}</Detail>}
        {p?.claim && (
          <Detail label="Released to">
            {p.claim.name} ({p.claim.netid})
            <span className="block text-ink-2">
              {formatLongDate(p.claim.at)} by {p.claim.by}
            </span>
            {p.claim.note && <span className="block text-ink-2">{p.claim.note}</span>}
          </Detail>
        )}
        {p?.disposal && (
          <Detail label={p.disposal.method === 'donated' ? 'Donated' : 'Discarded'}>
            {formatLongDate(p.disposal.at)} by {p.disposal.by}
            {p.disposal.note && <span className="block text-ink-2">{p.disposal.note}</span>}
          </Detail>
        )}
      </DetailList>
      {item.status === 'available' && (
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={() => setDialog('release')}>
            Release to owner
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setDialog('transfer')} disabled={desks.length < 2}>
              Transfer
            </Button>
            <Button onClick={() => setDialog('close')}>
              Donate or discard
            </Button>
          </div>
        </div>
      )}
      <ReleaseDialog key={`r-${item.id}`} item={item} open={dialog === 'release'} onClose={() => setDialog(null)} />
      <TransferDialog key={`t-${item.id}`} item={item} desks={desks} open={dialog === 'transfer'} onClose={() => setDialog(null)} />
      <CloseDialog key={`c-${item.id}`} item={item} open={dialog === 'close'} onClose={() => setDialog(null)} />
    </aside>
  );
};
