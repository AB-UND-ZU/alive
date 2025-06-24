import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { Layer, SPRITE, Sprite } from "../../engine/components/sprite";
import { World } from "../../engine";
import { Segment } from "./Stack";
import { Entity } from "ecs";
import { EQUIPPABLE, Gear, Tools } from "../../engine/components/equippable";
import { LayerProps } from "./Layer";
import {
  Active,
  Consumable,
  Item,
  Material,
  Materialized,
  Passive,
  Stackable,
} from "../../engine/components/item";
import { LIGHT } from "../../engine/components/light";
import { FOG } from "../../engine/components/fog";
import { TRACKABLE } from "../../engine/components/trackable";
import {
  aetherCharm2,
  aetherPet2,
  aetherShield,
  aetherSword,
  apple,
  appleDrop,
  arrow,
  banana,
  bananaDrop,
  beamSpell,
  berryStack,
  blockActive,
  bombActive,
  bowActive,
  charge,
  charm,
  cloak1,
  cloak2,
  coconut,
  coconutDrop,
  compass,
  crystal,
  diamond,
  diamondCharm1,
  diamondCharm2,
  diamondPet1,
  diamondPet2,
  diamondShield,
  diamondSword,
  doorClosedFire,
  doorClosedGold,
  doorClosedIron,
  doorClosedWood,
  earthBeam1Spell,
  earthBeam2Spell,
  earthCharm1,
  earthCharm2,
  earthEssence,
  earthPet1,
  earthPet2,
  earthShield,
  earthSword,
  earthTrap,
  earthWave1Spell,
  earthWave2Spell,
  fireBeam1Spell,
  fireBeam2Spell,
  fireCharm1,
  fireCharm2,
  fireEssence,
  firePet1,
  firePet2,
  fireShield,
  fireSword,
  fireTrap,
  fireWave1Spell,
  fireWave2Spell,
  flowerStack,
  gem,
  gold,
  goldKey,
  goldShield,
  goldSword,
  hpFlask1,
  hpFlask2,
  iron,
  ironKey,
  ironShield,
  ironSword,
  leaf,
  map,
  mpFlask1,
  mpFlask2,
  none,
  pet,
  rainbowCharm2,
  rainbowPet2,
  rainbowShield,
  rainbowSword,
  rubyCharm2,
  rubyPet2,
  rubyShield,
  rubySword,
  seed,
  shroom,
  slashActive,
  torch,
  trap,
  voidCharm2,
  voidPet2,
  voidShield,
  voidSword,
  waterBeam1Spell,
  waterBeam2Spell,
  waterCharm1,
  waterCharm2,
  waterEssence,
  waterPet1,
  waterPet2,
  waterShield,
  waterSword,
  waterTrap,
  waterWave1Spell,
  waterWave2Spell,
  waveSpell,
  wood,
  woodShield,
  woodStick,
  worm,
} from "../../game/assets/sprites";
import { ENTERABLE } from "../../engine/components/enterable";

export const textSize = 18 / 25 + 0.001;

export const stack = 1000;
export const stackHeight = 1;

// odd values because i don't want to recalculate brightness values
export const terrainHeight = 0 * stackHeight;
export const effectHeight = 0.5 * stackHeight;
export const unitHeight = 1 * stackHeight;
export const lootHeight = 1.1 * stackHeight;
export const dotsHeight = 1.5 * stackHeight;
export const decayHeight = 1.8 * stackHeight;
export const immersibleHeight = 2 * stackHeight;
export const lightHeight = 3 * stackHeight;
export const wallHeight = 4 * stackHeight;
export const oreHeight = 4.5 * stackHeight;
export const floatHeight = 5 * stackHeight;
export const shadowHeight = 6 * stackHeight;
export const fogHeight = 7 * stackHeight;
export const idleHeight = 8 * stackHeight;
export const tooltipHeight = 8.5 * stackHeight;
export const dialogHeight = 9 * stackHeight;
export const focusHeight = 9.5 * stackHeight;
export const particleHeight = 10 * stackHeight;
export const cameraHeight = 11 * stackHeight;

export const getFacingLayers = (
  world: World,
  sprite: Sprite,
  facing?: Orientation,
  amount?: number
) => {
  let layers;
  if (facing && sprite.facing?.[facing]) layers = sprite.facing[facing];

  if (amount && sprite.amounts) {
    if (amount === 1) layers = sprite.amounts.single;
    else if (amount === 2) layers = sprite.amounts.double;
    else layers = sprite.amounts.multiple;
  }

  return layers || sprite.layers;
};

export const getSegments = (
  world: World,
  entity: Entity,
  layerProps: LayerProps,
  inside?: boolean
) => {
  const isAir = entity[FOG]?.type === "air";
  const isFloat = entity[FOG]?.type === "float";
  const isUnit = entity[FOG]?.type === "unit";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;

  const offsetZ = isOpaque
    ? wallHeight
    : isUnit
    ? unitHeight
    : isAir
    ? fogHeight
    : isFloat
    ? floatHeight
    : terrainHeight;

  // from back to front: shield, body, spell, sword
  const orderedSegments: Segment[] = [];

  // 1. shield
  const shieldEntity =
    entity[EQUIPPABLE]?.shield &&
    world.getEntityById(entity[EQUIPPABLE].shield);
  if (shieldEntity) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].shield,
      sprite: shieldEntity[SPRITE],
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        ...layerProps,
        isTransparent: false,
      },
    });
  }

  // 2. body
  orderedSegments.push({
    id: world.getEntityId(entity),
    sprite: (inside && entity[ENTERABLE]?.sprite) || entity[SPRITE],
    facing: entity[ORIENTABLE]?.facing,
    offsetX: 0,
    offsetY: 0,
    offsetZ,
    layerProps,
  });

  // 4. sword
  const swordEntity =
    entity[EQUIPPABLE]?.sword && world.getEntityById(entity[EQUIPPABLE].sword);
  if (swordEntity) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].sword,
      sprite: swordEntity[SPRITE],
      facing: swordEntity[ORIENTABLE].facing,
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        ...layerProps,
        isTransparent: false,
      },
    });
  }

  return orderedSegments;
};

export const createSprite = (world: World, entityId: number) => {
  const layers: Layer[] = [];
  const entity = world.assertById(entityId);
  const segments = getSegments(world, entity, {
    isTransparent: false,
    receiveShadow: false,
  });

  segments.forEach((segment) => {
    layers.push(
      ...getFacingLayers(
        world,
        segment.sprite,
        entity[TRACKABLE] ? segment.facing : undefined
      )
    );
  });

  return {
    name: "sprite_generic",
    layers,
  };
};

// depending on the distance between camera, object and light,
// the brightness might need to be adjusted to match the original
export const offsetFactors: Record<number, number> = {
  1: 1.41,
  1.1: 1.46,
  1.5: 1.77,
};

// scalar value factor for colors in shadow
export const shadowFactor = 0.125;

const entitySprites: Record<
  Gear | Tools | Active | Passive | Stackable | Consumable | Materialized,
  Partial<Record<Material | "default", { sprite: Sprite; resource?: Sprite }>>
> = {
  // gear
  sword: {
    // T1-T3
    wood: { sprite: woodStick },
    iron: { sprite: ironSword },
    gold: { sprite: goldSword },

    // T4
    diamond: { sprite: diamondSword },
    fire: { sprite: fireSword },
    water: { sprite: waterSword },
    earth: { sprite: earthSword },

    // T5
    ruby: { sprite: rubySword },
    aether: { sprite: aetherSword },
    void: { sprite: voidSword },
    rainbow: { sprite: rainbowSword },
  },
  shield: {
    // T1-T3
    wood: { sprite: woodShield },
    iron: { sprite: ironShield },
    gold: { sprite: goldShield },

    // T4
    diamond: { sprite: diamondShield },
    fire: { sprite: fireShield },
    water: { sprite: waterShield },
    earth: { sprite: earthShield },

    // T5
    ruby: { sprite: rubyShield },
    aether: { sprite: aetherShield },
    void: { sprite: voidShield },
    rainbow: { sprite: rainbowShield },
  },

  // equipments
  slash: {
    default: { sprite: slashActive },
  },
  bow: {
    default: { sprite: bowActive },
  },
  block: {
    default: { sprite: blockActive },
  },

  // spells
  wave1: {
    default: { sprite: waveSpell },
    fire: { sprite: fireWave1Spell },
    water: { sprite: waterWave1Spell },
    earth: { sprite: earthWave1Spell },
  },
  wave2: {
    fire: { sprite: fireWave2Spell },
    water: { sprite: waterWave2Spell },
    earth: { sprite: earthWave2Spell },
  },
  beam1: {
    default: { sprite: beamSpell },
    fire: { sprite: fireBeam1Spell },
    water: { sprite: waterBeam1Spell },
    earth: { sprite: earthBeam1Spell },
  },
  beam2: {
    fire: { sprite: fireBeam2Spell },
    water: { sprite: waterBeam2Spell },
    earth: { sprite: earthBeam2Spell },
  },
  trap1: {
    default: { sprite: trap },
    fire: { sprite: fireTrap },
    water: { sprite: waterTrap },
    earth: { sprite: earthTrap },
  },
  trap2: {
    fire: { sprite: fireTrap },
    water: { sprite: waterTrap },
    earth: { sprite: earthTrap },
  },

  // activatable
  cloak1: {
    default: { sprite: cloak1 },
  },
  cloak2: {
    default: { sprite: cloak2 },
  },

  // passive
  charm1: {
    wood: { sprite: charm },
    diamond: { sprite: diamondCharm1 },
    fire: { sprite: fireCharm1 },
    water: { sprite: waterCharm1 },
    earth: { sprite: earthCharm1 },
  },
  charm2: {
    diamond: { sprite: diamondCharm2 },
    fire: { sprite: fireCharm2 },
    water: { sprite: waterCharm2 },
    earth: { sprite: earthCharm2 },
    ruby: { sprite: rubyCharm2 },
    aether: { sprite: aetherCharm2 },
    void: { sprite: voidCharm2 },
    rainbow: { sprite: rainbowCharm2 },
  },
  pet1: {
    wood: { sprite: pet },
    diamond: { sprite: diamondPet1 },
    fire: { sprite: firePet1 },
    water: { sprite: waterPet1 },
    earth: { sprite: earthPet1 },
  },
  pet2: {
    diamond: { sprite: diamondPet2 },
    fire: { sprite: firePet2 },
    water: { sprite: waterPet2 },
    earth: { sprite: earthPet2 },
    ruby: { sprite: rubyPet2 },
    aether: { sprite: aetherPet2 },
    void: { sprite: voidPet2 },
    rainbow: { sprite: rainbowPet2 },
  },

  // tools
  compass: {
    default: { sprite: compass },
  },
  map: {
    default: { sprite: map },
  },
  torch: {
    default: { sprite: torch },
  },

  // consumable
  key: {
    wood: { sprite: none },
    iron: { sprite: ironKey },
    gold: { sprite: goldKey },
  },
  potion1: {
    fire: { sprite: hpFlask1 },
    water: { sprite: mpFlask1 },
  },
  potion2: {
    fire: { sprite: hpFlask2 },
    water: { sprite: mpFlask2 },
  },

  // materialized
  door: {
    wood: { sprite: doorClosedWood },
    iron: { sprite: doorClosedIron },
    gold: { sprite: doorClosedGold },
    fire: { sprite: doorClosedFire },
  },

  // stackable
  apple: { default: { sprite: appleDrop, resource: apple } },
  shroom: { default: { sprite: shroom } },
  banana: { default: { sprite: bananaDrop, resource: banana } },
  coconut: { default: { sprite: coconutDrop, resource: coconut } },
  gem: { default: { sprite: gem } },
  crystal: { default: { sprite: crystal } },
  flower: { default: { sprite: flowerStack } },
  berry: { default: { sprite: berryStack } },
  resource: {
    wood: { sprite: wood },
    iron: { sprite: iron },
    gold: { sprite: gold },
    fire: { sprite: fireEssence },
    water: { sprite: waterEssence },
    earth: { sprite: earthEssence },
    diamond: { sprite: diamond },
  },
  leaf: { default: { sprite: leaf } },
  seed: { default: { sprite: seed } },
  worm: { default: { sprite: worm } },
  arrow: { default: { sprite: arrow } },
  bomb: { default: { sprite: bombActive } },
  charge: { default: { sprite: charge } },
};

export const getItemSprite = (
  item: Omit<Item, "amount" | "carrier" | "bound"> & {
    materialized?: Materialized;
  },
  variant?: "resource"
) => {
  const material = item.material || "default";
  if (item.stackable) {
    const spriteConfig = entitySprites[item.stackable][material];
    return (
      (variant === "resource" && spriteConfig?.resource) ||
      spriteConfig?.sprite ||
      none
    );
  }

  const lookup = item.equipment || item.consume || item.materialized;

  if (!lookup) return none;

  if (lookup === "active")
    return (
      (item.active && entitySprites[item.active][material]?.sprite) || none
    );
  if (lookup === "passive")
    return (
      (item.passive && entitySprites[item.passive][material]?.sprite) || none
    );

  // don't render claws
  if (lookup === "sword" && !item.material) return none;

  return entitySprites[lookup][material]?.sprite || none;
};
