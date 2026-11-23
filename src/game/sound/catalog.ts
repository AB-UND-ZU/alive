import { Params } from "jsfxr";
import { synthesizeSound } from "./synthesis";

const catalogKey = "/__alive__/sound-catalog";

// Bump when synthesis, its jsfxr dependency or the packed format changes.
const revision = 1;

const unpack = (buffer: ArrayBuffer, count: number) => {
  const lengths = new Uint32Array(buffer, 0, count);
  let offset = lengths.byteLength;
  const sounds = Array.from(lengths, (length) => {
    const sound = new Float32Array(buffer, offset, length);
    offset += sound.byteLength;
    return sound;
  });
  if (offset !== buffer.byteLength) throw new Error("Invalid sound catalog");
  return sounds;
};

export const loadSoundCatalog = async (params: Params[]) => {
  let cache: Cache | undefined;
  let fingerprint: string | undefined;
  try {
    cache = await caches.open("alive-sounds");
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(params))
    );
    fingerprint = revision + "-" + Array.from(new Uint8Array(digest)).join(".");
    const stored = await cache.match(catalogKey);
    if (stored?.headers.get("X-Alive-Sounds") === fingerprint) {
      return unpack(await stored.arrayBuffer(), params.length);
    }
  } catch {
    // Missing storage or an unreadable catalog is a cache miss.
  }

  const sounds = params.map(synthesizeSound);
  if (cache && fingerprint) {
    try {
      const lengths = Uint32Array.from(sounds, (sound) => sound.length);
      await cache.put(
        catalogKey,
        new Response(new Blob([lengths, ...sounds]), {
          headers: { "X-Alive-Sounds": fingerprint },
        })
      );
    } catch {
      // Storage is best effort. The generated samples are ready for playback.
    }
  }
  return sounds;
};
