import { Params, SoundEffect } from "jsfxr";
import RIFFWAVE from "./riffwave";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioContext.createGain();
masterGain.gain.value = 1;
masterGain.connect(audioContext.destination);

export const muteAudio = () => {
  masterGain.gain.value = 0;
};

export const unmuteAudio = () => {
  masterGain.gain.value = 1;
};

export const suspendAudio = () => audioContext.suspend();

export const ensureAudio = () => {
  if (!isPlaying()) {
    audioContext.resume();
  }
};

export const isPlaying = () => audioContext.state === "running";

function ResumableSoundEffectFunction(this: SoundEffect, ps: Params) {
  return SoundEffect.call(this, ps); // call parent constructor
}

export const ResumableSoundEffect =
  ResumableSoundEffectFunction as unknown as new (ps: Params) => SoundEffect;

// inherit prototype
ResumableSoundEffect.prototype = Object.create(SoundEffect.prototype);
ResumableSoundEffect.prototype.constructor = ResumableSoundEffect;

ResumableSoundEffect.prototype.generate = function () {
  var rendered = this.getRawBuffer();
  var wave = new RIFFWAVE() as any;
  wave.header.sampleRate = this.sampleRate;
  wave.header.bitsPerSample = this.bitsPerChannel;
  wave.Make(rendered.buffer);
  wave.clipping = rendered.clipped;
  wave.buffer = rendered.normalized;
  wave.getAudio = this._resumable_sfxr_getAudioFn(wave);
  return wave;
};

ResumableSoundEffect.prototype._resumable_sfxr_getAudioFn = function (
  wave: any
) {
  return function () {
    if (audioContext) {
      var buff = audioContext.createBuffer(
        1,
        wave.buffer.length,
        wave.header.sampleRate
      );
      var nowBuffering = buff.getChannelData(0);
      for (var i = 0; i < wave.buffer.length; i++) {
        nowBuffering[i] = wave.buffer[i];
      }
      var volume = 1.0;
      var obj = {
        channels: [] as AudioBufferSourceNode[],
        setVolume: function (v: number) {
          volume = v;
          return obj;
        },
        play: function () {
          var proc = audioContext.createBufferSource();
          proc.buffer = buff;
          var gainNode = audioContext.createGain();
          gainNode.gain.value = volume;
          gainNode.connect(masterGain);
          proc.connect(gainNode);
          proc.start();
          this.channels.push(proc);
          return proc;
        },
      };
      return obj;
    } else {
      var audio = new Audio();
      audio.src = wave.dataURI;
      return audio;
    }
  };
};
