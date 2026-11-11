import { useLayoutEffect, useState } from "react";
import { play, soundPresets } from "../game/sound";
import {
  ensureAudio,
  unmuteAudio,
  muteAudio,
  setAudioActive,
} from "../game/sound/resumable";
import { displayName } from "./catalog";
import { Button, PlainTable, Text } from "./visuals";

export function Sounds() {
  const [last, setLast] = useState("");
  useLayoutEffect(
    () => () => {
      setAudioActive(false);
      muteAudio();
    },
    []
  );
  const listen = async (name: (typeof soundPresets)[number]) => {
    setAudioActive(true);
    unmuteAudio();
    await ensureAudio();
    play(name);
    setLast(name);
  };
  return (
    <div data-widget="sounds" data-last-sound={last}>
      <PlainTable
        headers={["Sound", "Play"]}
        rows={soundPresets.map((name) => [
          <Text>{name === "xp" ? "XP" : displayName(name)}</Text>,
          <Button palette="lime" onClick={() => void listen(name)}>
            Play
          </Button>,
        ])}
      />
    </div>
  );
}
