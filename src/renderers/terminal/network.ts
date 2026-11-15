import { mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { connectServer } from "../../engine/network/client";

export const createServerStorage = (
  file = join(
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"),
    "alive",
    "servers.json"
  )
) => {
  let values = new Map<string, string>();
  try {
    values = new Map(Object.entries(JSON.parse(readFileSync(file, "utf8"))));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const save = (next: Map<string, string>) => {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    writeFileSync(file + ".tmp", JSON.stringify(Object.fromEntries(next)), {
      mode: 0o600,
    });
    renameSync(file + ".tmp", file);
    values = next;
  };
  return {
    getItem: (key: string) => values.get(key) || null,
    setItem(key: string, value: string) {
      save(new Map(values).set(key, value));
    },
    removeItem(key: string) {
      const next = new Map(values);
      next.delete(key);
      save(next);
    },
  };
};

export const connectTerminalServer = (
  address: string,
  options: Omit<NonNullable<Parameters<typeof connectServer>[1]>, "socket">
) => {
  const { WebSocket: Socket } = require("ws") as {
    WebSocket: new (url: string) => WebSocket;
  };
  return connectServer(address, {
    ...options,
    socket: (url) => new Socket(url),
  });
};
