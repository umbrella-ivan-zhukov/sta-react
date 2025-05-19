import { AxiosError, AxiosResponse } from 'axios';
import { useCallback, useRef, useState } from 'react';

type MutateFunc<A extends any[], T> = (...args: A) => Promise<T | null>;

type UseMutateReturn<A extends any[], T, E> = {
  data: T | null;
  error: E | null;
  isLoading: boolean;
  mutate: MutateFunc<A, T>;
  statusCode: number | null;
};

/**
 * Custom React hook to handle requests from swagger-typescript-api
 *
 * @example
 * const { isLoading, data, error, mutate } = useMutate(apiMethod)
 * const {...} = useMutate((body) => apiMethod(id, body))
 * mutate({...})
 */
export const useMutate = <A extends any[], T, E = any>(
  callback: (...args: A) => Promise<AxiosResponse<T>>,
  opts?: {
    onSuccess?: (result: T | null) => void;
    onError?: (reason: E | null, status: number) => void;
  },
): UseMutateReturn<A, T, E> => {
  const callbackRef = useRef<MutateFunc<A, T>>();

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  callbackRef.current = async (...args: A): Promise<T | null> => {
    setIsLoading(true);
    setData(null);
    setError(null);
    setStatusCode(null);

    let result: T | null = null;

    try {
      const { data: responseData, status: responseStatus } = await callback(...args);
      result = responseData;

      setData(responseData);
      setStatusCode(responseStatus);

      opts?.onSuccess?.(responseData);
    } catch (e: any) {
      const typedError = e as AxiosError<E>;

      const { status: responseStatus = 0, data: responseData = null } = typedError?.response ?? {};

      setError(responseData);
      setStatusCode(responseStatus);

      opts?.onError?.(responseData, responseStatus);
    } finally {
      setIsLoading(false);
    }

    return result;
  };

  const mutate = useCallback<MutateFunc<A, T>>(async (...args) => callbackRef.current?.(...args) ?? null, []);

  return { data, error, isLoading, mutate, statusCode };
};
