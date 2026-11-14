const { parseAdmins } = require("./administration.cjs");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir, homedir, networkInterfaces } = require("node:os");
const path = require("node:path");
const { buildServer } = require("./build.cjs");
const { createGameServer } = require("./transport.cjs");

(async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "alive-server-"));
  let server;
  try {
    const outfile = path.join(directory, "engine.cjs");
    await buildServer({
      stdin: {
        contents: `export {createHost} from "./src/engine/network/host";
        export {encodeState} from "./src/engine/network/codec";`,
        resolveDir: path.resolve(__dirname, "../.."),
        loader: "ts",
      },
      outfile,
    });
    const file = path.resolve(
      process.env.ALIVE_SERVER_SAVE ||
        path.join(homedir(), ".alive", "server.save")
    );
    server = await createGameServer({
      engine: require(outfile),
      adminIds: parseAdmins(process.argv.slice(2)),
      onPlayer: ({ id, username }) =>
        console.log(`Player: ${username} (${id})`),
      file,
      host: process.env.HOST || "0.0.0.0",
      port: Number(process.env.PORT || 3001),
    });
    console.log(`Alive server: ws://localhost:${server.address.port}`);
    for (const addresses of Object.values(networkInterfaces()))
      for (const address of addresses || [])
        if (address.family === "IPv4" && !address.internal)
          console.log(`LAN: ws://${address.address}:${server.address.port}`);
    console.log(`Server save: ${file}`);
    let closing = false;
    const close = async () => {
      if (closing) return;
      closing = true;
      try {
        await server.close();
        await rm(directory, { recursive: true, force: true });
      } catch (error) {
        console.error(error);
        process.exitCode = 1;
      }
    };
    process.once("SIGINT", close);
    process.once("SIGTERM", close);
  } catch (error) {
    await server?.close();
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
