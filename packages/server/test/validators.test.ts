/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import '@testing-library/jest-dom';
import { expectTypeOf } from 'expect-type';
import myzod from 'myzod';
// import { createSchema as tsJsonSchema, TsjsonParser } from 'ts-json-validator';
import * as yup from 'yup';
import * as z from 'zod';
import * as trpc from '../src';
import { routerToServerAndClient } from './_testHelpers';

test('no validator', async () => {
  const router = trpc.router().query('hello', {
    resolve() {
      return 'test';
    },
  });
  const { client, close } = routerToServerAndClient(router);
  const res = await client.query('hello');
  expect(res).toBe('test');
  close();
});

test('zod', async () => {
  const router = trpc.router().query('num', {
    input: z.number(),
    resolve({ input }) {
      return {
        input,
      };
    },
  });
  const { client, close } = routerToServerAndClient(router);
  const res = await client.query('num', 123);

  await expect(client.query('num', '123' as any)).rejects
    .toMatchInlineSnapshot(`
      [Error: 1 validation issue(s)

        Issue #0: invalid_type at 
        Expected number, received string
      ]
    `);
  expect(res.input).toBe(123);
  close();
});

test('yup', async () => {
  const router = trpc.router().query('num', {
    input: yup.number().required(),
    resolve({ input }) {
      expectTypeOf(input).toMatchTypeOf<number>();
      return {
        input,
      };
    },
  });
  const { client, close } = routerToServerAndClient(router);
  const res = await client.query('num', 123);

  await expect(client.query('num', 'asd' as any)).rejects.toMatchInlineSnapshot(
    `[Error: this must be a \`number\` type, but the final value was: \`NaN\` (cast from the value \`"asd"\`).]`,
  );
  expect(res.input).toBe(123);
  close();
});

test('myzod', async () => {
  const router = trpc.router().query('num', {
    input: myzod.number(),
    resolve({ input }) {
      expectTypeOf(input).toMatchTypeOf<number>();
      return {
        input,
      };
    },
  });
  const { client, close } = routerToServerAndClient(router);
  const res = await client.query('num', 123);
  await expect(client.query('num', '123' as any)).rejects.toMatchInlineSnapshot(
    `[Error: expected type to be number but got string]`,
  );
  expect(res.input).toBe(123);
  close();
});

// test('ts-json-validator', async () => {
//   const parser = new TsjsonParser(
//     tsJsonSchema({
//       type: 'number',
//     }),
//   );
//   const v = parser.parse('test')
//   const router = trpc.router().query('num', {
//     input: parser,
//     resolve({ input }) {
//       return {
//         input,
//       };
//     },
//   });
//   const { client, close } = routerToServerAndClient(router);
//   const res = await client.query('num', 123);
//   await expect(
//     client.query('num', 'asdasd' as any),
//   ).rejects.toMatchInlineSnapshot(
//     `[Error: Unexpected token a in JSON at position 0]`,
//   );
//   expect(res.input).toBe(123);
//   close();
// });

test('validator fn', async () => {
  function numParser(input: unknown) {
    if (typeof input !== 'number') {
      throw new Error('Not a number');
    }
    return input;
  }
  const router = trpc.router().query('num', {
    input: numParser,
    resolve({ input }) {
      return {
        input,
      };
    },
  });
  const { client, close } = routerToServerAndClient(router);
  const res = await client.query('num', 123);
  await expect(client.query('num', '123' as any)).rejects.toMatchInlineSnapshot(
    `[Error: Not a number]`,
  );
  expect(res.input).toBe(123);
  close();
});
