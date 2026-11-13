const { build } = require("esbuild");

// Node has no Web Worker sound synthesis; the browser keeps its CRA worker.
const headlessWorker = {
  name: "headless-sound-worker",
  setup(builder) {
    builder.onLoad({ filter: /game\/sound\/createWorker\.ts$/ }, () => ({
      contents: "export const createSoundWorker = () => undefined;",
      loader: "ts",
    }));
  },
};

exports.buildServer = (options) =>
  build({
    bundle: true,
    platform: "node",
    format: "cjs",
    loader: { ".css": "empty" },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.PUBLIC_URL": '""',
    },
    plugins: [headlessWorker],
    ...options,
  });
