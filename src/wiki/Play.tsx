import { useState } from "react";
import { GamePreview } from "./GamePreview";
import { Button, Pixels, PlainTable, Text } from "./visuals";
import { leverOff, leverOn } from "../game/assets/sprites";
import { presets, PresetName } from "./presets";
export function Play({ base }: { base: string }) {
  const [preset, setPreset] = useState<PresetName>("menu"),
    [test, setTest] = useState(false),
    [revision, setRevision] = useState(0);
  return (
    <>
      <GamePreview
        key={`${preset}-${test}-${revision}`}
        name="game"
        base={base}
        preset={preset}
        testMode={test}
      />
      <button
        className="ModeLever"
        aria-label="Test Mode"
        aria-pressed={test}
        onClick={() => setTest(!test)}
      >
        <Pixels rows={[[test ? leverOn : leverOff]]} />
        <Text> Test Mode (commands with Enter)</Text>
      </button>
      <PlainTable
        headers={["Title", "Description", "Load"]}
        rows={Object.entries(presets).map(([key, value]) => [
          value.title,
          value.description,
          <Button
            key={key}
            palette="lime"
            onClick={() => {
              setPreset(key as PresetName);
              setRevision((n) => n + 1);
              document
                .querySelector('[data-scene="game"]')
                ?.scrollIntoView({ block: "start" });
            }}
          >
            Load
          </Button>,
        ])}
      />
    </>
  );
}
