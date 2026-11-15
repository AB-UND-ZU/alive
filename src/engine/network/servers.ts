import { serverUrl } from "./url";

/** Bookmarks are separate from the credentials that own remote characters. */
export const createServerList = (
  storage: Pick<Storage, "getItem" | "setItem">
) => {
  const key = "alive.servers";
  const list = (): string[] => JSON.parse(storage.getItem(key) || "[]");
  return {
    list,
    add(address: string) {
      const url = serverUrl(address);
      storage.setItem(key, JSON.stringify([...new Set([...list(), url])]));
    },
    erase(address: string) {
      storage.setItem(
        key,
        JSON.stringify(list().filter((url) => url !== address))
      );
    },
  };
};
