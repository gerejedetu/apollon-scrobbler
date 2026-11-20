/**
 * Composition root for core: builds every service from a set of ports.
 * Apps call this once per request (it is cheap: plain objects, no I/O).
 */
import { AuthService } from "./auth/service.ts";
import { ImportService } from "./imports/service.ts";
import { ListenService } from "./listens/service.ts";
import { type Cache, type Clock, type Repositories, systemClock, type TokenVerifier } from "./ports/index.ts";
import { StatsService } from "./stats/service.ts";
import { UserService } from "./users/service.ts";

export interface ServiceOptions {
  clock?: Clock;
  /** Shared cache for expensive reads (stats). */
  cache?: Cache;
  /** Short-lived cache for token lookups. */
  authCache?: Cache;
}

export interface Services {
  auth: AuthService;
  users: UserService;
  listens: ListenService;
  stats: StatsService;
  imports: ImportService;
}

export function createServices(repos: Repositories, tokens: TokenVerifier, options: ServiceOptions = {}): Services {
  const clock = options.clock ?? systemClock;
  return {
    auth: new AuthService(repos.users, tokens, options.authCache),
    users: new UserService(repos.users, clock),
    listens: new ListenService(repos.listens, repos.playingNow, clock),
    stats: new StatsService(repos.stats, clock, options.cache),
    imports: new ImportService(repos.imports),
  };
}
