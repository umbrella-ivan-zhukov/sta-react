import { get } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

// import HttpResponse from sta

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

export const useRequest = <A extends any[], T, E, I>(
  callback?: (...args: OptionalSpread<A>) => Promise<HttpResponse<T, E>>,
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

  callbackRef.current = async (
    ...args: OptionalSpread<A>
  ): Promise<T | null> => {
    if (!callback) return null;

    setIsLoading(true);
    setError(null);
    setData(null);
    setStatusCode(null);

    let result: T | null = null;

    try {
      const { data: responseData, status: responseStatus } = await callback(
        ...args,
      );

      const items = opts?.getList ? opts.getList(responseData) : null;
      const flush =
        get(responseData, 'part.offset') === 0 || Boolean(opts?.setFlush?.());

      setData(responseData);
      setStatusCode(responseStatus);
      setList((prev) =>
        items ? [...(flush ? [] : (prev ?? [])), ...items] : prev,
      );

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
      setIsLoading(false);
    }

    return result;
  };

  const request = useCallback<RequestFunc<A, T>>(
    async (...args) => callbackRef.current?.(...args) ?? null,
    [],
  );

  useEffect(() => {
    callbackRef.current?.();
  }, [...(deps ?? [])]);

  return { data, error, isLoading, request, list, statusCode };
};
