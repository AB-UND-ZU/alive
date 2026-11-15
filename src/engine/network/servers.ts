import { serverUrl } from "./url";

/** Erasing a server also gives up ownership of its remote character. */
export const createServerList = (
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">
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
      const addressUrl = serverUrl(address);
      storage.removeItem(`alive.server:${addressUrl}`);
      storage.setItem(
        key,
        JSON.stringify(list().filter((url) => url !== addressUrl))
      );
    },
  };
};
