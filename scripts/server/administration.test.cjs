const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createAdministration, parseAdmins } = require("./administration.cjs");

const setup = (adminIds = ["a"]) => {
  const accounts = new Map([
    ["a", { id: "a", username: "Alice", hash: "secret" }],
    ["b", { id: "b", username: "Bob", hash: "secret" }],
    ["c", { id: "c", username: "Carol", hash: "secret" }],
  ]);
  const clients = new Map();
  for (const id of ["a", "b"]) {
    const socket = {
      readyState: 1,
      close() {
        this.readyState = 3;
      },
    };
    clients.set(socket, { account: accounts.get(id) });
  }
  let roster,
    saved = 0,
    restarts = 0;
  const characters = new Set(accounts.keys());
  const output = new Map();
  const host = {
    roster(players) {
      roster = players;
    },
    identify() {},
    named() {},
    disconnect() {},
    forget(id) {
      characters.delete(id);
    },
    reply(id, lines) {
      output.set(id, lines.join("\n"));
    },
  };
  const admin = createAdministration({
    accounts,
    clients,
    adminIds,
    simulation: () => host,
    save: async () => {
      saved++;
    },
    restart: async () => {
      restarts++;
      admin.reset();
    },
  });
  admin.sync();
  const command = async (id, ...args) => {
    const error = admin.command(id, args);
    await admin.flush();
    return error;
  };
  return {
    accounts,
    clients,
    characters,
    output,
    admin,
    command,
    roster: () => roster,
    saved: () => saved,
    restarts: () => restarts,
  };
};

test("startup IDs are repeatable UUID allowlists and reject malformed flags", () => {
  const uuid = "12345678-abcd-1234-abcd-123456789abc";
  assert.deepEqual(parseAdmins([]), []);
  assert.deepEqual(
    parseAdmins(["--admins", uuid.toUpperCase(), "--admins=" + uuid]),
    [uuid]
  );
  for (const args of [["--admins"], ["--admins", "Bob"], ["--other", uuid]])
    assert.throws(() => parseAdmins(args));
});

test("only admins execute commands; pending commands are bounded and recheck revocation", async () => {
  const s = setup();
  assert.equal(await s.command("b", "ban", "Alice"), "Commands disabled!");
  assert.equal(s.accounts.get("a").banned, undefined);
  s.admin.command("a", ["admin", "Bob", "on"]);
  s.admin.command("a", ["ban", "Carol"]);
  await s.admin.flush();
  assert.equal(s.admin.isAdmin("b"), true);
  assert.equal(s.accounts.get("c").banned, undefined);
  s.admin.command("a", ["admin", "Bob", "off"]);
  s.admin.command("b", ["ban", "Carol"]);
  await s.admin.flush();
  assert.equal(s.admin.isAdmin("b"), false);
  assert.equal(s.accounts.get("c").banned, undefined);
});

test("players filters reflect connection state; kick and kickall retain characters", async () => {
  const s = setup();
  await s.command("a", "players");
  assert.match(s.output.get("a"), /Alice[\s\S]*Bob[\s\S]*Carol/);
  await s.command("a", "players", "offline");
  assert.match(s.output.get("a"), /Carol/);
  assert.doesNotMatch(s.output.get("a"), /Bob/);
  await s.command("a", "kick", "bOB");
  assert.equal(s.roster().find((p) => p.id === "b").status, "offline");
  await s.command("a", "players", "online");
  assert.match(s.output.get("a"), /Alice/);
  assert.doesNotMatch(s.output.get("a"), /Bob|Carol/);
  await s.command("a", "kickall");
  assert.ok(s.roster().every((p) => p.status === "offline"));
  assert.equal(s.characters.size, 3);
});

test("ban removes character state and reserves both identity and case-insensitive username", async () => {
  const s = setup();
  await s.command("a", "ban", "Bob");
  assert.equal(s.characters.has("b"), false);
  assert.deepEqual(s.accounts.get("b"), {
    id: "b",
    username: "Bob",
    hash: "secret",
    banned: true,
    reset: true,
  });
  assert.equal(s.admin.choose("b", "New"), "Session unavailable!");
  s.accounts.set("d", { id: "d" });
  assert.equal(s.admin.choose("d", "bOB"), "Name already used!");
  await s.command("a", "players", "banned");
  assert.match(s.output.get("a"), /Bob/);
  await s.command("a", "ban");
  assert.match(s.output.get("a"), /Bob/);
  await s.command("a", "unban", "Bob");
  assert.equal(s.accounts.get("b").banned, false);
  assert.equal(s.accounts.get("b").reset, true);
  assert.equal(s.saved(), 2);
  await s.command("a", "unban");
  assert.equal(s.output.get("a"), "No players.");
});

test("username selection validates and persists once; returning identities retain their name", () => {
  const s = setup();
  s.accounts.set("d", { id: "d" });
  for (const name of ["", "two words", "a".repeat(17), {}, "<script>"])
    assert.match(s.admin.choose("d", name), /Use 1-16/);
  assert.equal(s.admin.choose("d", "aLiCe"), "Name already used!");
  assert.equal(s.admin.choose("d", "Dora_2"), undefined);
  assert.equal(s.accounts.get("d").username, "Dora_2");
  s.admin.choose("d", "Stolen");
  assert.equal(s.accounts.get("d").username, "Dora_2");
  assert.equal(s.saved(), 1);
});

test("admin toggles and lists work for offline players; restart restores only startup grants", async () => {
  const s = setup();
  await s.command("a", "admin", "Carol");
  assert.equal(s.admin.isAdmin("c"), true);
  await s.command("a", "admin");
  assert.match(s.output.get("a"), /Alice[\s\S]*Carol/);
  await s.command("a", "admin", "Carol");
  assert.equal(s.admin.isAdmin("c"), false);
  await s.command("a", "admin", "Bob", "on");
  await s.command("a", "restart");
  assert.equal(s.restarts(), 1);
  assert.equal(s.admin.isAdmin("a"), true);
  assert.equal(s.admin.isAdmin("b"), false);
});

test("kicking an admin discards its already queued command", async () => {
  const s = setup();
  await s.command("a", "admin", "Bob", "on");
  s.admin.command("a", ["kick", "Bob"]);
  s.admin.command("b", ["ban", "Carol"]);
  await s.admin.flush();
  assert.equal(s.accounts.get("c").banned, undefined);
});

test("banned startup players remain excluded from current admins after restart", async () => {
  const s = setup(["a", "b"]);
  await s.command("b", "ban", "Alice");
  await s.command("b", "restart");
  assert.equal(s.admin.isAdmin("a"), false);
  await s.command("b", "admin");
  assert.match(s.output.get("b"), /Bob/);
  assert.doesNotMatch(s.output.get("b"), /Alice/);
});
