import { Accessory } from "../../engine/components/equippable";
import {
  Craftable,
  Reloadable,
  Element,
  Material,
  Item,
  ItemStats,
  Consumable,
  Materialized,
  Offhand,
  ResourceItem,
  Skill,
  Spell,
  Tool,
  Weapon,
  emptyItemStats,
  ITEM,
} from "../../engine/components/item";
import { Sprite } from "../../engine/components/sprite";
import { UnitStats } from "../../engine/components/stats";
import {
  consumptionConfigs,
  getItemConsumption,
} from "../../engine/systems/consume";
import { ClassKey, getClassData } from "../balancing/classes";
import { getItemStats } from "../balancing/equipment";
import { colors } from "./colors";
import { brightenSprites, plot } from "./ui";
import {
  scout,
  rogue,
  mage,
  knight,
  alien,
  coin,
  stick,
  tree1,
  tree2,
  plank,
  oreDrop,
  ore,
  oreDisplay,
  berryDrop,
  berry,
  flowerDrop,
  flower,
  leaf,
  hedge1,
  hedge2,
  grain,
  grass,
  bush,
  soilWet,
  wheat,
  farming,
  bread,
  appleDrop,
  apple,
  shroom,
  bananaDrop,
  banana,
  coconutDrop,
  coconut,
  mineral,
  rock2,
  crystal,
  rock1,
  herb,
  fruit,
  sapling,
  thorn,
  cactus1,
  spore,
  ingot,
  nugget,
  worm,
  fishing,
  salmon,
  tuna,
  pike,
  cod,
  algae,
  eel,
  swimmingEel,
  pearl,
  seastar,
  curry,
  soup,
  tea,
  toast,
  juice,
  granola,
  arrow,
  bombActive,
  charge,
  golemHead,
  letter,
  schema,
  sandBlock,
  waterShallow,
  gravelBlock,
  path,
  level,
  xp,
  heart,
  heartUp,
  mana,
  manaUp,
  power,
  meleeHit,
  wisdom,
  magicHit,
  armor,
  resist,
  haste,
  vision,
  fog,
  damp,
  fire,
  thaw,
  freeze,
  spike,
  absorb,
  aura,
  bubble,
  diamond,
  gold,
  goldMine,
  goldMineDisplay,
  iron,
  ironMine,
  ironMineDisplay,
  ruby,
  skillSlot,
  soil,
  stats,
  times,
  wall,
  wood,
  repair,
  egg,
  chick,
} from "./sprites";
import {
  createCountable,
  createText,
  getBlockedSlot,
  getStatColor,
  maxCountable,
  minCountable,
  stretch,
} from "./ui";
import { colorPalettes, PartialSpriteTemplate } from "./templates";
import {
  sword,
  spear,
  wand,
  shield,
  ring,
  amulet,
  axe,
  hook,
  pickaxe,
  shovel,
  hammer,
  compass,
  map,
  torch,
  boots,
  waveSpell,
  beamSpell,
  trapSpell,
  dashSpell,
  slash,
  bow,
  zap,
  block,
  totem,
} from "./templates/equipments";
import { key, bucket, spirit, bottle, flask, potion } from "./templates/items";
import {
  lock,
  doorOpen,
  doorClosed,
  portOpen,
  portClosed,
  entryClosed,
  entryClosedDisplay,
  fenceDoorClosed,
  fenceDoorOpen,
  palisadeDoorOpen,
  palisadeDoorClosed,
} from "./templates/units";
import {
  frameWidth,
  getUnitSprite,
  createItemName,
  createItemText,
  createUnitName,
  getItemSprite,
  getItemConfig,
} from "./utils";

export type PartialDescriptionTemplate = Partial<
  Record<Material | "default", Partial<Record<Element | "default", Sprite[][]>>>
>;

export const entitySprites: Record<
  Craftable | Reloadable | keyof UnitStats | ClassKey,
  SpriteDefinition
> = {
  // classes
  scout: {
    sprite: scout,
  },
  rogue: {
    sprite: rogue,
    getDescription: () => {
      const { stats } = getClassData("rogue");

      return [
        createText("Fast and strong."),
        stretch(
          createCountable(stats, "hp", "progression"),
          [
            ...createText("+", getStatColor("power")),
            ...createCountable(stats, "power", "display"),
          ],
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          [
            ...createText("+", getStatColor("haste")),
            ...createCountable(stats, "haste", "display"),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  mage: {
    sprite: mage,
    getDescription: () => {
      const { stats } = getClassData("mage");

      return [
        createText("Powerful spells."),
        stretch(
          createCountable(stats, "hp", "progression"),
          [
            ...createText("+", getStatColor("wisdom")),
            ...createCountable(stats, "wisdom", "display"),
          ],
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          [
            ...createText("+", getStatColor("vision")),
            ...createCountable(stats, "vision", "display"),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  knight: {
    sprite: knight,
    getDescription: () => {
      const { stats } = getClassData("knight");

      return [
        createText("Survives a lot."),
        stretch(
          createCountable(stats, "hp", "progression"),
          [
            ...createText("+", getStatColor("armor")),
            ...createCountable(stats, "armor", "display"),
          ],
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          [
            ...createText("+", getStatColor("resist")),
            ...createCountable(stats, "resist", "display"),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  "???": {
    sprite: alien,
    getDescription: () => {
      const { stats } = getClassData("???");

      return [
        createText("??¿ ?¿¿?¿ ¿? ??"),
        stretch(
          createCountable(stats, "hp", "progression"),
          [
            ...createText("+", getStatColor("damp")),
            ...createCountable(stats, "damp", "display"),
          ],
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "spike", "display"),
          [
            ...createText("+", getStatColor("thaw")),
            ...createCountable(stats, "thaw", "display"),
          ],
          frameWidth - 2
        ),
      ];
    },
  },

  // stackable
  coin: {
    sprite: coin,
    display: minCountable(coin),
    getDescription: () => [
      createText("The currency to"),
      createText("buy items. Drops"),
      [
        ...createText("from "),
        getUnitSprite("prism"),
        getUnitSprite("goldEye"),
        getUnitSprite("diamondOrb"),
        getUnitSprite("banditKnight"),
        ...createText("Enemies", colors.maroon),
        ...createText("."),
      ],
    ],
  },
  stick: {
    sprite: stick,
    display: minCountable(stick),
    getDescription: () => [
      createText("Branch which fell"),
      [
        ...createText("from a "),
        tree1,
        tree2,
        ...createText("Tree", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Craft into "),
        ...createItemName({ stackable: "resource", material: "wood" }),
        ...createText("."),
      ],
    ],
  },
  plank: {
    sprite: plank,
    getDescription: () => [
      createText("Sturdy board made"),
      [
        ...createText("from "),
        ...createItemName({ stackable: "resource", material: "wood" }),
        ...createText("."),
      ],
    ],
  },
  ore: {
    sprite: oreDrop,
    resource: ore,
    display: minCountable(oreDrop),
    getDescription: () => [
      createText("Traces of metal"),
      [
        ...createText("found in a "),
        oreDisplay,
        ...createText("Rock", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Craft into "),
        ...createItemName({ stackable: "resource", material: "iron" }),
        ...createText("."),
      ],
    ],
  },
  berry: {
    sprite: berryDrop,
    resource: berry,
    display: minCountable(berryDrop),
    getDescription: () => [
      createText("Tasty berry found"),
      [
        ...createText("on a "),
        maxCountable(berry),
        ...createText("Bush", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Brews to "),
        ...createItemName({ stackable: "fruit" }),
        ...createText("."),
      ],
    ],
  },
  flower: {
    sprite: flowerDrop,
    resource: flower,
    display: minCountable(flowerDrop),
    getDescription: () => [
      createText("Beautiful flower"),
      [
        ...createText("from the "),
        maxCountable(flower),
        ...createText("Grass", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Brews into "),
        ...createItemName({ stackable: "herb" }),
        ...createText("."),
      ],
    ],
  },
  leaf: {
    sprite: leaf,
    display: minCountable(leaf),
    getDescription: () => [
      createText("A green leaf from"),
      [
        ...createText("a "),
        hedge1,
        hedge2,
        ...createText("Hedge", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Brew to "),
        ...createItemName({ stackable: "sapling" }),
        ...createText("."),
      ],
    ],
  },
  grain: {
    sprite: grain,
    getDescription: () => [
      createText("A small corn from"),
      [
        ...createText("the "),
        grass,
        bush,
        ...createText("Grass", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Plant on "),
        soilWet,
        ...createText("Soil", colors.grey),
        ...createText("."),
      ],
    ],
  },
  wheat: {
    sprite: wheat,
    getDescription: () => [
      createText("Golden grain used"),
      [
        ...createText("for "),
        farming,
        ...createText("Farming", colors.green),
        ...createText(" and"),
      ],
      [
        ...createText("making "),
        ...createItemName({ stackable: "bread" }),
        ...createText("."),
      ],
    ],
  },
  bread: {
    sprite: bread,
    getDescription: (stats) => [
      createText("Crunchy loaf,"),
      createText("a perfect snack."),
      createCountable(stats, "hp", "display"),
    ],
  },
  egg: {
    sprite: egg,
    getDescription: (stats) => [
      [
        ...createText("From a "),
        chick,
        ...createText("Chick", colors.grey),
        ...createText(","),
      ],
      createText("handle with care."),
      createCountable(stats, "hp", "display"),
    ],
  },
  apple: {
    sprite: appleDrop,
    resource: apple,
    getDescription: (stats) => [
      createText("Crisp apple from"),
      [
        ...createText("a "),
        minCountable(apple),
        ...createText("Tree", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "hp", "display"),
    ],
  },
  shroom: {
    sprite: shroom,
    getDescription: (stats) => [
      createText("A savoury shroom"),
      createText("from the forest."),
      createCountable(stats, "mp", "display"),
    ],
  },
  banana: {
    sprite: bananaDrop,
    resource: banana,
    getDescription: (stats) => [
      createText("Ripe banana from"),
      [
        ...createText("a "),
        minCountable(banana),
        ...createText("Palm", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "hp", "display"),
    ],
  },
  coconut: {
    sprite: coconutDrop,
    resource: coconut,
    getDescription: (stats) => [
      createText("A tender coconut"),
      [
        ...createText("from a "),
        minCountable(coconut),
        ...createText("Palm", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "mp", "display"),
    ],
  },
  mineral: {
    sprite: mineral,
    getDescription: () => [
      createText("A pure deposit"),
      createText("from a round"),
      [rock2, ...createText("Stone", colors.grey), ...createText(".")],
    ],
  },
  crystal: {
    sprite: crystal,
    getDescription: () => [
      createText("A sparkly crystal"),
      createText("from a sharp"),
      [rock1, ...createText("Stone", colors.grey), ...createText(".")],
    ],
  },
  herb: {
    sprite: herb,
    getDescription: (stats) => [
      [...createItemName({ stackable: "flower" }), ...createText(" extract.")],
      [
        ...createText("Base for "),
        ...createItemName({
          consume: "potion",
          material: "iron",
          stat: "mp",
        }),
        ...createText("."),
      ],
      createCountable(stats, "mp", "display"),
    ],
  },
  fruit: {
    sprite: fruit,
    getDescription: (stats) => [
      [
        ...createText("Made from "),
        ...createItemName({ stackable: "berry" }),
        ...createText("."),
      ],
      [
        ...createText("Base for "),
        ...createItemName({
          consume: "potion",
          material: "iron",
          stat: "hp",
        }),
        ...createText("."),
      ],
      createCountable(stats, "hp", "display"),
    ],
  },
  sapling: {
    sprite: sapling,
    getDescription: (stats) => [
      createText("About to sprout."),
      [
        ...createText("Made from "),
        ...createItemName({ stackable: "leaf" }),
        ...createText("."),
      ],
      createCountable(stats, "xp", "display"),
    ],
  },
  thorn: {
    sprite: thorn,
    getDescription: (stats) => [
      createText("Sharp needle from"),
      [
        ...createText("a "),
        cactus1,
        ...createText("Cactus", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "hp", "display"),
    ],
  },
  spore: {
    sprite: spore,
    getDescription: () => [
      createText("Tiny seeds taken"),
      [
        ...createText("from a "),
        ...createItemName({ stackable: "shroom" }),
        ...createText("."),
      ],
      [
        ...createText("Regrows on "),
        soilWet,
        ...createText("Soil", colors.grey),
        ...createText("."),
      ],
    ],
  },
  ingot: {
    sprite: ingot,
    getDescription: () => [
      createText("Valuable bar made"),
      [
        ...createText("from "),
        ...createItemName({
          stackable: "resource",
          material: "gold",
        }),
        ...createText(" worth"),
      ],
      [
        ...createItemText({
          amount: 1000,
          stackable: "coin",
        }),
        ...createText("."),
      ],
    ],
  },
  nugget: {
    sprite: nugget,
    getDescription: () => [
      createText("A small clump of"),
      createText("raw gold worth"),
      [
        ...createItemText({
          amount: 10,
          stackable: "coin",
        }),
        ...createText("."),
      ],
    ],
  },
  worm: {
    sprite: worm,
    getDescription: () => [
      createText("A tasty bait used"),
      [
        ...createText("for "),
        fishing,
        ...createText("Fishing", colors.green),
        ...createText("."),
      ],
    ],
  },
  salmon: {
    sprite: salmon,
    getDescription: (stats) => [
      createText("A delicious fish"),
      createText("with red meat."),
      createCountable(stats, "hp", "display"),
    ],
  },
  tuna: {
    sprite: tuna,
    getDescription: (stats) => [
      createText("A large fish with"),
      createText("dark red meat."),
      createCountable(stats, "hp", "display"),
    ],
  },
  pike: {
    sprite: pike,
    getDescription: (stats) => [
      createText("A fierce fish"),
      createText("with white meat."),
      createCountable(stats, "mp", "display"),
    ],
  },
  cod: {
    sprite: cod,
    getDescription: (stats) => [
      createText("A mild fish with"),
      createText("white flaky meat."),
      createCountable(stats, "mp", "display"),
    ],
  },
  algae: {
    sprite: algae,
    getDescription: (stats) => [
      createText("Slimy green algae"),
      createText("from the ocean."),
      createCountable(stats, "xp", "display"),
    ],
  },
  eel: {
    sprite: eel,
    resource: swimmingEel,
    getDescription: (stats) => [
      createText("A slithering fish"),
      createText("with smooth skin."),
      createCountable(stats, "xp", "display"),
    ],
  },
  pearl: {
    sprite: pearl,
    getDescription: () => [
      createText("An exceptionally"),
      createText("rare creation of"),
      createText("an oyster."),
    ],
  },
  seastar: {
    sprite: seastar,
    getDescription: () => [
      createText("A colorful star-"),
      createText("shaped creature."),
      createText("Not edible."),
    ],
  },
  curry: {
    sprite: curry,
    getDescription: (stats) => [
      createText("Creamy mushroom"),
      createText("coconut curry."),
      createCountable(stats, "mp", "display", true),
    ],
  },
  soup: {
    sprite: soup,
    getDescription: (stats) => [
      createText("A thick and rich"),
      createText("fish broth."),
      createCountable(stats, "mp", "display", true),
    ],
  },
  tea: {
    sprite: tea,
    getDescription: (stats) => [
      createText("A herbal infusion"),
      createText("boiled in water."),
      createCountable(stats, "mp", "display", true),
    ],
  },
  toast: {
    sprite: toast,
    getDescription: (stats) => [
      createText("Crispy sandwich"),
      createText("with a topping."),
      createCountable(stats, "hp", "display", true),
    ],
  },
  juice: {
    sprite: juice,
    getDescription: (stats) => [
      createText("Sweet fruit,"),
      createText("freshly squeezed."),
      createCountable(stats, "hp", "display", true),
    ],
  },
  granola: {
    sprite: granola,
    getDescription: (stats) => [
      createText("Low heat roasted"),
      createText("grains and seeds."),
      createCountable(stats, "hp", "display", true),
    ],
  },
  arrow: {
    sprite: arrow,
    getDescription: () => [
      createText("To be used with a"),
      [
        ...createItemName({
          material: "wood",
          skill: "bow",
        }),
        ...createText(" for a long-"),
      ],
      createText("range attack."),
    ],
  },
  bomb: { sprite: bombActive },
  charge: {
    sprite: charge,
    getDescription: () => [
      createText("Used for skills."),
      createText("Drops on hitting"),
      [
        ...createText("with a "),
        ...createItemName({
          weapon: "sword",
          material: "wood",
        }),
        ...createText("."),
      ],
    ],
  },
  golem: {
    sprite: golemHead,
    getDescription: () => [
      createText("Head of a slain"),
      [...createUnitName("golem"), ...createText(". Might be")],
      createText("worth something."),
    ],
  },
  letter: {
    sprite: letter,
    getDescription: () => [
      createText("A beautifully"),
      createText("written note for"),
      createText("someone."),
    ],
  },
  schema: {
    sprite: schema,
    getDescription: () => [
      createText("Detailed drawing"),
      createText("how to build"),
      createText("something."),
    ],
  },
  sand: {
    sprite: sandBlock,
    getDescription: () => [
      createText("A block of sand"),
      createText("used for filling"),
      [
        ...createText("up "),
        waterShallow,
        ...createText("Water", colors.blue),
        ...createText("."),
      ],
    ],
  },
  gravel: {
    sprite: gravelBlock,
    getDescription: () => [
      createText("A block of gravel"),
      createText("used for paving a"),
      [path, ...createText("Path", colors.grey), ...createText(".")],
    ],
  },

  // stats
  level: {
    sprite: level,
    getDescription: () => [
      createText("Gain levels by"),
      [
        ...createText("collecting "),
        xp,
        ...createText("XP", colors.lime),
        ...createText("."),
      ],
    ],
  },
  hp: { sprite: heart },
  maxHp: {
    sprite: heartUp,
    getDescription: () => [
      createText("Total amount of"),
      [heart, ...createText("HP", colors.red), ...createText(" available.")],
    ],
  },
  maxHpCap: { sprite: heartUp },
  mp: { sprite: mana },
  maxMp: {
    sprite: manaUp,
    getDescription: () => [
      createText("Increases your"),
      [
        ...createText("maximum "),
        mana,
        ...createText("MP", colors.blue),
        ...createText(" to"),
      ],
      createText("cast spells."),
    ],
  },
  maxMpCap: { sprite: manaUp },
  xp: { sprite: xp },
  maxXp: { sprite: xp },
  maxXpCap: { sprite: xp },
  power: {
    sprite: power,
    getDescription: () => [
      createText("Additional damage"),
      createText("inflicted with"),
      [
        minCountable(meleeHit),
        ...createText("Melee", colors.red),
        ...createText(" attacks."),
      ],
    ],
  },
  wisdom: {
    sprite: wisdom,
    getDescription: () => [
      createText("Extra healing"),
      createText("or damage for own"),
      [
        minCountable(magicHit),
        ...createText("Magic", colors.fuchsia),
        ...createText(" spells."),
      ],
    ],
  },
  armor: {
    sprite: armor,
    getDescription: () => [
      createText("Reduces incoming"),
      [
        minCountable(meleeHit),
        ...createText("Melee", colors.red),
        ...createText(" damage."),
      ],
    ],
  },
  resist: {
    sprite: resist,
    getDescription: () => [
      createText("Receive less"),
      createText("damage from enemy"),
      [
        minCountable(magicHit),
        ...createText("Magic", colors.fuchsia),
        ...createText(" attacks."),
      ],
    ],
  },
  haste: {
    sprite: haste,
    getDescription: () => [
      createText("Movement speed"),
      createText("and attack speed."),
    ],
  },
  vision: {
    sprite: vision,
    getDescription: () => [
      createText("Range of vision"),
      [
        ...createText("to reveal "),
        fog,
        ...createText("Fog", colors.grey),
        ...createText("."),
      ],
    ],
  },
  damp: {
    sprite: damp,
    getDescription: () => [
      createText("Reduces total"),
      [
        maxCountable(fire),
        ...createText("Burn", colors.yellow),
        ...createText(" damage."),
      ],
    ],
  },
  thaw: {
    sprite: thaw,
    getDescription: () => [
      createText("Shorter duration"),
      [
        ...createText("of "),
        minCountable(freeze),
        ...createText("Freeze", colors.aqua),
        ...createText("."),
      ],
    ],
  },
  spike: {
    sprite: spike,
    getDescription: () => [
      createText("Deals damage to"),
      createText("the attacker on"),
      [
        minCountable(meleeHit),
        ...createText("Melee", colors.red),
        ...createText(" hits."),
      ],
    ],
  },
};

export type SpriteDefinition = {
  sprite: Sprite;
  resource?: Sprite;
  display?: Sprite;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};

export type SpriteTemplateDefinition = {
  sprite: PartialSpriteTemplate;
  resource?: PartialSpriteTemplate;
  display?: PartialSpriteTemplate;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};

export const materialSprites: Partial<
  Record<
    | Accessory
    | Weapon
    | Offhand
    | Spell
    | Skill
    | Tool
    | Consumable
    | ResourceItem
    | Materialized,
    SpriteTemplateDefinition
  >
> = {
  sword: {
    sprite: sword,
    getDescription: (stats, item) => {
      if (item.material === "wood") {
        return [
          createText("Simple sword made"),
          [
            ...createText("out of a "),
            ...createItemName({ stackable: "stick" }),
            ...createText("."),
          ],
          [
            ...createText(stats.melee.toString(), colors.red),
            minCountable(meleeHit),
            ...createText("Melee", colors.red),
          ],
        ];
      }

      return [
        createText(
          `${
            { iron: "Heavy", gold: "Shiny", diamond: "Sharp", ruby: "Mighty" }[
              item.material!
            ]
          } sword made`
        ),
        [
          ...createText("of "),
          ...createItemName({ stackable: "resource", material: item.material }),
          ...createText("."),
        ],
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
      ];
    },
  },
  spear: {
    sprite: spear,
    getDescription: (stats, item) => {
      if (item.material === "wood") {
        return [
          createText("A long spear made"),
          [
            ...createText("out of a "),
            ...createItemName({ stackable: "stick" }),
            ...createText("."),
          ],
          stretch(
            [
              ...createText(stats.melee.toString(), colors.red),
              minCountable(meleeHit),
              ...createText("Melee", colors.red),
            ],
            [
              ...createText("-1", colors.silver),
              getBlockedSlot(skillSlot),
              ...createText("Slot", colors.silver),
            ],
            frameWidth - 2
          ),
        ];
      }

      return [
        createText(
          `${
            { iron: "Heavy", gold: "Shiny", diamond: "Sharp", ruby: "Mighty" }[
              item.material!
            ]
          } spear made`
        ),
        [
          ...createText("of "),
          ...createItemName({ stackable: "resource", material: item.material }),
          ...createText("."),
        ],
        stretch(
          [
            ...createText(stats.melee.toString(), colors.red),
            minCountable(meleeHit),
            ...createText("Melee", colors.red),
          ],
          [
            ...createText("-1", colors.silver),
            getBlockedSlot(skillSlot),
            ...createText("Slot", colors.silver),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  wand: {
    sprite: wand,
    getDescription: (stats, item) => {
      if (item.material === "wood") {
        return [
          createText("A short wand made"),
          [
            ...createText("out of a "),
            ...createItemName({ stackable: "stick" }),
            ...createText("."),
          ],
          stretch(
            [
              ...createText(stats.magic.toString(), colors.fuchsia),
              minCountable(magicHit),
              ...createText("Magic", colors.fuchsia),
            ],
            [
              ...createText("-1", colors.silver),
              getBlockedSlot(skillSlot),
              ...createText("Slot", colors.silver),
            ],
            frameWidth - 2
          ),
        ];
      }

      return [
        createText(
          `${
            { iron: "Heavy", gold: "Shiny", diamond: "Sharp", ruby: "Mighty" }[
              item.material!
            ]
          } wand made`
        ),
        [
          ...createText("of "),
          ...createItemName({ stackable: "resource", material: item.material }),
          ...createText("."),
        ],
        stretch(
          [
            ...createText(stats.magic.toString(), colors.fuchsia),
            minCountable(magicHit),
            ...createText("Magic", colors.fuchsia),
          ],
          [
            ...createText("-1", colors.silver),
            getBlockedSlot(skillSlot),
            ...createText("Slot", colors.silver),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  shield: {
    sprite: shield,
    getDescription: (stats, item) => [
      createText(
        `${
          {
            wood: "Simple",
            iron: "Heavy",
            gold: "Shiny",
            diamond: "Rigid",
            ruby: "Mighty",
          }[item.material!]
        } shield`
      ),
      [
        ...createText("made of "),
        ...createItemName({ stackable: "resource", material: item.material }),
        ...createText("."),
      ],
      createCountable(stats, "armor", "display"),
    ],
  },
  ring: {
    sprite: ring,
    getDescription: (stats, item) => [
      createText(
        `A ${
          {
            wood: "fragile",
            iron: "crude",
            gold: "shiny",
            diamond: "pure",
            ruby: "mighty",
          }[item.material!]
        } ring`
      ),
      createText("with arcane aura."),
      brightenSprites(createCountable(stats, "maxMp", "display")),
    ],
  },
  amulet: {
    sprite: amulet,
    getDescription: (stats, item) => [
      createText("A protective and"),
      createText(
        `${
          {
            wood: "delicate",
            iron: "sturdy",
            gold: "shiny",
            diamond: "radiant",
            ruby: "mighty",
          }[item.material!]
        } amulet.`
      ),
      brightenSprites(createCountable(stats, "maxHp", "display")),
    ],
  },

  // tools
  axe: {
    sprite: axe,
    getDescription: (stats) => [
      createText("Stand in front of"),
      [
        ...createText("a "),
        tree1,
        tree2,
        ...createText("Tree", colors.grey),
        ...createText(" to chop."),
      ],
      stretch(
        createCountable(stats, "logging", "display"),
        createCountable(stats, "range", "display"),
        frameWidth - 2
      ),
    ],
  },
  hook: {
    sprite: hook,
    getDescription: (stats) => [
      [
        ...createText("Catch "),
        salmon,
        cod,
        ...createText("Fish", colors.grey),
        ...createText(" from"),
      ],
      [
        ...createText("the "),
        maxCountable(bubble),
        ...createText("Water", colors.blue),
        ...createText("."),
      ],
      stretch(
        createCountable(stats, "fishing", "display"),
        createCountable(stats, "range", "display"),
        frameWidth - 2
      ),
    ],
  },
  pickaxe: {
    sprite: pickaxe,
    getDescription: (stats) => [
      createText("Stand in front of"),
      [
        ...createText("a "),
        wall,
        ...createText("Rock", colors.grey),
        ...createText(" to mine."),
      ],
      stretch(
        createCountable(stats, "mining", "display"),
        createCountable(stats, "range", "display"),
        frameWidth - 2
      ),
    ],
  },
  shovel: {
    sprite: shovel,
    getDescription: (stats) => [
      [
        ...createText("Dig "),
        soil,
        ...createText("Soil", colors.grey),
        ...createText(" and"),
      ],
      [
        ...createText("plant "),
        grain,
        flowerDrop,
        berryDrop,
        ...createText("Seed", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "farming", "display"),
    ],
  },
  hammer: {
    sprite: hammer,
    getDescription: (stats) => [
      [
        repair,
        ...createText("Repair", colors.grey),
        ...createText(" or create"),
      ],
      [
        ...createText("a new "),
        plot,
        ...createText("Plot", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "build", "display"),
    ],
  },

  // slots
  compass: {
    sprite: compass,
    getDescription: () => [
      createText("Shows the way"),
      createText("back to your"),
      createText("spawn point."),
    ],
  },
  map: {
    sprite: map,
    getDescription: () => [
      createText("View the area you"),
      createText("revealed so far."),
    ],
  },
  torch: {
    sprite: torch,
    getDescription: (stats) => [
      createText("Glows bright and"),
      createText("keeps you warm."),
      [...createCountable(stats, "vision", "display")],
    ],
  },
  boots: {
    sprite: boots,
    getDescription: (stats, item) => [
      createText(
        `${
          {
            wood: "Simple",
            iron: "Heavy",
            gold: "Shiny",
            diamond: "Rigid",
            ruby: "Mighty",
          }[item.material!]
        } but soft`
      ),
      createText("boots."),
      [...createCountable(stats, "haste", "display")],
    ],
  },

  // primary spells
  wave: {
    sprite: waveSpell,
    getDescription: (stats) => [
      createText("Use to cast a"),
      createText("wave of magic."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
    ],
  },
  beam: {
    sprite: beamSpell,
    getDescription: (stats) => [
      createText("Shoots multiple"),
      createText("bolts in a beam."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
    ],
  },
  trap: {
    sprite: trapSpell,
    getDescription: (stats) => [
      createText("Damages enemies"),
      createText("walking over it."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
    ],
  },
  dash: {
    sprite: dashSpell,
    getDescription: (stats) => [
      createText("Leap forward and"),
      createText("pierce enemies."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
    ],
  },

  // secondary skills
  slash: {
    sprite: slash,

    getDescription: (stats) => [
      createText("Spins sword with"),
      createText("extra damage."),
      stretch(
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "charge" }),
        ],
        frameWidth - 2
      ),
    ],
  },
  bow: {
    sprite: bow,

    getDescription: (stats) => [
      createText("Shoots a ranged"),
      createText("projectile."),
      stretch(
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "arrow" }),
        ],
        frameWidth - 2
      ),
    ],
  },
  zap: {
    sprite: zap,
    getDescription: (stats) => [
      [
        ...createText("Strikes "),
        ...createText(stats.range.toString()),
        times,
        ...createText(" times"),
      ],
      createText("to near enemies."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "charge" }),
        ],
        frameWidth - 2
      ),
    ],
  },
  block: {
    sprite: block,
    getDescription: (stats) => [
      [
        ...createText("Defends "),
        minCountable(meleeHit),
        ...createText("Melee", colors.red),
        ...createText(" or"),
      ],
      [
        minCountable(magicHit),
        ...createText("Magic", colors.fuchsia),
        ...createText(" attacks."),
      ],
      stretch(
        [
          ...createText(stats.absorb.toString(), colors.olive),
          minCountable(absorb),
          ...createText("Absorb", colors.olive),
        ],
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "charge" }),
        ],
        frameWidth - 2
      ),
    ],
  },
  totem: {
    sprite: totem,
    getDescription: (itemStats) => [
      [
        ...createText("Grants "),
        ...createText("+1", colors.lime),
        ...createText(" of all"),
      ],
      [
        stats,
        ...createText("Stats", colors.lime),
        ...createText(" in "),
        aura,
        ...createText("Aura", colors.silver),
        ...createText("."),
      ],
      stretch(
        createCountable(itemStats, "duration", "display"),
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "charge" }),
        ],
        frameWidth - 2
      ),
    ],
  },

  // resource
  resource: {
    sprite: {
      wood: { default: wood },
      iron: { default: iron },
      gold: { default: gold },
      diamond: { default: diamond },
      ruby: { default: ruby },
    },
    getDescription: (_, item) => {
      if (item.material === "wood") {
        return [
          [
            ...createText("Made from "),
            ...createItemName({ stackable: "stick" }),
            ...createText("."),
          ],
          createText("Used to brew"),
          [
            getItemSprite({ consume: "potion", material: "wood", stat: "hp" }),
            getItemSprite({ consume: "potion", material: "iron", stat: "mp" }),
            ...createText("Potions", colors.grey),
            ...createText("."),
          ],
        ];
      } else if (item.material === "iron") {
        return [
          [
            ...createText("Made from "),
            ...createItemName({ stackable: "ore" }),
            ...createText("."),
          ],
          createText("Used to forge"),
          [...createText("iron", colors.grey), ...createText(" gear.")],
        ];
      }
      return [
        [
          ...createText("Found at a "),
          ...createItemName({ materialized: "mine", material: item.material }),
          ...createText("."),
        ],
        createText("Used to forge"),
        [
          ...createText(
            { gold: "golden", diamond: "diamond", ruby: "ruby" }[
              item.material!
            ],
            colorPalettes[item.material!].primary
          ),
          ...createText(" gear."),
        ],
      ];
    },
  },

  // consumable
  key: {
    sprite: key,
    getDescription: (_, item) => [
      [
        ...createText("Opens a "),
        ...createItemName({ materialized: "lock", material: item.material }),
        ...createText("."),
      ],
      createText("Disappears after"),
      createText("use."),
    ],
  },
  bucket: {
    sprite: bucket,
    getDescription: (_, item) => [
      createText(`An empty ${item.material === "wood" ? "bowl" : "bucket"}`),
      [
        ...createText("made of "),
        ...createItemName({ stackable: "resource", material: item.material }),
        ...createText("."),
      ],
      [
        ...createText("Refill in "),
        waterShallow,
        ...createText("Water", colors.blue),
        ...createText("."),
      ],
    ],
  },

  // materialized
  lock: {
    sprite: lock,
  },
  door: {
    sprite: doorOpen,
    resource: doorClosed,
    display: doorClosed,
  },
  port: {
    sprite: portOpen,
    resource: portClosed,
    display: portClosed,
  },
  entry: {
    sprite: entryClosed,
    display: entryClosedDisplay,
  },
  gate: {
    sprite: fenceDoorOpen,
    resource: fenceDoorClosed,
  },
  entrance: {
    sprite: palisadeDoorOpen,
    resource: palisadeDoorClosed,
  },
  mine: {
    sprite: {
      iron: { default: ironMine },
      gold: { default: goldMine },
    },
    display: {
      iron: { default: ironMineDisplay },
      gold: { default: goldMineDisplay },
    },
  },
};

export const elementSprites: Partial<
  Record<
    | "ring"
    | "amulet"
    | Weapon
    | Offhand
    | Spell
    | Skill
    | Consumable
    | ResourceItem
    | Materialized,
    SpriteTemplateDefinition
  >
> = {
  // gear
  sword: {
    sprite: sword,
    getDescription: (stats, item) => [
      [
        ...createText("A "),
        ...createItemName(
          item.material === "wood"
            ? { stackable: "stick" }
            : { stackable: "resource", material: item.material }
        ),
        ...createText(" sword"),
      ],
      [
        ...createText("with a "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText("."),
      ],
      stretch(
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
        createCountable(
          stats,
          (
            {
              air: "power",
              fire: "burn",
              water: "freeze",
              earth: "drain",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
    ],
  },
  spear: {
    sprite: spear,
    getDescription: (stats, item) => [
      [
        ...createText("A "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText(" spear."),
      ],
      stretch(
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
        createCountable(
          stats,
          (
            {
              air: "power",
              fire: "burn",
              water: "freeze",
              earth: "drain",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
      [
        ...createText("-1", colors.silver),
        getBlockedSlot(skillSlot),
        ...createText("Slot", colors.silver),
      ],
    ],
  },
  wand: {
    sprite: wand,
    getDescription: (stats, item) => [
      [
        ...createText("A "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText(" wand."),
      ],
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable(
          stats,
          (
            {
              air: "wisdom",
              fire: "burn",
              water: "freeze",
              earth: "drain",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
      [
        ...createText("-1", colors.silver),
        getBlockedSlot(skillSlot),
        ...createText("Slot", colors.silver),
      ],
    ],
  },
  shield: {
    sprite: shield,
    getDescription: (stats, item) => [
      [
        ...createText("A "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText(" shield"),
      ],
      [
        ...createText("made of "),
        ...createItemName({ stackable: "resource", material: item.material }),
        ...createText("."),
      ],
      stretch(
        createCountable(stats, "armor", "display"),
        createCountable(
          stats,
          (
            {
              air: "resist",
              fire: "damp",
              water: "thaw",
              earth: "spike",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
    ],
  },
  ring: {
    sprite: ring,
    getDescription: (stats, item) => [
      createText(
        `A ${
          {
            wood: "fragile",
            iron: "crude",
            gold: "shiny",
            diamond: "pure",
            ruby: "mighty",
          }[item.material!]
        } ring`
      ),
      [
        ...createText("with a "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText("."),
      ],
      stretch(
        brightenSprites(createCountable(stats, "maxMp", "display")),
        createCountable(
          stats,
          (
            {
              air: "haste",
              fire: "power",
              water: "wisdom",
              earth: "spike",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
    ],
  },
  amulet: {
    sprite: amulet,
    getDescription: (stats, item) => [
      createText(
        `${
          {
            wood: "Delicate",
            iron: "Sturdy",
            gold: "Shiny",
            diamond: "Radiant",
            ruby: "Mighty",
          }[item.material!]
        } amulet`
      ),
      [
        ...createText("with a "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText("."),
      ],
      stretch(
        brightenSprites(createCountable(stats, "maxHp", "display")),
        createCountable(
          stats,
          (
            {
              air: "armor",
              fire: "damp",
              water: "thaw",
              earth: "resist",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
    ],
  },

  // spells
  wave: {
    sprite: waveSpell,
    getDescription: (stats, item) => [
      createText("A wave of magic."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
      createCountable(
        stats,
        (
          {
            air: "wisdom",
            fire: "burn",
            water: "freeze",
            earth: "drain",
          } as const
        )[item.element!],
        "display"
      ),
    ],
  },
  beam: {
    sprite: beamSpell,
    getDescription: (stats, item) => [
      createText("A beam of bolts."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
      createCountable(
        stats,
        (
          {
            air: "wisdom",
            fire: "burn",
            water: "freeze",
            earth: "heal",
          } as const
        )[item.element!],
        "display"
      ),
    ],
  },
  trap: {
    sprite: trapSpell,
    getDescription: (stats, item) => [
      createText("Triggers effects."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
      createCountable(
        stats,
        (
          {
            air: "wisdom",
            fire: "burn",
            water: "freeze",
            earth: "heal",
          } as const
        )[item.element!],
        "display"
      ),
    ],
  },
  dash: {
    sprite: dashSpell,
    getDescription: (stats, item) => [
      createText("Pierce forward."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
      createCountable(
        stats,
        (
          {
            air: "wisdom",
            fire: "burn",
            water: "freeze",
            earth: "drain",
          } as const
        )[item.element!],
        "display"
      ),
    ],
  },

  resource: {
    sprite: spirit,
    getDescription: (_, item) => {
      if (item.element === "air") {
        return [
          createText("Elemental spirit"),
          createText("used for forging."),
        ];
      }

      return [
        createText("Elemental spirit"),
        createText("used for forging"),
        [
          ...createText("with "),
          ...createText(item.element!, colorPalettes[item.element!].primary),
          ...createText("."),
        ],
      ];
    },
  },

  // consumable
  key: {
    sprite: key,
    getDescription: (_, item) => [
      [
        ...createText("Opens a "),
        ...createItemName({
          materialized: "lock",
          element: item.element,
        }),
        ...createText("."),
      ],
      createText("Disappears after"),
      createText("use."),
    ],
  },
  bucket: {
    sprite: bucket,
    getDescription: (_, item) => [
      [
        ...createText("A "),
        ...createItemName({ stackable: "resource", material: item.material }),
        ...createText(" "),
        ...createText(item.material === "wood" ? "bowl" : "bucket"),
      ],

      [
        ...createText("full of "),
        ...createText(item.element!, colorPalettes[item.element!].primary),
        ...createText("."),
      ],
    ],
  },

  // materialized
  lock: {
    sprite: lock,
  },
  door: {
    sprite: doorOpen,
    resource: doorClosed,
    display: doorClosed,
  },
  port: {
    sprite: portOpen,
    resource: portClosed,
    display: portClosed,
  },
  entry: {
    sprite: entryClosed,
    display: entryClosedDisplay,
  },
};

export type StatSprite = Partial<
  Record<Material, Partial<Record<keyof UnitStats, Sprite>>>
>;

export type SpriteStatDefinition = {
  sprite: StatSprite;
  resource?: StatSprite;
  display?: StatSprite;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};

export const statSprites: Partial<Record<Consumable, SpriteStatDefinition>> = {
  // consumables
  potion: {
    sprite: {
      wood: {
        hp: flask.wood.fire,
        mp: flask.wood.water,
      },
      iron: {
        hp: bottle.wood.fire,
        mp: bottle.wood.water,
      },
      gold: {
        hp: potion.wood.fire,
        mp: potion.wood.water,
      },
    },
    getDescription: (stats, item) => {
      if (item.stat === "hp") {
        return [
          createText("Automatic healing"),
          createText("on low health."),
          stretch(
            createCountable(stats, "retrigger", "display"),
            createCountable(stats, "hp", "display"),
            frameWidth - 2
          ),
        ];
      }
      if (item.stat === "mp") {
        return [
          createText("Refills low mana"),
          createText("automatically."),
          stretch(
            createCountable(stats, "retrigger", "display"),
            createCountable(stats, "mp", "display"),
            frameWidth - 2
          ),
        ];
      }
      return [];
    },
  },
};

export const getEntityDescription = (
  item: Omit<Item, "carrier" | "bound" | "amount">,
  definition: SpriteDefinition
) => {
  const material = item.material || "default";
  const element = item.element || "default";
  const description = definition.descriptions?.[material]?.[element];
  if (description) return description;

  if (definition.getDescription) {
    const consumptionConfig =
      item.material &&
      item.stat &&
      item.consume === "potion" &&
      consumptionConfigs.potion?.[item.material]?.[item.stat];
    const itemConsumption = getItemConsumption({ [ITEM]: item });

    const itemStats = consumptionConfig
      ? {
          ...emptyItemStats,
          [consumptionConfig.countable]: consumptionConfig.amount,
          retrigger: consumptionConfig.cooldown,
        }
      : itemConsumption
      ? {
          ...emptyItemStats,
          [itemConsumption.countable]: itemConsumption.amount,
        }
      : getItemStats(item);

    const descriptions = definition.descriptions || {};
    definition.descriptions = descriptions;
    const materialDescriptions = descriptions[material] || {};
    descriptions[material] = materialDescriptions;

    const newDescription = definition.getDescription(itemStats, item);
    materialDescriptions[element] = newDescription;
    return newDescription;
  }

  return [createText(definition.sprite.name, colors.white, colors.black)];
};

export const getItemDescription = (
  item: Omit<Item, "carrier" | "bound" | "amount">
) => {
  const itemConfig = getItemConfig(item);

  if (!itemConfig) return [[]];

  return getEntityDescription(item, itemConfig);
};
