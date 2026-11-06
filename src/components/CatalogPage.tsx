import { Link, useSearchParams } from 'react-router';
import { useClaimedVisibleDays, useDesks, usePublicItems } from '../hooks/useData';
import { CATEGORIES, type Desk, type Item } from '../types/item';
import { formatShortDate } from '../utilities/dates';
import { byNewest, isVisibleToStudents, matchesSearch, pickableDesks } from '../utilities/items';
import { Button } from './Button';
import { FilterBar, FilterSearch } from './FilterBar';
import { ItemPhoto } from './ItemPhoto';
import { PageTitle } from './PageTitle';
import { Select } from './Select';
import { Tag } from './Tag';

const SINCE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '3', label: 'Past 3 days' },
  { value: '7', label: 'Past week' },
  { value: '14', label: 'Past 2 weeks' },
  { value: '30', label: 'Past month' },
];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

const ItemTile = ({ item, desk }: { item: Item; desk: Desk | undefined }) => (
  <Link to={`/items/${item.id}`} className="group flex flex-col gap-3">
    <ItemPhoto item={item} />
    <div>
      <p className="truncate font-medium transition-colors duration-100 group-hover:text-accent">{item.name}</p>
      <p className="text-small text-ink-2">{desk?.name}</p>
      <p className="mt-0.5 flex items-center gap-2 text-small text-ink-3">
        Found {formatShortDate(item.foundOn)}
        {item.status === 'claimed' && <Tag>Picked up</Tag>}
      </p>
    </div>
  </Link>
);

export const CatalogPage = () => {
  const [params, setParams] = useSearchParams();
  const items = usePublicItems();
  const desks = useDesks();
  const claimedVisibleDays = useClaimedVisibleDays();

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const deskId = params.get('desk') ?? '';
  const since = params.get('since') ?? '';
  const filtered = q || category || deskId || since;

  const setParam = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const deskList = desks.status === 'ready' ? desks.data : [];
  const deskById = new Map(deskList.map((d) => [d.id, d]));
  const sinceDate = SINCE_OPTIONS.some((o) => o.value === since && since) ? daysAgo(Number(since)) : null;
  const loading = items.status === 'loading' || (items.status === 'ready' && claimedVisibleDays === null);
  const visible =
    items.status === 'ready' && claimedVisibleDays !== null
      ? items.data
          .filter(
            (item) =>
              isVisibleToStudents(item, claimedVisibleDays) &&
              (!q || matchesSearch(item, q)) &&
              (!category || item.category === category) &&
              (!deskId || item.deskId === deskId) &&
              (!sinceDate || item.foundOn >= sinceDate),
          )
          .sort(byNewest)
      : [];

  return (
    <div className="px-4 pb-16 md:px-8">
      <PageTitle>Found items</PageTitle>
      <FilterBar>
        <FilterSearch value={q} onChange={(v) => setParam('q', v)} placeholder="Search by name or color" className="basis-full lg:basis-0 lg:flex-1" />
        <Select
          variant="filter"
          label="Category"
          aria-label="Category"
          value={category}
          active={!!category}
          onChange={(v) => setParam('category', v)}
          options={[{ value: '', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          className="basis-full sm:basis-0 sm:flex-1 lg:w-56 lg:flex-none"
        />
        <Select
          variant="filter"
          label="Desk"
          aria-label="Desk"
          value={deskId}
          active={!!deskId}
          onChange={(v) => setParam('desk', v)}
          options={[{ value: '', label: 'All' }, ...pickableDesks(deskList, deskId).map((d) => ({ value: d.id, label: d.name }))]}
          className="basis-full sm:basis-0 sm:flex-1 lg:w-56 lg:flex-none"
        />
        <Select
          variant="filter"
          label="Found"
          aria-label="Found"
          align="right"
          value={since}
          active={!!since}
          onChange={(v) => setParam('since', v)}
          options={SINCE_OPTIONS}
          className="basis-full sm:basis-0 sm:flex-1 lg:w-52 lg:flex-none"
        />
      </FilterBar>

      <div className="pt-8">
        {loading && <p className="text-ink-3">Loading</p>}
        {items.status === 'error' && <p className="text-danger">Couldn’t load items. Refresh to try again.</p>}
        {!loading && items.status === 'ready' && visible.length === 0 && (
          <div className="flex flex-col items-start gap-3 py-8">
            <p className="text-heading">{filtered ? 'No items match.' : 'Nothing has been turned in yet.'}</p>
            {filtered && (
              <Button size="sm" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </Button>
            )}
          </div>
        )}
        {visible.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((item) => (
              <li key={item.id}>
                <ItemTile item={item} desk={deskById.get(item.deskId)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
