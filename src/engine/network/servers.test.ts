import { createServerList } from "./servers";

it("removes the bookmark and its credentials without removing other servers", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) || null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const servers = createServerList(storage);
  const claim = JSON.stringify({ id: "same-client", token: "secret" });
  storage.setItem("alive.server:ws://localhost:3001/", claim);
  storage.setItem("alive.server:ws://other:3001/", "other-owner");
  servers.add("other:3001");
  servers.add("localhost:3001");
  servers.add("ws://localhost:3001/");
  expect(servers.list()).toEqual(["ws://other:3001/", "ws://localhost:3001/"]);
  servers.erase("localhost:3001");
  expect(servers.list()).toEqual(["ws://other:3001/"]);
  servers.add("localhost:3001");
  expect(storage.getItem("alive.server:ws://localhost:3001/")).toBeNull();
  expect(storage.getItem("alive.server:ws://other:3001/")).toBe("other-owner");
});
