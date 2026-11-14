export type AudioChannels = 1 | 2;

let active = true;
let muted = false;
let audioContext: AudioContext | undefined;
let masterGain: GainNode | undefined;
let activityGain: GainNode | undefined;

export const setAudioContext = (context?: AudioContext) => {
  masterGain?.disconnect();
  activityGain?.disconnect();
  audioContext = context;
  masterGain = context?.createGain();
  activityGain = context?.createGain();
  if (context && masterGain && activityGain) {
    masterGain.gain.value = muted ? 0 : 1;
    activityGain.gain.value = active ? 1 : 0;
    masterGain.connect(activityGain);
    activityGain.connect(context.destination);
  }
};

const AudioContext =
  typeof window !== "undefined"
    ? window.AudioContext || window.webkitAudioContext
    : undefined;
if (AudioContext) setAudioContext(new AudioContext());

export const setAudioActive = (enabled: boolean) => {
  if (active === enabled) return;
  active = enabled;
  if (activityGain) activityGain.gain.value = enabled ? 1 : 0;
};

export const muteAudio = () => {
  muted = true;
  if (masterGain) masterGain.gain.value = 0;
};

export const unmuteAudio = () => {
  muted = false;
  if (masterGain) masterGain.gain.value = 1;
};

export const suspendAudio = () => audioContext?.suspend();

export const ensureAudio = () => {
  const context = audioContext;
  if (!context) return;
  // Safari may stay interrupted after returning from another tab or lock screen.
  if ((context.state as string) === "interrupted") {
    return context.suspend().then(() => context.resume());
  }
  if (context.state !== "running") {
    return context.resume();
  }
};

export const isPlaying = () =>
  !!audioContext &&
  audioContext.state === "running" &&
  (masterGain?.gain.value || 0) > 0 &&
  (activityGain?.gain.value || 0) > 0;

export type SoundBuffer = {
  play: (time: number, volume?: number) => void;
};

// audio clock time after a delay in milliseconds
export const getAudioTime = (delay = 0) =>
  (audioContext?.currentTime ?? 0) + delay / 1000;

export const createSoundBuffer = (
  samples: ArrayLike<number>,
  sampleRate: number,
  channels: AudioChannels = 1
): SoundBuffer => {
  if (!audioContext || !masterGain) return { play: () => {} };
  const context = audioContext;
  const master = masterGain;
  const buffer = context.createBuffer(
    channels,
    Math.max(Math.floor(samples.length / channels), 1),
    sampleRate
  );
  if (channels === 1)
    buffer.copyToChannel(
      samples instanceof Float32Array ? samples : Float32Array.from(samples),
      0
    );
  else {
    const data = new Float32Array(Math.floor(samples.length / channels));
    for (let channel = 0; channel < channels; channel++) {
      for (let frame = 0; frame < data.length; frame++)
        data[frame] = samples[frame * channels + channel];
      buffer.copyToChannel(data, channel);
    }
  }

  return {
    play: (time, volume = 1) => {
      if (context !== audioContext) return;
      const source = context.createBufferSource();
      source.buffer = buffer;
      const gainNode = context.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(master);
      source.connect(gainNode);
      source.start(Math.max(time, context.currentTime));
    },
  };
};
