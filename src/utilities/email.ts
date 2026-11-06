const NORTHWESTERN_EMAIL = /^[^@\s]+@(u\.)?northwestern\.edu$/i;

// Must stay in sync with isNorthwestern() in firestore.rules and storage.rules.
export const isNorthwesternEmail = (email: string | null | undefined): boolean =>
  !!email && NORTHWESTERN_EMAIL.test(email);
