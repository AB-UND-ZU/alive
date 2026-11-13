const {
  randomBytes,
  randomUUID,
  createHash,
  timingSafeEqual,
} = require("node:crypto");
const { mkdir, open, readFile, rename, rm } = require("node:fs/promises");
const path = require("node:path");
const { serialize, deserialize } = require("node:v8");

const hash = (token) => createHash("sha256").update(token).digest("hex");
exports.createCredential = () => {
  const token = randomBytes(32).toString("base64url");
  return { id: randomUUID(), token, hash: hash(token) };
};
exports.verifyCredential = (expectedHash, token) => {
  if (
    typeof token !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(token) ||
    typeof expectedHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(expectedHash)
  )
    return false;
  return timingSafeEqual(
    Buffer.from(expectedHash, "hex"),
    Buffer.from(hash(token), "hex")
  );
};

/** Serialize saves in order; replace the durable file only after a complete write. */
exports.createPersistence = (file) => {
  let pending = Promise.resolve();
  const save = (data) => {
    // Capture before awaiting I/O, while the authoritative state is consistent.
    const bytes = serialize({ version: 1, data });
    const write = pending
      .catch(() => {})
      .then(async () => {
        await mkdir(path.dirname(file), { recursive: true });
        const temporary = `${file}.${process.pid}.${randomBytes(8).toString(
          "hex"
        )}.tmp`;
        let handle;
        try {
          handle = await open(temporary, "wx", 0o600);
          await handle.writeFile(bytes);
          await handle.sync();
          await handle.close();
          handle = undefined;
          await rename(temporary, file);
        } finally {
          await handle?.close();
          await rm(temporary, { force: true });
        }
      });
    pending = write;
    return write;
  };
  const load = async () => {
    await pending.catch(() => {});
    let bytes;
    try {
      bytes = await readFile(file);
    } catch (error) {
      if (error.code === "ENOENT") return undefined;
      throw error;
    }
    const stored = deserialize(bytes);
    if (stored.version !== 1)
      throw new Error("Unsupported server save version");
    return stored.data;
  };
  return { save, load };
};
