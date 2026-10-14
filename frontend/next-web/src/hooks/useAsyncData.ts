import { useState, useEffect, useRef, useCallback } from 'react';

interface AsyncDataState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

interface UseAsyncDataResult<T> extends AsyncDataState<T> {
    refetch: () => void;
}

export function useAsyncData<T>(fetcher: () => Promise<T>): UseAsyncDataResult<T> {
    const [state, setState] = useState<AsyncDataState<T>>({
        data: null,
        loading: true,
        error: null,
    });
    const requestIdRef = useRef(0);

    const load = useCallback(() => {
        const currentRequestId = ++requestIdRef.current;

        setState((prev) => ({ ...prev, loading: true, error: null }));

        fetcher()
            .then((data) => {
                if (currentRequestId === requestIdRef.current) {
                    setState({ data, loading: false, error: null });
                }
            })
            .catch((err: unknown) => {
                if (currentRequestId === requestIdRef.current) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    setState({ data: null, loading: false, error });
                }
            });
    }, [fetcher]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch pattern
        load();

        return () => {
            requestIdRef.current += 1;
        };
    }, [load]);

    return { ...state, refetch: load };
}