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
  aetherArmor,
  aetherCharm2,
  aetherPet2,
  aetherSword,
  appleDrop,
  arrow,
  bananaDrop,
  berryStack,
  block2,
  bolt,
  bomb,
  bow,
  charm,
  cloak1,
  cloak2,
  coconutDrop,
  compass,
  diamond,
  diamondArmor,
  diamondCharm1,
  diamondCharm2,
  diamondPet1,
  diamondPet2,
  diamondSword,
  doorClosedFire,
  doorClosedGold,
  doorClosedIron,
  doorClosedWood,
  earthArmor,
  earthBolt,
  earthCharm1,
  earthCharm2,
  earthPet1,
  earthPet2,
  earthSword,
  earthTrap,
  earthWave1,
  earthWave2,
  fireArmor,
  fireBolt,
  fireCharm1,
  fireCharm2,
  firePet1,
  firePet2,
  fireSword,
  fireTrap,
  fireWave1,
  fireWave2,
  flowerStack,
  gold,
  goldArmor,
  goldCompass,
  goldKey,
  goldSword,
  hpFlask1,
  hpFlask2,
  iron,
  ironArmor,
  ironKey,
  ironSword,
  map,
  mpFlask1,
  mpFlask2,
  none,
  pet,
  rainbowArmor,
  rainbowCharm2,
  rainbowPet2,
  rainbowSword,
  rubyArmor,
  rubyCharm2,
  rubyPet2,
  rubySword,
  slash2,
  spike,
  trap,
  voidArmor,
  voidCharm2,
  voidPet2,
  voidSword,
  waterArmor,
  waterBolt,
  waterCharm1,
  waterCharm2,
  waterPet1,
  waterPet2,
  waterSword,
  waterTrap,
  waterWave1,
  waterWave2,
  wave,
  wood,
  woodArmor,
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
export const decayHeight = 1.8 * stackHeight;
export const immersibleHeight = 2 * stackHeight;
export const lightHeight = 3 * stackHeight;
export const wallHeight = 4 * stackHeight;
export const oreHeight = 4.5 * stackHeight;
export const floatHeight = 5 * stackHeight;
export const shadowHeight = 6 * stackHeight;
export const fogHeight = 7 * stackHeight;
export const tooltipHeight = 8 * stackHeight;
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
  layerProps: LayerProps
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

  // from back to front: armor, body, spell, melee
  const orderedSegments: Segment[] = [];

  // 1. armor
  const armorEntity =
    entity[EQUIPPABLE]?.armor && world.getEntityById(entity[EQUIPPABLE].armor);
  if (armorEntity) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].armor,
      sprite: armorEntity[SPRITE],
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
    sprite:
      (entity[ENTERABLE]?.inside && entity[ENTERABLE].sprite) || entity[SPRITE],
    facing: entity[ORIENTABLE]?.facing,
    offsetX: 0,
    offsetY: 0,
    offsetZ,
    layerProps,
  });

  // 4. melee
  const meleeEntity =
    entity[EQUIPPABLE]?.melee && world.getEntityById(entity[EQUIPPABLE].melee);
  if (meleeEntity) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].melee,
      sprite: meleeEntity[SPRITE],
      facing: meleeEntity[ORIENTABLE].facing,
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
  Gear | Tools | Active | Passive | Consumable | Materialized,
  Partial<Record<Material, Sprite>>
> = {
  // gear
  melee: {
    // T1-T3
    wood: woodStick,
    iron: ironSword,
    gold: goldSword,

    // T4
    diamond: diamondSword,
    fire: fireSword,
    water: waterSword,
    earth: earthSword,

    // T5
    ruby: rubySword,
    aether: aetherSword,
    void: voidSword,
    rainbow: rainbowSword,
  },
  armor: {
    // T1-T3
    wood: woodArmor,
    iron: ironArmor,
    gold: goldArmor,

    // T4
    diamond: diamondArmor,
    fire: fireArmor,
    water: waterArmor,
    earth: earthArmor,

    // T5
    ruby: rubyArmor,
    aether: aetherArmor,
    void: voidArmor,
    rainbow: rainbowArmor,
  },

  // equipments
  slash: {
    wood: slash2,
  },
  bow: {
    wood: bow,
  },
  block: {
    wood: block2,
  },

  // spells
  wave1: {
    wood: wave,
    fire: fireWave1,
    water: waterWave1,
    earth: earthWave1,
  },
  wave2: {
    fire: fireWave2,
    water: waterWave2,
    earth: earthWave2,
  },
  bolt1: {
    wood: bolt,
    fire: fireBolt,
    water: waterBolt,
    earth: earthBolt,
  },
  bolt2: {
    fire: fireBolt,
    water: waterBolt,
    earth: earthBolt,
  },
  trap1: {
    wood: trap,
    fire: fireTrap,
    water: waterTrap,
    earth: earthTrap,
  },
  trap2: {
    fire: fireTrap,
    water: waterTrap,
    earth: earthTrap,
  },

  // activatable
  cloak1: {
    wood: cloak1,
  },
  cloak2: {
    wood: cloak2,
  },

  // passive
  charm1: {
    wood: charm,
    diamond: diamondCharm1,
    fire: fireCharm1,
    water: waterCharm1,
    earth: earthCharm1,
  },
  charm2: {
    diamond: diamondCharm2,
    fire: fireCharm2,
    water: waterCharm2,
    earth: earthCharm2,
    ruby: rubyCharm2,
    aether: aetherCharm2,
    void: voidCharm2,
    rainbow: rainbowCharm2,
  },
  pet1: {
    wood: pet,
    diamond: diamondPet1,
    fire: firePet1,
    water: waterPet1,
    earth: earthPet1,
  },
  pet2: {
    diamond: diamondPet2,
    fire: firePet2,
    water: waterPet2,
    earth: earthPet2,
    ruby: rubyPet2,
    aether: aetherPet2,
    void: voidPet2,
    rainbow: rainbowPet2,
  },

  // tools
  compass: {
    wood: compass,
    gold: goldCompass,
  },
  map: {
    wood: map,
  },

  // consumable
  key: {
    wood: none,
    iron: ironKey,
    gold: goldKey,
  },
  potion1: {
    fire: hpFlask1,
    water: mpFlask1,
  },
  potion2: {
    fire: hpFlask2,
    water: mpFlask2,
  },

  // materialized
  door: {
    wood: doorClosedWood,
    iron: doorClosedIron,
    gold: doorClosedGold,
    fire: doorClosedFire,
  },
};

const stackableSprites: Record<Stackable, Sprite> = {
  apple: appleDrop,
  banana: bananaDrop,
  coconut: coconutDrop,
  flower: flowerStack,
  berry: berryStack,
  wood: wood,
  iron: iron,
  gold: gold,
  diamond: diamond,
  spike: spike,
  worm: worm,
  arrow: arrow,
  bomb: bomb,
};

export const getItemSprite = (
  item: Omit<Item, "amount" | "carrier" | "bound"> & {
    materialized?: Materialized;
  }
) => {
  if (item.stackable) return stackableSprites[item.stackable];

  const lookup = item.equipment || item.consume || item.materialized;

  if (!lookup) return none;

  if (lookup === "active")
    return (
      (item.active && entitySprites[item.active][item.material || "wood"]) ||
      none
    );
  if (lookup === "passive")
    return (
      (item.passive && entitySprites[item.passive][item.material || "wood"]) ||
      none
    );

  return entitySprites[lookup][item.material || "wood"] || none;
};
