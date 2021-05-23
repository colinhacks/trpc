---
id: intro
title: Usage with React
sidebar_label: Usage with React
slug: /react
---

> If you're using Next.js, read the [Usage with Next.js](/docs/nextjs) guide instead.

## Install tRPC dependencies

```bash
yarn add @trpc/client @trpc/server @trpc/react react-query zod
```

- React Query: @trpc/react provides a thin wrapper over [react-query](https://react-query.tanstack.com/overview). It is required as a peer dependency.
- Zod: most examples use Zod for input validation, though it isn't required. You can use a validation library of your choice (Yup, io-ts, etc). In fact, any object containing a `parse` or `validateSync` method will work.

## Implement your `appRouter`

Follow the [Quickstart](/docs/quickstart) and read the [`@trpc/server` docs](/docs/procedures) for guidance on this. Once you have your API implemented and listening via HTTP, continue to the next step.

## Create tRPC hooks

Create a set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.

```tsx
// utils/trpc.ts
import { createReactQueryHooks } from '@trpc/react';
import type { AppRouter } from '../server/trpc';

export const trpc = createReactQueryHooks<AppRouter>();
// => { useQuery: ..., useMutation: ...}
```

## Add tRPC providers

In your `App.tsx`

```tsx
import React from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { trpc } from './utils/trpc';

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  url: '/api/trpc',

  // optional
  getHeaders() {
    return {
      authorization: getAuthCookie(),
    };
  },
});

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* Your app here */}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

## Fetch data

```tsx
import { trpc } from '../utils/trpc';

const IndexPage = () => {
  const hello = trpc.useQuery(['hello', { text: 'client' }]);
  if (!hello.data) return <div>Loading...</div>;
  return (
    <div>
      <p>{hello.data.greeting}</p>
    </div>
  );
};

export default IndexPage;
```