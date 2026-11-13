const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtemp, rm, readFile, writeFile, stat } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const path = require("node:path");
const {
  createPersistence,
  createCredential,
  verifyCredential,
} = require("./persistence.cjs");

const temporaryStore = async (run) => {
  const directory = await mkdtemp(path.join(tmpdir(), "alive-persistence-"));
  try {
    await run(createPersistence(path.join(directory, "world.bin")), directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

test("reconnect credentials are independent and only accept the player's secret", () => {
  const first = createCredential(),
    second = createCredential();
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.token, second.token);
  assert.equal(verifyCredential(first.hash, first.token), true);
  assert.equal(verifyCredential(first.hash, second.token), false);
  assert.equal(verifyCredential(first.hash, first.id), false);
  for (const invalid of [null, {}, "", "x".repeat(100000), first.hash])
    assert.equal(verifyCredential(first.hash, invalid), false);
});

test("server saves retain component sharing, Infinity and credential hashes across restarts", () =>
  temporaryStore(async (store, directory) => {
    assert.equal(await store.load(), undefined);
    const credential = createCredential();
    const shared = { visibility: Infinity };
    await store.save({
      snapshot: { light: shared, spawnLight: shared },
      accounts: [{ id: credential.id, hash: credential.hash }],
    });
    const restarted = createPersistence(path.join(directory, "world.bin"));
    const loaded = await restarted.load();
    assert.equal(loaded.snapshot.light, loaded.snapshot.spawnLight);
    assert.equal(loaded.snapshot.light.visibility, Infinity);
    assert.equal(
      verifyCredential(loaded.accounts[0].hash, credential.token),
      true
    );
    assert.equal(
      (await readFile(path.join(directory, "world.bin"))).includes(
        Buffer.from(credential.token)
      ),
      false
    );
    assert.equal(
      (await stat(path.join(directory, "world.bin"))).mode & 0o777,
      0o600
    );
  }));

test("concurrent saves finish in request order and capture data before mutation", () =>
  temporaryStore(async (store) => {
    const first = { generation: 1 };
    const writing = store.save(first);
    first.generation = 999;
    await writing;
    assert.deepEqual(await store.load(), { generation: 1 });
    await Promise.all([
      store.save({ generation: 2 }),
      store.save({ generation: 3 }),
    ]);
    assert.deepEqual(await store.load(), { generation: 3 });
  }));

test("a failed serialization keeps the previous save", () =>
  temporaryStore(async (store) => {
    await store.save({ generation: 1 });
    assert.throws(() => store.save({ callback() {} }));
    assert.deepEqual(await store.load(), { generation: 1 });
    await store.save({ generation: 2 });
    assert.deepEqual(await store.load(), { generation: 2 });
  }));

test("an unreadable or corrupt save fails instead of silently starting over", () =>
  temporaryStore(async (store, directory) => {
    await writeFile(path.join(directory, "world.bin"), "corrupt world");
    await assert.rejects(store.load());
  }));
