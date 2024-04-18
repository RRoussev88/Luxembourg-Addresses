import { desc } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";

import { db } from "./database";
import { synchronization } from "./schema";

export const getLastSynchronizationTime: MiddlewareHandler<{
  Variables: { lastSyncTime?: Date };
}> = async (context, next) => {
  const lastSync = (
    await db
      .select({ startedAt: synchronization.startedAt })
      .from(synchronization)
      .orderBy(desc(synchronization.startedAt))
      .limit(1)
  ).pop();

  context.set("lastSyncTime", lastSync?.startedAt);
  await next();
};
