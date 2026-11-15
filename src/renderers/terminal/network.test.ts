import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createServerStorage } from "./network";

it("keeps server reconnect ownership across terminal sessions and separates host addresses", () => {
  const directory = mkdtempSync(join(tmpdir(), "alive-terminal-network-"));
  try {
    const file = join(directory, "servers.json"),
      first = createServerStorage(file);
    first.setItem(
      "alive.server:ws://host:3001/",
      JSON.stringify({ id: "a", token: "secret" })
    );
    const second = createServerStorage(file);
    expect(second.getItem("alive.server:ws://host:3001/")).toBe(
      first.getItem("alive.server:ws://host:3001/")
    );
    expect(second.getItem("alive.server:ws://other:3001/")).toBeNull();
    writeFileSync(file, "corrupt");
    expect(() => createServerStorage(file)).toThrow();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
