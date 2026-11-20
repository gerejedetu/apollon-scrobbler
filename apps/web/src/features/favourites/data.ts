import { api, type Favourite } from "../../api/index.ts";

/** How many loved tracks are read to mark hearts (newest first, pages of 100). */
const MAX_LOVED = 500;

export interface FavouritesData {
  loved: Favourite[];
  total: number;
  obsession: Favourite | null;
}

const NONE: FavouritesData = { loved: [], total: 0, obsession: null };

/** Never fails the page: without favourites (older API, network), hearts are simply not shown. */
export async function loadFavourites(userName: string): Promise<FavouritesData> {
  try {
    return await readFavourites(userName);
  } catch {
    return NONE;
  }
}

async function readFavourites(userName: string): Promise<FavouritesData> {
  const [first, obsession] = await Promise.all([
    api.favourites.loved(userName, { limit: 100 }),
    api.favourites.obsession(userName),
  ]);
  const loved = [...first.items];
  while (loved.length < Math.min(first.total, MAX_LOVED)) {
    const page = await api.favourites.loved(userName, { limit: 100, offset: loved.length });
    if (page.items.length === 0) break;
    loved.push(...page.items);
  }
  return { loved, total: first.total, obsession: obsession.obsession };
}
