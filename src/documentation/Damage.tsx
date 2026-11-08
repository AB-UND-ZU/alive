import { useState } from "react";
import { LargePreview } from "./LargePreview";
import { classDefinitions } from "../game/balancing/classes";
import { calculateDamage } from "../engine/systems/damage";
import { createWorld } from "../engine";
import { emptyUnitStats } from "../engine/components/stats";
import { Item } from "../engine/components/item";
import { TypedEntity } from "../engine/entities";
import { getItemSprite } from "../game/assets/utils";
import { getItemStats } from "../game/balancing/equipment";
import { getStatColor, mergeSprites } from "../game/assets/ui";
import { none } from "../game/assets/sprites";
import { colors } from "../game/assets/colors";
import { Text, Stepper, Choice, Button, StatLabel, ItemView } from "./visuals";
import "./Damage.css";
type DamageKind = "melee" | "magic" | "true";
const sword: Partial<Item> = { weapon: "sword", material: "iron" };
const wand: Partial<Item> = { weapon: "wand", skill: "wand", material: "iron" };
const shield: Partial<Item> = { offhand: "shield", material: "iron" };
export function Damage() {
  const [power, setPower] = useState(1),
    [wisdom, setWisdom] = useState(0),
    [armor, setArmor] = useState(1),
    [resist, setResist] = useState(0),
    [amount, setAmount] = useState(getItemStats(sword).melee),
    [kind, setKind] = useState<DamageKind>("melee"),
    [hp, setHp] = useState(30);
  const [world] = useState(createWorld);
  const attacker = {
    STATS: { ...emptyUnitStats, hp: 30, maxHp: 30, power, wisdom },
  } as TypedEntity;
  const defender = {
    STATS: { ...emptyUnitStats, hp, maxHp: 30, armor, resist },
  } as TypedEntity;
  const result = calculateDamage(world, { [kind]: amount }, attacker, defender);
  const damage = Number((hp - result.hp).toFixed(4));
  const health = Number(hp.toFixed(4));
  const status = `Next hit: ${damage} damage · HP ${health}/30 · Displayed hit ${result.damage}`;
  const attackerClass =
    kind === "magic" ? classDefinitions.mage : classDefinitions.rogue;
  const weapon = kind === "magic" ? wand : sword;
  const attackerSprite = mergeSprites(
    attackerClass.backdrop || none,
    attackerClass.sprite,
    getItemSprite(weapon)
  );
  const defenderSprite = mergeSprites(
    classDefinitions.knight.backdrop || none,
    getItemSprite(shield),
    classDefinitions.knight.sprite
  );
  return (
    <div className="DamagePanel" data-widget="damage">
      <section className="DamageFighter">
        <Text color={colors.white}>Attacker</Text>
        <LargePreview
          unit={{
            sprite: { ...attackerSprite, name: attackerClass.sprite.name },
          }}
        />
        <ItemView item={weapon} />
        <Choice
          label="Damage"
          value={kind}
          values={["melee", "magic", "true"]}
          onChange={(value) => {
            const next = value as DamageKind;
            setKind(next);
            if (next !== "true")
              setAmount(getItemStats(next === "magic" ? wand : sword)[next]);
          }}
        />
        <Stepper
          label="Weapon damage"
          labelContent={<Text>Item damage</Text>}
          value={amount}
          onChange={setAmount}
        />
        <Stepper
          label="Attacker Power"
          labelContent={<StatLabel stat="power" />}
          value={power}
          onChange={setPower}
        />
        <Stepper
          label="Attacker Wisdom"
          labelContent={<StatLabel stat="wisdom" />}
          value={wisdom}
          onChange={setWisdom}
        />
      </section>
      <section className="DamageFighter">
        <Text color={colors.white}>Defender</Text>
        <LargePreview
          unit={{
            sprite: {
              ...defenderSprite,
              name: classDefinitions.knight.sprite.name,
            },
          }}
        />
        <ItemView item={shield} />
        <Stepper
          label="Defender Armor"
          labelContent={<StatLabel stat="armor" />}
          value={armor}
          onChange={setArmor}
        />
        <Stepper
          label="Defender Resist"
          labelContent={<StatLabel stat="resist" />}
          value={resist}
          onChange={setResist}
        />
        <Stepper
          label="Defender HP"
          labelContent={<StatLabel stat="hp" />}
          value={hp}
          onChange={setHp}
        />
        <output className="DamageResult" aria-label={status}>
          <Text color={getStatColor(kind)}>{`${damage} damage received`}</Text>
        </output>
        <div className="ButtonRow">
          <Button palette="lime" onClick={() => setHp(result.hp)}>
            Hit
          </Button>
          <Button palette="red" onClick={() => setHp(30)}>
            Reset
          </Button>
        </div>
      </section>
    </div>
  );
}
