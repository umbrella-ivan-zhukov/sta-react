import { AxiosError, AxiosResponse } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

type OptionalSpread<S> = S extends undefined ? [] : any[];

type RequestFunc<A, T> = (...args: OptionalSpread<A>) => Promise<T | null>;

type UseRequestReturn<A extends any[], T, E, I> = {
  data: T | null;
  error: E | null;
  list: I[] | null;
  isLoading: boolean;
  statusCode: number | null;
  request: RequestFunc<A, T>;
};

/**
 * Custom React hook to handle requests from swagger-typescript-api
 *
 * @example
 * const { isLoading, data, error, request } = useRequest(apiMethod)
 * const {...} = useRequest(id ? () => apiMethod(id) : undefined, [id])
 * const {...} = useRequest(() => apiMethod(query), [query])
 * request()
 */

export const useRequest = <A extends any[], T, I, E = any>(
  callback?: (...args: OptionalSpread<A>) => Promise<AxiosResponse<T>>,
  deps?: any[],
  opts?: {
    getList?: (data: T | null) => I[] | null;
    onSuccess?: (result: T | null) => void;
    onError?: (reason: E | null, status: number) => void;
    setFlush?: () => boolean;
  },
): UseRequestReturn<A, T, E, I> => {
  const callbackRef = useRef<RequestFunc<A, T>>();

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [list, setList] = useState<I[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  callbackRef.current = async (...args: OptionalSpread<A>): Promise<T | null> => {
    if (!callback) return null;

    setIsLoading(true);
    setError(null);
    setData(null);
    setStatusCode(null);

    let result: T | null = null;

    try {
      const { data: responseData, status: responseStatus } = await callback(...args);
      result = responseData;

      const flush = Boolean(opts?.setFlush?.());
      const items = opts?.getList ? opts.getList(responseData) : null;
      const responseList = items ? [...(flush ? [] : list ?? []), ...items] : list;

      setData(responseData);
      setStatusCode(responseStatus);
      setList(responseList);

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

  const request = useCallback<RequestFunc<A, T>>(async (...args) => callbackRef.current?.(...args) ?? null, []);

  useEffect(() => {
    callbackRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(deps ?? [])]);

  return { data, error, isLoading, request, list, statusCode };
};
