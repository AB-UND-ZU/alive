import {
  commandItems,
  commandSignatures,
  commandMods,
  commandLists,
} from "../game/assets/commands";
import { elements, materials, spells, skills } from "../engine/components/item";
import { unitStats } from "../engine/components/stats";
import { npcTypes } from "../engine/components/npc";
import { cellNames } from "../bindings/creation";

export const completeCommand = (input: string): string[] => {
  const words = input.split(" ");
  if (words.length === 1)
    return Object.keys(commandSignatures)
      .map((key) => `/${key}`)
      .filter((key) => key.startsWith(input));
  const verb = words[0].slice(1);
  const name = Object.keys(commandSignatures).find(
    (key) => key === verb || commandSignatures[key].short === verb
  );
  const index = words.length - 2;
  const last = words[words.length - 1];
  const pools: Record<string, readonly (readonly string[])[]> = {
    help: [Object.keys(commandSignatures)],
    give: [
      Object.keys(commandItems),
      ["1", "10", "99"],
      [...materials, "default"],
      words[1] === "potion" ? ["hp", "mp"] : elements,
    ],
    cast: [
      [
        ...spells,
        ...skills.filter((skill) => !["zap", "block"].includes(skill)),
      ],
      materials,
      elements,
    ],
    stat: [
      [...unitStats, ...npcTypes, "view"],
      ["0", "1", "10", "99"],
    ],
    mod: [commandMods],
    list: [commandLists],
    new: [cellNames, ["1", "3", "10"], ["up", "right", "down", "left"]],
    tp: [["hero", "target", "0,0", "4,4"]],
    focus: [["hero", "target"]],
    pin: [["target"], ["0,0", "4,4"]],
  };
  const prefix = words.slice(0, -1).join(" ") + " ";
  return [...(pools[name || ""]?.[index] || [])]
    .sort()
    .filter((value) => value.startsWith(last))
    .map((value) => prefix + value);
};
