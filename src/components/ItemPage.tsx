import { Link, useParams } from 'react-router';
import { useClaimedVisibleDays, useDesks, useItem } from '../hooks/useData';
import type { Desk, Item } from '../types/item';
import { formatLongDate } from '../utilities/dates';
import { isVisibleToStudents } from '../utilities/items';
import { buttonClass } from '../utilities/classes';
import { BackLink } from './BackLink';
import { Detail, DetailList } from './DetailList';
import { ItemPhoto } from './ItemPhoto';

/**
 * The answer to "where do I go?" — the one place the accent fills an area.
 * No hairlines inside: inset lines next to the full-width rows above read as a width mismatch.
 */
const PickUp = ({ item, desk }: { item: Item; desk: Desk | undefined }) => {
  const facts: [string, string][] = [
    ...(desk?.hours ? [['Hours', desk.hours] as [string, string]] : []),
    ...(desk?.contact ? [['Contact', desk.contact] as [string, string]] : []),
    ...(desk?.bring ? [['Bring', desk.bring] as [string, string]] : []),
    ['Ask for', item.number],
  ];
  return (
    <section aria-labelledby="pickup" className="bg-accent px-7 pt-6 pb-7 text-white">
      <h2 id="pickup" className="text-small text-white/70">
        Pick it up at
      </h2>
      <p className="mt-1 text-[2rem] leading-tight tracking-[-0.03em]">{desk?.name ?? 'Lost and found desk'}</p>
      {desk?.place && <p className="text-white/80">{desk.place}</p>}
      <dl className="mt-6 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-2">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-small leading-[1.375rem] text-white/60">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-small text-white/80">Staff will ask you to describe it before handing it over.</p>
    </section>
  );
};

const Gone = () => (
  <div className="flex flex-col items-start gap-3 px-4 py-12 md:px-8">
    <p className="text-heading">This item is no longer listed.</p>
    <Link to="/" className={buttonClass('secondary', 'sm')}>
      See found items
    </Link>
  </div>
);

export const ItemPage = () => {
  const { id = '' } = useParams();
  const item = useItem(id);
  const desks = useDesks();
  const claimedVisibleDays = useClaimedVisibleDays();

  if (item.status === 'loading' || claimedVisibleDays === null) return <p className="px-4 py-12 text-ink-3 md:px-8">Loading</p>;
  // Students get a permission error for items that are no longer public.
  if (item.status === 'error' || !item.data || !isVisibleToStudents(item.data, claimedVisibleDays)) return <Gone />;

  const it = item.data;
  const desk = desks.status === 'ready' ? desks.data.find((d) => d.id === it.deskId) : undefined;

  return (
    <div className="px-4 pt-6 pb-16 md:px-8">
      <BackLink to="/">Found items</BackLink>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 xl:gap-24">
        <ItemPhoto item={it} large />
        {/* Top block identifies the item; the pickup block sits on the photo's bottom edge. */}
        <div className="flex flex-col justify-between gap-10">
          <div>
            {/* Pulled up so the caption's letters, not its line box, meet the photo's top edge. */}
            <p className="-mt-[3px] text-caption text-ink-3">{it.number}</p>
            <h1 className="mt-2 text-display">{it.name}</h1>
            {it.description && <p className="mt-2 text-ink-2">{it.description}</p>}
            <div className="mt-8">
              <DetailList>
                <Detail label="Found">
                  {formatLongDate(it.foundOn)}
                  {it.foundAt && <span className="block text-ink-2">{it.foundAt}</span>}
                </Detail>
                <Detail label="Category">{it.category}</Detail>
              </DetailList>
            </div>
          </div>
          {it.status === 'claimed' ? (
            <p className="bg-canvas px-7 py-6">Picked up on {formatLongDate(it.statusChangedAt)}.</p>
          ) : (
            <PickUp item={it} desk={desk} />
          )}
        </div>
      </div>
    </div>
  );
};
