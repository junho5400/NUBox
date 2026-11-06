import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAllItems, useDesks } from '../hooks/useData';
import { ALL_DESKS, useStaffDesk } from '../hooks/useStaffDesk';
import type { Desk, Item } from '../types/item';
import { buttonClass } from '../utilities/classes';
import { formatDays, formatShortDate } from '../utilities/dates';
import { byNewest, daysHeld, isPastHolding, matchesSearch } from '../utilities/items';
import { SearchBox } from './FilterBar';
import { Tabs } from './Tabs';
import { Icon } from './Icon';
import { ItemPanel } from './ItemPanel';
import { ItemPhoto } from './ItemPhoto';
import { PageTitle } from './PageTitle';

type View = 'custody' | 'past' | 'released' | 'closed';

const VIEWS: { id: View; label: string; empty: string }[] = [
  { id: 'custody', label: 'In custody', empty: 'Nothing in custody.' },
  { id: 'past', label: 'Past holding', empty: 'Nothing is past its holding period.' },
  { id: 'released', label: 'Released', empty: 'Nothing released yet.' },
  { id: 'closed', label: 'Closed', empty: 'Nothing donated or discarded yet.' },
];

const inView = (view: View, item: Item, desk: Desk | undefined) => {
  if (view === 'custody') return item.status === 'available';
  if (view === 'past') return isPastHolding(item, desk);
  if (view === 'released') return item.status === 'claimed';
  return item.status === 'donated' || item.status === 'discarded';
};

const byOldest = (a: Item, b: Item) => a.foundOn.getTime() - b.foundOn.getTime();
const byRecentChange = (a: Item, b: Item) => b.statusChangedAt.getTime() - a.statusChangedAt.getTime();

export const InventoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const items = useAllItems();
  const desks = useDesks();
  const { deskId } = useStaffDesk();

  const view = (VIEWS.find((v) => v.id === params.get('view'))?.id ?? 'custody') as View;
  const q = params.get('q') ?? '';
  const query = params.toString() ? `?${params.toString()}` : '';

  const deskList = desks.status === 'ready' ? desks.data : [];
  const deskById = new Map(deskList.map((d) => [d.id, d]));
  const all = items.status === 'ready' ? items.data : [];
  const atDesk = all.filter((item) => deskId === ALL_DESKS || item.deskId === deskId);
  const count = (v: View) => atDesk.filter((item) => inView(v, item, deskById.get(item.deskId))).length;
  const rows = atDesk
    .filter((item) => inView(view, item, deskById.get(item.deskId)) && (!q || matchesSearch(item, q)))
    .sort(view === 'past' ? byOldest : view === 'custody' ? byNewest : byRecentChange);
  const selected = id ? all.find((item) => item.id === id) : undefined;
  const panelOpen = !!selected;

  const setQuery = (value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('q', value);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );

  const showChange = view === 'released' || view === 'closed';

  return (
    <div className={`flex-1 ${panelOpen ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_28rem]' : ''}`}>
      <div className="min-w-0 px-4 pb-16 md:px-8">
        <PageTitle
          action={
            <Link to="/log" className={buttonClass('primary')}>
              <Icon name="plus" />
              Log item
            </Link>
          }
        >
          Inventory
        </PageTitle>

        <div className="flex flex-col-reverse gap-3 border-b border-line md:flex-row md:items-end md:justify-between">
          <Tabs
            label="Views"
            items={VIEWS.map((v) => ({
              to: `/inventory?view=${v.id}`,
              label: v.label,
              count: v.id === 'custody' || v.id === 'past' ? count(v.id) : undefined,
              current: v.id === view,
            }))}
          />
          <div className="md:mb-[3px] md:w-72">
            <SearchBox value={q} onChange={setQuery} placeholder="Search name or number" />
          </div>
        </div>

        <div>
          {items.status === 'loading' && <p className="py-8 text-ink-3">Loading</p>}
          {items.status === 'error' && <p className="py-8 text-danger">Couldn’t load items. Refresh to try again.</p>}
          {items.status === 'ready' && rows.length === 0 && (
            <p className="py-8 text-heading">{q ? 'No items match.' : VIEWS.find((v) => v.id === view)?.empty}</p>
          )}
          {rows.length > 0 && (
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-line text-left text-caption text-ink-3">
                  <th className="h-10 font-normal">Item</th>
                  <th className="hidden w-40 font-normal md:table-cell">Desk</th>
                  <th className="hidden w-24 font-normal sm:table-cell">Found</th>
                  <th className="w-24 text-right font-normal">{showChange ? (view === 'released' ? 'Released' : 'Closed') : 'Held'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const desk = deskById.get(item.deskId);
                  const past = isPastHolding(item, desk);
                  const note = past && view !== 'past' ? 'Past holding' : item.status === 'donated' ? 'Donated' : item.status === 'discarded' ? 'Discarded' : null;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/inventory/${item.id}${query}`)}
                      aria-selected={item.id === id}
                      className="cursor-pointer border-b border-line transition-colors duration-100 hover:bg-canvas aria-selected:bg-canvas"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <ItemPhoto item={item} showSensitive className="w-12 shrink-0 [&_span]:hidden" />
                          <div className="min-w-0">
                            <Link to={`/inventory/${item.id}${query}`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium">
                              {item.name}
                            </Link>
                            <p className="truncate text-small text-ink-3">
                              {item.category}
                              {item.sensitive && ' · Sensitive'}
                              {note && ` · ${note}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden truncate text-ink-2 md:table-cell">{desk?.name}</td>
                      <td className="hidden text-ink-2 sm:table-cell">{formatShortDate(item.foundOn)}</td>
                      <td className={`text-right tabular-nums ${past ? 'text-danger' : ''}`}>
                        {showChange ? formatShortDate(item.statusChangedAt) : formatDays(daysHeld(item))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {id && items.status === 'ready' && (
        <div className="fixed inset-0 z-20 overflow-y-auto bg-surface lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-3.5rem)] lg:border-l lg:border-line">
          {selected ? (
            <ItemPanel key={selected.id} item={selected} desks={deskList} closeTo={`/inventory${query}`} />
          ) : (
            <div className="flex flex-col items-start gap-3 p-8">
              <p className="text-heading">This item doesn’t exist.</p>
              <Link to={`/inventory${query}`} className={buttonClass('secondary', 'sm')}>
                Back to inventory
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
