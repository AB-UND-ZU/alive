import { useLayoutEffect, useState } from "react";
import { play, soundPresets, SoundPreset } from "../game/sound";
import {
  ensureAudio,
  unmuteAudio,
  muteAudio,
  setAudioActive,
} from "../game/sound/resumable";
import {
  displayName,
  getEffectSprite,
  getWikiUnitSprite,
  previewItem,
} from "./catalog";
import { Button, Pixels, PlainTable, Text } from "./visuals";

import { disc } from "../game/assets/templates/particles";
import * as sprites from "../game/assets/sprites";
import { getStatSprite, quest, info, forge } from "../game/assets/ui";
import { getItemSprite } from "../game/assets/utils";
import { commandItems } from "../game/assets/commands";
import { Sprite } from "../engine/components/sprite";
import { ReferenceLink, featureSprites } from "./references";

const itemSprite = (key: keyof typeof commandItems) => {
  const item = previewItem(commandItems[key]);
  return getEffectSprite(item) || getItemSprite(item, "display");
};
export const soundReferences: Record<
  SoundPreset,
  { sprite: Sprite; target: string }
> = {
  move: { sprite: getStatSprite("haste", "display"), target: "keyboard" },
  slide: { sprite: getWikiUnitSprite("orb"), target: "unit:orb" },
  hit: { sprite: itemSprite("sword"), target: "damage" },
  magic: { sprite: getStatSprite("wisdom", "display"), target: "damage" },
  pickup: { sprite: itemSprite("coin"), target: "item:coin" },
  xp: { sprite: sprites.xp, target: "stat:xp" },
  die: { sprite: sprites.tombstone1, target: "respawn" },
  bubble: { sprite: itemSprite("block"), target: "item:block" },
  sail: { sprite: sprites.boat, target: "boat" },
  rain: { sprite: sprites.rain, target: "terrain" },
  beam: { sprite: itemSprite("beam"), target: "item:beam" },
  wave: { sprite: itemSprite("wave"), target: "item:wave" },
  slash: { sprite: itemSprite("slash"), target: "item:slash" },
  talk: { sprite: sprites.dialogStart, target: "dialogs" },
  fire: { sprite: sprites.fire, target: "item:fire" },
  crackle: { sprite: sprites.campfire, target: "fireplace" },
  danger: { sprite: quest, target: "damage" },
  arrow: { sprite: itemSprite("arrow"), target: "item:arrow" },
  spear: { sprite: itemSprite("spear"), target: "item:spear" },
  disc: { sprite: disc.iron.default, target: "unit:wormBoss" },
  bolt: { sprite: itemSprite("bolt"), target: "item:bolt" },
  blast: { sprite: itemSprite("blast"), target: "item:blast" },
  trap: { sprite: itemSprite("trap"), target: "item:trap" },
  dash: { sprite: itemSprite("dash"), target: "item:dash" },
  zap: { sprite: itemSprite("zap"), target: "item:zap" },
  spark: { sprite: sprites.zapParticle, target: "item:zap" },
  block: { sprite: itemSprite("block"), target: "item:block" },
  totem: { sprite: itemSprite("totem"), target: "item:totem" },
  tool: { sprite: itemSprite("axe"), target: "item:axe" },
  harvest: { sprite: sprites.logging, target: "harvesting" },
  dig: { sprite: sprites.mining, target: "harvesting" },
  fish: { sprite: sprites.fishing, target: "fishing" },
  escape: { sprite: itemSprite("hook"), target: "item:hook" },
  build: { sprite: sprites.build, target: "building" },
  select: { sprite: sprites.caret, target: "dialogs" },
  tab: { sprite: sprites.inspect, target: "dialogs" },
  prompt: { sprite: info, target: "dialogs" },
  open: { sprite: sprites.dialogStart, target: "dialogs" },
  close: { sprite: sprites.close, target: "dialogs" },
  confirm: { sprite: sprites.resume, target: "dialogs" },
  back: { sprite: sprites.dialogEnd, target: "dialogs" },
  deny: { sprite: sprites.blocked, target: "dialogs" },
  type: { sprite: sprites.caret, target: "chat" },
  text: { sprite: sprites.dialogStart, target: "dialogs" },
  equip: { sprite: itemSprite("sword"), target: "gear" },
  anvil: { sprite: sprites.anvil, target: "anvil" },
  cling: { sprite: forge, target: "forging" },
  unlock: { sprite: itemSprite("key"), target: "item:key" },
  door: { sprite: featureSprites.door, target: "door" },
  lever: { sprite: sprites.leverOn, target: "lever" },
  snow: { sprite: sprites.snowflake, target: "terrain" },
  push: { sprite: sprites.box, target: "unit:box" },
  progress: { sprite: sprites.levelProgress, target: "stats" },
  level: { sprite: sprites.level, target: "stat:level" },
};

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
          <ReferenceLink name={soundReferences[name].target} sprite>
            <Text prefix={<Pixels rows={[[soundReferences[name].sprite]]} />}>
              {name === "xp" ? "XP" : displayName(name)}
            </Text>
          </ReferenceLink>,
          <Button palette="lime" onClick={() => void listen(name)}>
            Play
          </Button>,
        ])}
      />
    </div>
  );
}
