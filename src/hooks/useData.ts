import { useEffect, useState } from 'react';
import { subscribeActivity, subscribeItemActivity } from '../services/activity';
import { subscribeDesks } from '../services/desks';
import { getPhotoUrl, subscribeAllItems, subscribeItem, subscribeItemPrivate, subscribePublicItems } from '../services/items';
import { subscribeRoles, type RoleGrant } from '../services/roles';
import type { Activity, Desk, Item, ItemPrivate } from '../types/item';
import { failed, ready, type Loadable } from './loadable';

const LOADING = { status: 'loading' } as const;

export const useDesks = (): Loadable<Desk[]> => {
  const [state, setState] = useState<Loadable<Desk[]>>(LOADING);
  useEffect(() => subscribeDesks((d) => setState(ready(d)), (e) => setState(failed(e))), []);
  return state;
};

export const usePublicItems = (): Loadable<Item[]> => {
  const [state, setState] = useState<Loadable<Item[]>>(LOADING);
  useEffect(() => subscribePublicItems((d) => setState(ready(d)), (e) => setState(failed(e))), []);
  return state;
};

export const useAllItems = (): Loadable<Item[]> => {
  const [state, setState] = useState<Loadable<Item[]>>(LOADING);
  useEffect(() => subscribeAllItems((d) => setState(ready(d)), (e) => setState(failed(e))), []);
  return state;
};

export const useActivity = (): Loadable<Activity[]> => {
  const [state, setState] = useState<Loadable<Activity[]>>(LOADING);
  useEffect(() => subscribeActivity((d) => setState(ready(d)), (e) => setState(failed(e))), []);
  return state;
};

export const useRoles = (): Loadable<RoleGrant[]> => {
  const [state, setState] = useState<Loadable<RoleGrant[]>>(LOADING);
  useEffect(() => subscribeRoles((d) => setState(ready(d)), (e) => setState(failed(e))), []);
  return state;
};

/** Keyed state so a change of id never shows the previous item's data. */
const useKeyed = <T>(key: string | null) => {
  const [state, setState] = useState<{ key: string | null; value: Loadable<T> }>({ key, value: LOADING });
  const value = state.key === key ? state.value : LOADING;
  const set = (v: Loadable<T>) => setState({ key, value: v });
  return [value, set] as const;
};

export const useItem = (id: string): Loadable<Item | null> => {
  const [state, set] = useKeyed<Item | null>(id);
  useEffect(() => subscribeItem(id, (d) => set(ready(d)), (e) => set(failed(e))), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
};

export const useItemPrivate = (id: string): Loadable<ItemPrivate> => {
  const [state, set] = useKeyed<ItemPrivate>(id);
  useEffect(() => subscribeItemPrivate(id, (d) => set(ready(d)), (e) => set(failed(e))), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
};

export const useItemActivity = (id: string): Loadable<Activity[]> => {
  const [state, set] = useKeyed<Activity[]>(id);
  useEffect(() => subscribeItemActivity(id, (d) => set(ready(d)), (e) => set(failed(e))), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
};

export const usePhotoUrl = (path: string | null): string | null => {
  const [state, set] = useKeyed<string>(path);
  useEffect(() => {
    if (!path) return;
    let active = true;
    getPhotoUrl(path).then(
      (url) => active && set(ready(url)),
      (e: Error) => active && set(failed(e)),
    );
    return () => {
      active = false;
    };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  return path && state.status === 'ready' ? state.data : null;
};
