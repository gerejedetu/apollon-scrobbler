import type { Repositories } from "@scrobbler/core";
import { createD1Repositories } from "@scrobbler/db-d1";
import { type LibsqlClientLike, LibsqlDriver } from "./driver.ts";

export {
  LibsqlDriver,
  LibsqlStatement,
  type LibsqlClientLike,
  type LibsqlResultSet,
} from "./driver.ts";

/** Every core repository on a Turso / libSQL database (same SQL as D1, see driver.ts). */
export function createLibsqlRepositories(db: LibsqlDriver | LibsqlClientLike): Repositories {
  return createD1Repositories(db instanceof LibsqlDriver ? db : new LibsqlDriver(db));
}
