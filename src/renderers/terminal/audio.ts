import { setAudioContext } from "../../game/sound/resumable";

export const startTerminalAudio = () => {
  try {
    const {
      AudioContext,
    }: typeof import("node-web-audio-api") = require("node-web-audio-api");
    const context = new AudioContext({
      sampleRate: 44100,
      latencyHint: "interactive",
    });
    setAudioContext(context);
    let closed = false;
    return () => {
      if (closed) return;
      closed = true;
      setAudioContext();
      void context.close();
    };
  } catch (error) {
    process.stderr.write(
      `Sound unavailable: ${
        error instanceof Error ? error.message : String(error)
      }\n`
    );
    return undefined;
  }
};
