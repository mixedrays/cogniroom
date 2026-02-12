import { useState, useCallback } from "react";

export interface AsyncState<T = unknown> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseAsyncStateReturn<T> extends AsyncState<T> {
  /** Set the loading state */
  setLoading: () => void;
  /** Set success state with data */
  setSuccess: (data: T) => void;
  /** Set error state with message */
  setError: (error: string | Error) => void;
  /** Reset to initial state */
  reset: () => void;
  /** Execute an async function with automatic state management */
  execute: <R = T>(fn: () => Promise<R>) => Promise<R | null>;
}

/**
 * useAsyncState - A hook for managing async operation states
 *
 * @example
 * // Basic usage
 * const { isLoading, error, execute } = useAsyncState();
 *
 * const handleSubmit = async () => {
 *   const result = await execute(async () => {
 *     return await api.createItem(data);
 *   });
 *   if (result) {
 *     // Success handling
 *   }
 * };
 *
 * @example
 * // With initial data
 * const { data, isLoading, execute } = useAsyncState<User>(initialUser);
 *
 * @example
 * // Manual state control
 * const { setLoading, setSuccess, setError, reset } = useAsyncState();
 *
 * const handleAction = async () => {
 *   setLoading();
 *   try {
 *     const result = await someAsyncOperation();
 *     setSuccess(result);
 *   } catch (e) {
 *     setError(e);
 *   }
 * };
 */
export function useAsyncState<T = unknown>(
  initialData: T | null = null
): UseAsyncStateReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const setLoading = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      isError: false,
    }));
  }, []);

  const setSuccess = useCallback((data: T) => {
    setState({
      data,
      error: null,
      isLoading: false,
      isSuccess: true,
      isError: false,
    });
  }, []);

  const setError = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
      isSuccess: false,
      isError: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, [initialData]);

  const execute = useCallback(
    async <R = T>(fn: () => Promise<R>): Promise<R | null> => {
      setLoading();
      try {
        const result = await fn();
        // Type assertion since we're using a generic that defaults to T
        setSuccess(result as unknown as T);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e : String(e));
        return null;
      }
    },
    [setLoading, setSuccess, setError]
  );

  return {
    ...state,
    setLoading,
    setSuccess,
    setError,
    reset,
    execute,
  };
}

export default useAsyncState;
