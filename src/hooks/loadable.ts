export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: Error };

export const ready = <T>(data: T): Loadable<T> => ({ status: 'ready', data });

/** The single place unexpected data-loading failures are logged. */
export const failed = <T>(error: Error): Loadable<T> => {
  console.error(error);
  return { status: 'error', error };
};
