/* eslint-disable @typescript-eslint/no-explicit-any */
import { TRPCClient, TRPCClientError } from '@trpc/client';
import type {
  AnyRouter,
  inferHandlerInput,
  inferProcedureInput,
  inferProcedureOutput,
  inferSubscriptionOutput,
} from '@trpc/server';
import { useEffect, useMemo, useRef } from 'react';
import {
  FetchQueryOptions,
  hashQueryKey,
  QueryClient,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from 'react-query';
import {
  dehydrate,
  DehydratedState,
  DehydrateOptions,
} from 'react-query/hydration';

export type OutputWithCursor<TData, TCursor extends any = any> = {
  cursor: TCursor | null;
  data: TData;
};

const CACHE_KEY_INFINITE_QUERY = 'TRPC_INFINITE_QUERY' as const;
const CACHE_KEY_LIVE_QUERY = 'TRPC_LIVE_QUERY' as const;
const CACHE_KEY_QUERY = 'TRPC_QUERY' as const;

export function createReactQueryHooks<
  TRouter extends AnyRouter<TContext>,
  TContext
>({
  client,
  queryClient,
}: {
  client: TRPCClient<TRouter>;
  queryClient: QueryClient;
}) {
  type TQueries = TRouter['_def']['queries'];
  type TMutations = TRouter['_def']['mutations'];
  type TSubscriptions = TRouter['_def']['subscriptions'];

  function _useQuery<
    TPath extends keyof TQueries & string,
    TProcedure extends TQueries[TPath],
    TOutput extends inferProcedureOutput<TProcedure>
  >(
    pathAndArgs: [path: TPath, ...args: inferHandlerInput<TProcedure>],
    opts?: UseQueryOptions<
      inferProcedureInput<TQueries[TPath]>,
      TRPCClientError,
      TOutput
    >,
  ): UseQueryResult<TOutput, TRPCClientError> {
    const path = pathAndArgs[0];
    const input = pathAndArgs[1];
    const cacheKey = [path, input ?? null, CACHE_KEY_QUERY];

    return useQuery(cacheKey, () => client.query(...pathAndArgs) as any, opts);
  }

  function _useMutation<
    TPath extends keyof TMutations & string,
    TInput extends inferProcedureInput<TMutations[TPath]>,
    TOutput extends inferProcedureOutput<TMutations[TPath]>
  >(
    path: TPath,
    opts?: UseMutationOptions<TOutput, TRPCClientError, TInput>,
  ): UseMutationResult<TOutput, TRPCClientError, TInput> {
    const hook = useMutation<TOutput, TRPCClientError, TInput>(
      (input) => (client.mutation as any)(path, input),
      opts,
    );

    return hook;
  }
  /* istanbul ignore next */
  /**
   * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
   *  **Experimental.** API might change without major version bump
   * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠
   */
  function useSubscription<
    TPath extends keyof TSubscriptions & string,
    TInput extends inferProcedureInput<TSubscriptions[TPath]>,
    TOutput extends inferSubscriptionOutput<TRouter, TPath>
  >(
    pathAndArgs: [TPath, TInput],
    opts?: {
      enabled?: boolean;
      onError?: (err: TRPCClientError) => void;
      onBatch?: (data: TOutput[]) => void;
    },
  ) {
    const enabled = opts?.enabled ?? true;
    const queryKey = hashQueryKey(pathAndArgs);

    return useEffect(() => {
      if (!enabled) {
        return;
      }
      let stopped = false;
      const [path, input] = pathAndArgs;
      const promise = client.subscriptionOnce(path, input);
      promise
        .then((data) => {
          if (stopped) {
            return;
          }
          opts?.onBatch && opts.onBatch(data);
        })
        .catch((err) => {
          if (stopped) {
            return;
          }
          opts?.onError && opts.onError(err);
        });
      return () => {
        stopped = true;
        promise.cancel();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryKey, enabled]);
  }
  /* istanbul ignore next */
  /**
   * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
   *  **Experimental.** API might change without major version bump
   * ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠
   */
  function useLiveQuery<
    TPath extends keyof TSubscriptions & string,
    TInput extends inferProcedureInput<TSubscriptions[TPath]> & { cursor: any },
    TOutput extends (inferSubscriptionOutput<TRouter, TPath> &
      OutputWithCursor<TData>)[],
    TData
  >(
    pathAndArgs: [TPath, Omit<TInput, 'cursor'>],
    opts?: Omit<UseQueryOptions<TInput, TRPCClientError, TOutput>, 'select'>,
  ) {
    const [path, userInput] = pathAndArgs;

    const currentCursor = useRef<any>(null);
    const cacheKey = [path, userInput ?? null, CACHE_KEY_LIVE_QUERY];

    const hook = useQuery<TInput, TRPCClientError, TOutput>(
      cacheKey,
      () =>
        (client.subscriptionOnce as any)(path, {
          ...userInput,
          cursor: currentCursor.current,
        }) as any,
      opts,
    );
    const lastItem = useMemo(() => {
      const raw = hook.data;
      if (typeof raw === 'undefined') {
        return undefined;
      }
      const last = raw[raw.length - 1];
      return last;
    }, [hook.data]);

    const data: TOutput[number]['data'] | undefined = lastItem?.data;
    const lastCursor = lastItem?.cursor;

    useEffect(() => {
      currentCursor.current = lastCursor;
      hook.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastCursor]);

    return { ...hook, data };
  }

  /**
   * Create functions you can use for server-side rendering / static generation
   * @param router Your app's router
   * @param ctx Context used in the calls
   */
  function ssr(router: TRouter, ctx: TContext) {
    const caller = router.createCaller(ctx);

    const prefetchQuery = async <
      TPath extends keyof TQueries & string,
      TProcedure extends TQueries[TPath]
    >(
      ...pathAndArgs: [path: TPath, ...args: inferHandlerInput<TProcedure>]
    ) => {
      const [path, input] = pathAndArgs;
      const cacheKey = [path, input ?? null, CACHE_KEY_QUERY];

      return queryClient.prefetchQuery(cacheKey, async () => {
        const data = await caller.query(...pathAndArgs);

        return data;
      });
    };

    const prefetchInfiniteQuery = async <
      TPath extends keyof TQueries & string,
      TProcedure extends TQueries[TPath]
    >(
      ...pathAndArgs: [path: TPath, ...args: inferHandlerInput<TProcedure>]
    ) => {
      const [path, input] = pathAndArgs;
      const cacheKey = [path, input ?? null, CACHE_KEY_INFINITE_QUERY];

      return queryClient.prefetchInfiniteQuery(cacheKey, async () => {
        const data = await caller.query(...pathAndArgs);

        return data;
      });
    };

    return {
      caller,
      prefetchQuery,
      prefetchInfiniteQuery,
    };
  }

  function prefetchQuery<
    TPath extends keyof TQueries & string,
    TInput extends inferProcedureInput<TQueries[TPath]>,
    TOutput extends inferProcedureOutput<TQueries[TPath]>
  >(
    pathAndArgs: [TPath, TInput],
    opts?: FetchQueryOptions<TInput, TRPCClientError, TOutput>,
  ) {
    const [path, input] = pathAndArgs;

    return queryClient.prefetchQuery(
      pathAndArgs,
      () =>
        client.request({
          type: 'query',
          path,
          input,
        }) as any,
      opts as any,
    );
  }

  function _dehydrate(opts?: DehydrateOptions): DehydratedState {
    return client.transformer.serialize(dehydrate(queryClient, opts));
  }

  function useDehydratedState(dehydratedState?: DehydratedState) {
    const transformed: DehydratedState | undefined = useMemo(() => {
      if (!dehydratedState) {
        return dehydratedState;
      }

      return client.transformer.deserialize(dehydratedState);
    }, [dehydratedState]);
    return transformed;
  }

  function _useInfiniteQuery<
    TPath extends keyof TQueries & string,
    TInput extends inferProcedureInput<TQueries[TPath]> & { cursor: TCursor },
    TOutput extends inferProcedureOutput<TQueries[TPath]>,
    TCursor extends any
  >(
    pathAndArgs: [TPath, Omit<TInput, 'cursor'>],
    // FIXME: this typing is wrong but it works
    opts?: UseInfiniteQueryOptions<TOutput, TRPCClientError, TOutput, TOutput>,
  ) {
    const [path, input] = pathAndArgs;
    return useInfiniteQuery(
      [path, CACHE_KEY_INFINITE_QUERY, input],
      ({ pageParam }) => {
        const actualInput = { ...input, cursor: pageParam };
        return (client.query as any)(path, actualInput);
      },
      opts,
    );
  }

  return {
    client,
    dehydrate: _dehydrate,
    prefetchQuery,
    queryClient,
    useDehydratedState,
    useInfiniteQuery: _useInfiniteQuery,
    useLiveQuery,
    useMutation: _useMutation,
    useQuery: _useQuery,
    useSubscription,
    ssr,
  };
}
