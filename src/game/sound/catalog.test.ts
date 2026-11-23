import { webcrypto } from "crypto";
import { TextEncoder } from "util";
import { Params } from "jsfxr";
import { loadSoundCatalog } from "./catalog";
import * as synthesis from "./synthesis";

const entries = new Map<string, Response>();
const cache = {
  match: (key: string) => entries.get(key)?.clone(),
  put: (key: string, response: Response) => entries.set(key, response),
};

beforeAll(() => {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto });
  Object.assign(globalThis, {
    TextEncoder,
    caches: { open: async () => cache },
  });
});
beforeEach(() => entries.clear());
afterEach(() => jest.restoreAllMocks());

it("restores sample lengths and values in catalog order without generating on a hit", async () => {
  const short = new Params();
  const long = Object.assign(new Params(), { p_env_sustain: 0.8 });
  const generate = jest
    .spyOn(synthesis, "synthesizeSound")
    .mockImplementation((params) =>
      params === short ? Float32Array.of(0.5) : Float32Array.of(-1, 0.25)
    );
  const first = await loadSoundCatalog([short, long]);
  const restored = await loadSoundCatalog([short, long]);
  expect(restored).toEqual(first);
  expect(restored[0]).not.toBe(first[0]);
  expect(generate).toHaveBeenCalledTimes(2);

  expect(await loadSoundCatalog([long, short])).toEqual([first[1], first[0]]);
  expect(generate).toHaveBeenCalledTimes(4);
  expect(entries.size).toBe(1);
});

it("regenerates a truncated entry even when storage rejects the replacement", async () => {
  const params = [new Params()];
  const generated = await loadSoundCatalog(params);
  const [[key, stored]] = Array.from(entries);
  entries.set(key, new Response(new Blob([]), { headers: stored.headers }));
  const generate = jest.spyOn(synthesis, "synthesizeSound");
  const write = jest.spyOn(cache, "put").mockImplementation(() => {
    throw new DOMException("Storage full", "QuotaExceededError");
  });

  expect(await loadSoundCatalog(params)).toEqual(generated);
  expect(generate).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledTimes(1);
});
