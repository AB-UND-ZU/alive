import { spawnSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

it("renders scheduled stereo sounds and keeps its native clock running during JavaScript stalls", () => {
  const directory = mkdtempSync(join(tmpdir(), "alive-native-audio-"));
  try {
    const script = `
      const { buildSync } = require(${JSON.stringify(
        require.resolve("esbuild")
      )});
      const { AudioContext, OfflineAudioContext } = require(${JSON.stringify(
        require.resolve("node-web-audio-api")
      )});
      const outfile = ${JSON.stringify(join(directory, "audio.cjs"))};
      buildSync({ entryPoints: [${JSON.stringify(
        resolve(__dirname, "../../game/sound/resumable.ts")
      )}], outfile, bundle: true, platform: "node", format: "cjs" });
      const audio = require(outfile);
      (async () => {
        const offline = new OfflineAudioContext(2, 1024, 44100);
        audio.setAudioContext(offline);
        const mono = audio.createSoundBuffer(new Float32Array([0.2, 0.4]), 44100);
        const stereo = audio.createSoundBuffer(new Float32Array([0.6, -0.2, 0.2, -0.4]), 44100, 2);
        mono.play(0);
        stereo.play(0, 0.5);
        mono.play(128 / 44100, 0.25);
        const rendered = await offline.startRendering();
        const left = [...rendered.getChannelData(0)];
        const right = [...rendered.getChannelData(1)];
        const context = new AudioContext({ sampleRate: 44100, latencyHint: "interactive", sinkId: { type: "none" } });
        audio.setAudioContext(context);
        const before = audio.getAudioTime();
        const start = performance.now();
        while (performance.now() - start < 100) {}
        const elapsed = audio.getAudioTime() - before;
        audio.setAudioContext();
        await context.close();
        console.log(JSON.stringify({ left, right, elapsed }));
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `;
    const result = spawnSync(process.execPath, ["-e", script], {
      encoding: "utf8",
      timeout: 15000,
    });
    expect({ status: result.status, error: result.stderr }).toEqual({
      status: 0,
      error: "",
    });
    const { left, right, elapsed } = JSON.parse(result.stdout);
    const expected = new Map([
      [0, [0.5, 0.1]],
      [1, [0.5, 0.2]],
      [128, [0.05, 0.05]],
      [129, [0.1, 0.1]],
    ]);
    for (let index = 0; index < 1024; index++) {
      expect(left[index]).toBeCloseTo(expected.get(index)?.[0] ?? 0, 6);
      expect(right[index]).toBeCloseTo(expected.get(index)?.[1] ?? 0, 6);
    }
    expect(elapsed).toBeGreaterThan(0.04);
    expect(elapsed).toBeLessThan(0.4);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 20000);
