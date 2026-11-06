import type { AppSettings } from '../../types/settings';
import { emit, settings, subscribe } from '../store';

export const subscribeSettings = (onChange: (s: AppSettings) => void) => {
  const push = () => onChange({ ...settings });
  push();
  return subscribe(push);
};
export const saveSettings = async (value: AppSettings) => {
  Object.assign(settings, value);
  emit();
};
