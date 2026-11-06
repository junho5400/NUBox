import type { Activity } from '../../types/item';
import { activity, subscribe } from '../store';

export const subscribeActivity = (onChange: (a: Activity[]) => void) => {
  const push = () => onChange([...activity].sort((a, b) => b.at.getTime() - a.at.getTime()));
  push();
  return subscribe(push);
};

export const subscribeItemActivity = (itemId: string, onChange: (a: Activity[]) => void) => {
  const push = () => onChange(activity.filter((a) => a.itemId === itemId).sort((a, b) => a.at.getTime() - b.at.getTime()));
  push();
  return subscribe(push);
};
