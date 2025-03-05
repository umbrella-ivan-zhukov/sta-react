import { useCallback, useRef, useState } from 'react';

type MutateFunc<A extends any[], T> = (...args: A) => Promise<T | null>;

type UseMutateReturn<A extends any[], T, E> = {
  data: T | null;
  error: E | null;
  isPending: boolean;
  mutate: MutateFunc<A, T>;
  statusCode: number | null;
};

export const useMutate = <A extends any[], T, E>(
  callback: (...args: A) => Promise<HttpResponse<T, E>>,
  opts?: {
    onSuccess?: (result: T | null) => void;
    onError?: (reason: E | null, status: number) => void;
  },
): UseMutateReturn<A, T, E> => {
  const callbackRef = useRef<MutateFunc<A, T>>();

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  callbackRef.current = async (...args: A): Promise<T | null> => {
    setIsPending(true);
    setData(null);
    setError(null);
    setStatusCode(null);

    let result: T | null = null;

    try {
      const { data: responseData, status: responseStatus } = await callback(
        ...args,
      );

      setData(responseData);
      setStatusCode(responseStatus);

      result = responseData;
      opts?.onSuccess?.(result);
    } catch (e: any) {
      const status = e?.status ?? 0;
      const reason: E =
        e['error'] ?? (e instanceof Response ? await e?.json?.() : e);
      const message = getErrorMessage(reason);

      setError(reason);
      setStatusCode(status);

      opts?.onError?.(reason, status);
      throw new Error(message);
    } finally {
      setIsPending(false);
    }

    return result;
  };

  const mutate = useCallback<MutateFunc<A, T>>(
    async (...args) => callbackRef.current?.(...args) ?? null,
    [],
  );

  return { data, error, isPending, mutate, statusCode };
};
