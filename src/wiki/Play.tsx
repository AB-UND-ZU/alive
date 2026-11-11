import { getWikiUnitSprite } from "./catalog";
import { useContext, useEffect, useState } from "react";
import { GamePreview } from "./GamePreview";
import { Button, Choice, Pixels, PlainTable, Text } from "./visuals";
import { leverOff, leverOn, mapDiscovery } from "../game/assets/sprites";
import { presets, PresetName } from "./presets";
import { ReferenceContext, ReferenceText } from "./references";
import { UnitKey } from "../game/balancing/units";

const bosses: Partial<Record<PresetName, UnitKey>> = {
  bandit: "tutorialBoss",
  ilex: "ilexElite",
  oak: "oakBoss",
  worm: "wormBoss",
};
export function Play({
  base,
  page = "play",
}: {
  base: string;
  page?: "play" | "menu" | "dungeon" | "island" | "bosses";
}) {
  const choices = (Object.keys(presets) as PresetName[]).filter(
    (name) =>
      page === "play" ||
      (page === "bosses"
        ? bosses[name]
        : page === "menu"
        ? name === "menu"
        : page === "dungeon"
        ? name === "dungeon" || name === "bandit"
        : presets[name].level === "LEVEL_ISLAND")
  );
  const [preset, setPreset] = useState<PresetName>(() => {
      const selected = window.location.hash
        .slice(1)
        .replace(/^scenario-/, "") as PresetName;
      return choices.includes(selected) ? selected : choices[0];
    }),
    [test, setTest] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const follow = () => {
      const selected = window.location.hash
        .slice(1)
        .replace(/^scenario-/, "") as PresetName;
      if (choices.includes(selected)) setPreset(selected);
    };
    window.addEventListener("hashchange", follow);
    window.addEventListener("popstate", follow);
    return () => {
      window.removeEventListener("hashchange", follow);
      window.removeEventListener("popstate", follow);
    };
  }, [choices]);
  const { features = {}, link } = useContext(ReferenceContext);
  const load = (name: PresetName) => {
    window.history.replaceState({}, "", "#scenario-" + name);
    setPreset(name);
    setRevision((n) => n + 1);
    document
      .querySelector('[data-scene="game"]')
      ?.scrollIntoView({ block: "start" });
  };
  const scenario = (name: PresetName) => {
    const unit = bosses[name];
    const target = unit
      ? "bosses"
      : name === "menu" || name === "dungeon"
      ? name
      : "island";
    const content = (
      <Text
        prefix={
          <Pixels rows={[[unit ? getWikiUnitSprite(unit) : mapDiscovery]]} />
        }
      >
        {presets[name].title}
      </Text>
    );
    return features[target]
      ? link(features[target].href + "#scenario-" + name, content, true)
      : content;
  };
  return (
    <>
      <GamePreview
        key={`${preset}-${test}-${revision}`}
        name="game"
        base={base}
        preset={preset}
        testMode={test}
      />
      {choices.length > 1 && page !== "bosses" && (
        <div className="ScenarioChoices">
          <Choice
            label="Scenario"
            values={choices.map((name) => presets[name].title)}
            value={presets[preset].title}
            onChange={(title) =>
              load(choices.find((name) => presets[name].title === title)!)
            }
          />
        </div>
      )}
      {page === "play" && (
        <>
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
            headers={["Scenario", "Page"]}
            rows={choices.map((name) => [
              scenario(name),
              <ReferenceText
                text={
                  bosses[name]
                    ? "Bosses"
                    : name === "menu" || name === "dungeon"
                    ? presets[name].title
                    : "Island"
                }
              />,
            ])}
          />
        </>
      )}
      {page === "bosses" && (
        <PlainTable
          headers={["Boss", "Load"]}
          rows={choices.map((name) => [
            scenario(name),
            <Button palette="lime" onClick={() => load(name)}>
              Load
            </Button>,
          ])}
        />
      )}
    </>
  );
}
