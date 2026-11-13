const AudioContext =
  typeof window !== "undefined"
    ? window.AudioContext || window.webkitAudioContext
    : undefined;
const audioContext = AudioContext ? new AudioContext() : undefined;
const masterGain = audioContext?.createGain();
const activityGain = audioContext?.createGain();
if (audioContext && masterGain && activityGain) {
  if (masterGain) masterGain.gain.value = 1;
  activityGain.gain.value = 1;
  masterGain.connect(activityGain);
  activityGain.connect(audioContext.destination);
}

export const setAudioActive = (active: boolean) => {
  if (activityGain) activityGain.gain.value = active ? 1 : 0;
};

export const muteAudio = () => {
  if (masterGain) masterGain.gain.value = 0;
};

export const unmuteAudio = () => {
  if (masterGain) masterGain.gain.value = 1;
};

export const suspendAudio = () => audioContext?.suspend();

export const ensureAudio = () => {
  if (!audioContext) return;
  // Safari may stay interrupted after returning from another tab or lock screen.
  if ((audioContext.state as string) === "interrupted") {
    return audioContext.suspend().then(() => audioContext.resume());
  }
  if (audioContext.state !== "running") {
    return audioContext.resume();
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
  (audioContext?.currentTime || 0) + delay / 1000;

export const createSoundBuffer = (
  samples: ArrayLike<number>,
  sampleRate: number
): SoundBuffer => {
  if (!audioContext || !masterGain) return { play: () => {} };
  const buffer = audioContext.createBuffer(
    1,
    Math.max(samples.length, 1),
    sampleRate
  );
  buffer.getChannelData(0).set(samples);

  return {
    play: (time, volume = 1) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(masterGain);
      source.connect(gainNode);
      source.start(Math.max(time, audioContext.currentTime));
    },
  };
};
