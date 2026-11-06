import { useState } from 'react';
import { Link } from 'react-router';
import { useItemActivity, useItemPrivate } from '../hooks/useData';
import type { Desk, Item } from '../types/item';
import { ACTIVITY_VERBS, isNote, undoLabel } from '../utilities/activity';
import { buttonClass } from '../utilities/classes';
import { formatDays, formatLongDate, formatShortDate, formatTime } from '../utilities/dates';
import { daysHeld, isPastHolding } from '../utilities/items';
import { Button } from './Button';
import { CloseDialog } from './CloseDialog';
import { Detail, DetailList } from './DetailList';
import { Icon } from './Icon';
import { ItemPhoto } from './ItemPhoto';
import { ReleaseDialog } from './ReleaseDialog';
import { ReopenDialog } from './ReopenDialog';
import { TransferDialog } from './TransferDialog';

interface Props {
  item: Item;
  desks: Desk[];
  closeTo: string;
}

/** Every staff action on the item, oldest first. The left column lines up with the detail labels above. */
const History = ({ itemId }: { itemId: string }) => {
  const history = useItemActivity(itemId);
  if (history.status === 'loading' || (history.status === 'ready' && history.data.length === 0)) return null;
  return (
    <section aria-labelledby="history">
      <h3 id="history" className="pb-3 text-small text-ink-2">
        History
      </h3>
      {history.status === 'error' ? (
        <p className="text-small text-danger">Couldn’t load history.</p>
      ) : (
        <ol className="border-b border-line">
          {history.data.map((e) => (
            <li key={e.id} className="flex items-baseline gap-4 border-t border-line py-3">
              <span className="w-28 shrink-0 text-small leading-[1.375rem] text-ink-2">
                {formatShortDate(e.at)}
                <span className="block">{formatTime(e.at)}</span>
              </span>
              <p className="min-w-0 break-words">
                {ACTIVITY_VERBS[e.type]}
                {!isNote(e.type) && e.detail && ` ${e.detail}`}
                <span className="block text-ink-2">by {e.by}</span>
                {isNote(e.type) && e.detail && <span className="block text-ink-2">{e.detail}</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export const ItemPanel = ({ item, desks, closeTo }: Props) => {
  const priv = useItemPrivate(item.id);
  const [dialog, setDialog] = useState<'release' | 'transfer' | 'close' | 'reopen' | null>(null);
  const desk = desks.find((d) => d.id === item.deskId);
  const undo = undoLabel(item.status);
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
          {undo && (
            <Button variant="quiet" size="sm" onClick={() => setDialog('reopen')}>
              {undo}
            </Button>
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
            {p.claim.name} ({p.claim.netid || 'visitor'})
            {p.claim.contact && <span className="block text-ink-2">{p.claim.contact}</span>}
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
            <Button onClick={() => setDialog('transfer')} disabled={!desks.some((d) => d.active && d.id !== item.deskId)}>
              Transfer
            </Button>
            <Button onClick={() => setDialog('close')}>
              Donate or discard
            </Button>
          </div>
        </div>
      )}
      <History itemId={item.id} />
      <ReleaseDialog key={`r-${item.id}`} item={item} open={dialog === 'release'} onClose={() => setDialog(null)} />
      <TransferDialog key={`t-${item.id}`} item={item} desks={desks} open={dialog === 'transfer'} onClose={() => setDialog(null)} />
      <CloseDialog key={`c-${item.id}`} item={item} open={dialog === 'close'} onClose={() => setDialog(null)} />
      {undo && <ReopenDialog key={`u-${item.id}`} item={item} label={undo} open={dialog === 'reopen'} onClose={() => setDialog(null)} />}
    </aside>
  );
};
