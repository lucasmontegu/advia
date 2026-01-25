import { env } from "@driwet/env/server";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Re-export drizzle-orm operators for convenience
export { eq, ne, gt, gte, lt, lte, and, or, not, isNull, isNotNull, inArray, notInArray, sql as sqlOperator } from "drizzle-orm";
