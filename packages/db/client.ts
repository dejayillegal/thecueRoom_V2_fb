import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';
const client = postgres(connectionString, {
  types: {
    date: {
      to: 1184,
      from: [1082, 1083, 1114, 1184],
      serialize: (x: any) => {
        if (x === null || x === undefined) return null;
        if (typeof x === 'string') return x;
        if (x instanceof Date) return x.toISOString();
        if (typeof x.toISOString === 'function') return x.toISOString();
        return String(x);
      },
      parse: (x: string) => x,
    },
  },
});

export const db = drizzle(client, { schema });
