import { createServerList } from "./servers";

it("removes only the bookmark and keeps the same saved character credentials when re-added", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const servers = createServerList(storage);
  const claim = JSON.stringify({ id: "same-client", token: "secret" });
  storage.setItem("alive.server:ws://localhost:3001/", claim);
  servers.add("localhost:3001");
  servers.add("ws://localhost:3001/");
  expect(servers.list()).toEqual(["ws://localhost:3001/"]);
  servers.erase("ws://localhost:3001/");
  expect(servers.list()).toEqual([]);
  servers.add("localhost:3001");
  expect(storage.getItem("alive.server:ws://localhost:3001/")).toBe(claim);
});
