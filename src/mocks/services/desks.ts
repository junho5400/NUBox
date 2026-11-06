import type { Desk } from '../../types/item';
import { desks, emit, subscribe } from '../store';

export const subscribeDesks = (onChange: (d: Desk[]) => void) => {
  const push = () => onChange([...desks]);
  push();
  return subscribe(push);
};
export const saveDesk = async (desk: Desk) => {
  const i = desks.findIndex((d) => d.id === desk.id);
  if (i >= 0) desks[i] = desk;
  else desks.push({ ...desk, id: `desk-${desks.length + 1}` });
  emit();
};
export const addEvanstonDesks = async () => {};
