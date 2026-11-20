/** Cover seeds: an album is known by its artist and title, so two "Greatest Hits" differ. */
export const albumSeed = (artist: string, album?: string | null) =>
  `${artist}\u0000${album ?? artist}`;
export const artistSeed = (artist: string) => `artist\u0000${artist}`;
