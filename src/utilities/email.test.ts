import { describe, expect, it } from 'vitest';
import { isNorthwesternEmail } from './email';

describe('isNorthwesternEmail', () => {
  it('accepts student and staff Northwestern emails', () => {
    expect(isNorthwesternEmail('wildcat2028@u.northwestern.edu')).toBe(true);
    expect(isNorthwesternEmail('staff@northwestern.edu')).toBe(true);
    expect(isNorthwesternEmail('Wildcat@U.Northwestern.EDU')).toBe(true);
  });

  it('rejects other domains and look-alikes', () => {
    expect(isNorthwesternEmail('wildcat@gmail.com')).toBe(false);
    expect(isNorthwesternEmail('wildcat@northwestern.edu.evil.com')).toBe(false);
    expect(isNorthwesternEmail('wildcat@fakenorthwestern.edu')).toBe(false);
    expect(isNorthwesternEmail('wildcat@mail.northwestern.edu')).toBe(false);
    expect(isNorthwesternEmail(null)).toBe(false);
  });
});
