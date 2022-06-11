export type Result<T, E = undefined> = { ok: true, value: T } | { ok: false, error: E | undefined };

export const Ok = <T>(value?: T): Result<T, never> => {
  return { ok: true, value };
};

export const Err = <E>(error: E): Result<never, E> => {
  return { ok: false, error };
}

