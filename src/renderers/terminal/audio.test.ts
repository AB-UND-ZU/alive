import { createAudioMixer } from "./audio";

it("mixes overlapping game sounds and scheduled notes at their audio times", () => {
  const mixer = createAudioMixer(10);
  mixer.play([0.2, 0.4, 0.6], 10, 0, 1);
  mixer.play([0.4, 0.2], 10, 0.1, 0.5);
  const samples = mixer.read(4);
  [0.2, 0.6, 0.7, 0].forEach((value, index) =>
    expect(samples[index]).toBeCloseTo(value)
  );
  expect(mixer.now()).toBe(0.4);
  expect([...mixer.read(2)]).toEqual([0, 0]);
});

it("silences queued effects immediately on pause or mute", () => {
  const mixer = createAudioMixer(10);
  mixer.play([0.5, 0.5], 10, 0, 1);
  mixer.play([1], 10, 1, 1);
  mixer.stop();
  expect([...mixer.read(12)]).toEqual(Array(12).fill(0));
  mixer.play([0.25], 10, mixer.now(), 1);
  expect([...mixer.read(1)]).toEqual([0.25]);
});

it("clips summed samples and starts late notes at the current audio time", () => {
  const mixer = createAudioMixer(10);
  mixer.read(10);
  mixer.play([0.75, -0.75], 10, 0, 1);
  mixer.play([0.75, -0.75], 10, 0, 1);
  expect([...mixer.read(2)]).toEqual([1, -1]);
});

it("mixes mono sounds into both stereo channels without changing note timing", () => {
  const mixer = createAudioMixer(10, 2);
  mixer.play([0.2, 0.4], 10, 0.1, 1);
  mixer.play([0.6, -0.2, 0.2, -0.4], 10, 0.1, 0.5, 2);
  const samples = mixer.read(3);
  [0, 0, 0.5, 0.1, 0.5, 0.2].forEach((value, index) =>
    expect(samples[index]).toBeCloseTo(value)
  );
  expect(mixer.now()).toBe(0.3);
  expect([...mixer.read(1)]).toEqual([0, 0]);
});

it("downmixes stereo sources for a mono player", () => {
  const mixer = createAudioMixer(10);
  mixer.play([0.2, 0.6, 0.5, -0.5], 10, 0, 1, 2);
  const samples = mixer.read(2);
  expect(samples[0]).toBeCloseTo(0.4);
  expect(samples[1]).toBe(0);
  expect([...mixer.read(1)]).toEqual([0]);
});
