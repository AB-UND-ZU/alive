import type { Dialog } from "../../engine/components/popup";
import type { Sprite } from "../../engine/components/sprite";
import type { UnitStats } from "../../engine/components/stats";
import { colors } from "./colors";
import * as sprites from "./sprites";
import { doorClosed, portClosed } from "./templates/units";
import { prism } from "./templates/creatures";
import {
  createItemName as item,
  createUnitName as unit,
  getItemSprite as itemSprite,
  getUnitSprite as unitSprite,
  getClassSprite,
} from "./utils";
import {
  brew,
  craft,
  forge,
  info,
  quest,
  plot,
  shop,
  createButton,
  createCountable,
  createSpriteButton,
  createText,
  getFacingLayers,
  getStatColor,
  mergeSprites,
  recolorSprite,
} from "./ui";

type Part = string | Sprite | Sprite[];
const line = (...parts: Part[]) =>
  parts.flatMap((part) =>
    typeof part === "string"
      ? createText(part, colors.silver)
      : Array.isArray(part)
      ? part
      : [part]
  );
const accent = (text: string) => createText(text, colors.white);
const label = (sprite: Sprite, text: string, color = colors.grey) => [
  sprite,
  ...createText(text, color),
];
const glyph = (char: string, color: string) => createText(char, color)[0];
const stat = (key: keyof UnitStats) => item({ stat: key }, getStatColor(key));
const change = (...rows: Part[][]) =>
  rows.map((row, index) =>
    line(index ? sprites.none : sprites.listBullet, ...row)
  );
const update = (
  version: string,
  date: string,
  content: Sprite[][]
): Dialog => ({
  title: `V${version}`,
  description: [sprites.delay, ...createText(date, colors.white)],
  content: content.flatMap((row, index) =>
    index && row[0] === sprites.listBullet ? [[], row] : [row]
  ),
});

const originalBush = mergeSprites(
  glyph("°", colors.teal),
  glyph("τ", colors.olive)
);
const originalGrass = mergeSprites(
  glyph("\u0106", colors.purple),
  glyph(",", colors.olive)
);
const originalEye = mergeSprites(
  { ...glyph("0", colors.white), name: "Eye" },
  sprites.hostileBar
);
const originalChest = mergeSprites(
  glyph("\u011d", colors.maroon),
  glyph("\u011f", colors.grey),
  glyph("-", colors.grey),
  sprites.hostileBar
);
const originalIce = glyph("█", colors.teal);
const note = glyph("\u010d", colors.lime);

let history: Dialog[] | undefined;

// Build once after game modules initialize; the history uses the normal popup labels.
export const getUpdates = (): Dialog[] =>
  (history ||= [
    update("0x07", "20261116", [
      ...change(
        ["New renderers:"],
        [sprites.schema, accent("HTML+CSS+SVG")],
        [sprites.mapDiscovery, accent("Terminal")]
      ),
      ...change(
        ["Increase ", item({ spell: "trap", material: "wood" })],
        ["area to ", accent("3x3")]
      ),
      ...change(
        [
          "Nerf earth ",
          item({ spell: "trap", material: "wood", element: "earth" }),
        ],
        ["and ", item({ spell: "dash", material: "wood" }), " damage"]
      ),
      ...change([label(sprites.sign, "Updates"), " history"]),
      ...change(["Smooth rendering"]),
    ]),
    update("0x06", "20261111", [
      ...change([unitSprite("wormTower"), unit("wormBoss"), " boss"]),
      ...change([
        label(sprites.boat, "Boat"),
        " and ",
        label(sprites.jetty, "Dock"),
      ]),
      ...change([label(sprites.missing, "Sprite"), " editor"]),
      ...change(
        [label(sprites.chatDiscovery, "Chat"), " command"],
        ["tab completion"]
      ),
      ...change([label(sprites.mapDiscovery, "Wiki"), " previews"]),
      ...change(["More game speed"]),
      ...change(["Many bug fixes"]),
    ]),
    update("0x05", "20261109", [
      ...change([
        "Add ",
        label(mergeSprites(sprites.portalVortex, sprites.portal), "Savegames"),
      ]),
      ...change(["Pause auto-save"]),
      ...change(["Full game ", label(sprites.mapDiscovery, "Wiki")]),
    ]),
    update("0x04", "20261106", [
      ...change(["Fix ", label(sprites.wall, "Wall"), " shadow"]),
      ...change(["Make game faster"]),
      ...change(["Reduce memory"]),
    ]),
    update("0x03", "20261106", [
      ...change([note, "More sounds"]),
      ...change(["Fix ", label(sprites.mapDiscovery, "Dungeon"), " map"]),
      ...change(["Version in menu"]),
    ]),
    update("0x02", "20240727", [
      ...change(["Complete rewrite"], ["in ", accent("React ThreeJS")]),
      ...change(["Responsive sizes"]),
      ...change([label(sprites.mapDiscovery, "Menu"), " as a level"]),
      ...change([createSpriteButton([sprites.pauseInvert], 3), " Pause game"]),
      ...change(
        [
          label(sprites.rain, "Rain"),
          " and ",
          label(
            {
              ...sprites.snowflake,
              layers: getFacingLayers(sprites.snowflake, undefined, 3),
            },
            "Snow"
          ),
        ],
        ["and ", label(glyph("╬", colors.white), "Tornado")]
      ),
      ...change([
        label(sprites.tombstone1, "Die"),
        " and ",
        label(mergeSprites(sprites.ghost, sprites.halo), "Spawn"),
      ]),
      ...change([label(sprites.level, "Test mode")]),
      ...change([label(sprites.chatDiscovery, "Chat"), " input"]),
      ...change([label(info, "Dialog"), " popups"]),
      ...change([
        "Click ",
        createButton("BUTTONS", 9, false, false, false, "lime"),
      ]),
      ...change([
        createButton("USE", 5, false, false, false, "yellow"),
        " quick menu",
      ]),
      ...change([createButton("0", 3), "-", createButton("9", 3), " hotkeys"]),
      ...change([label(note, "Sound"), " effects"]),
      ...change([
        "Sided ",
        sprites.leverOff,
        label(sprites.leverOn, "Controls"),
      ]),
      ...change(["Mini-&World ", item({ accessory: "map", material: "gold" })]),
      ...change([
        "Warping ",
        label(mergeSprites(sprites.portalVortex, sprites.portal), "Portals"),
      ]),
      ...change(
        ["Four classes:"],
        [label(getClassSprite("rogue"), "Rogue"), " fighter"],
        [label(getClassSprite("mage"), "Mage"), " caster"],
        [label(getClassSprite("knight"), "Knight"), " tank"],
        [label(getClassSprite("???"), "???")]
      ),
      ...change([
        "Hair: ",
        [
          colors.maroon,
          colors.olive,
          colors.yellow,
          colors.white,
          colors.grey,
          colors.purple,
          colors.fuchsia,
        ].map((color) => getClassSprite("mage", color)),
      ]),
      ...change(
        ["New stats:"],
        [stat("power"), " melee"],
        [stat("armor"), " reduce"],
        [stat("wisdom"), " magic"],
        [stat("resist"), " reduce"],
        [stat("vision"), " radius"],
        [stat("haste"), " speed"],
        [stat("damp"), " fire"],
        [stat("thaw"), " freeze"],
        [stat("spike"), " damage"]
      ),
      ...change([
        itemSprite({ accessory: "torch", material: "wood" }),
        "Light & shadows",
      ]),
      ...change([label(sprites.mapDiscovery, "Dungeon"), " level"]),
      ...change([unit("sign"), " and ", label(quest, "Quest", colors.lime)]),
      ...change(["Heal ", label(sprites.fountain, "Fountain")]),
      ...change([
        doorClosed.wood.default,
        label(portClosed.wood.default, "Doors"),
        " & ",
        item({ consume: "key", material: "iron" }),
      ]),
      ...change([label(sprites.path, "Path"), " speed up"]),
      ...change([sprites.sand, label(sprites.beach, "Sand"), " slow down"]),
      ...change(["New sprites ", sprites.ice, sprites.waterShallow]),
      ...change(
        ["Furnished ", label(sprites.mapHouse, "House")],
        [
          "with ",
          sprites.chairLeft,
          sprites.table,
          sprites.chairRight,
          " ",
          sprites.bedHeadLeft,
          sprites.bedCenter,
          sprites.bedEndRight,
        ]
      ),
      ...change([
        "Fences: ",
        ...[
          "fence",
          "fenceDoor",
          "palisade",
          "palisadeDoor",
          "barrier",
          "barrierDoor",
        ].map((key) => unitSprite(key as Parameters<typeof unitSprite>[0])),
      ]),
      ...change([unit("pot"), " and ", unit("box")]),
      ...change([
        [
          "woodChest",
          "ironChest",
          "goldChest",
          "diamondChest",
          "rubyChest",
        ].map((key) => unitSprite(key as Parameters<typeof unitSprite>[0])),
        createText("Chests", colors.grey),
      ]),
      ...change([unit("dummy"), " target"]),
      ...change(["New ", unit("eye"), " sprite"]),
      ...change([unit("orb"), " beam caster"]),
      ...change([
        itemSprite({ consume: "potion", material: "wood", stat: "hp" }),
        itemSprite({ consume: "potion", material: "wood", stat: "mp" }),
        itemSprite({ consume: "potion", material: "iron", stat: "hp" }),
        itemSprite({ consume: "potion", material: "iron", stat: "mp" }),
        itemSprite({ consume: "potion", material: "gold", stat: "hp" }),
        itemSprite({ consume: "potion", material: "gold", stat: "mp" }),
        createText("Potions", colors.grey),
      ]),
      ...change([
        "Fruit: ",
        sprites.apple,
        sprites.shroom,
        sprites.banana,
        sprites.coconut,
        sprites.fruit,
        sprites.herb,
      ]),
      ...change(
        [
          unitSprite("rock1"),
          label(unitSprite("rock2"), "Rocks"),
          ", ",
          unitSprite("cactus1"),
          label(unitSprite("cactus2"), "Cacti"),
        ],
        ["and ", label(unitSprite("tumbleweed"), "Tumbleweed")]
      ),
      ...change([unit("tutorialBoss"), " boss"]),
      ...change(["Generate ", label(sprites.mapDiscovery, "Island")]),
      ...change(["Rare ", unit("fairy")]),
      ...change(["New ", label(glyph("æ", colors.white), "Air"), " element"]),
      ...change([
        "Materials: ",
        ...(["wood", "iron", "gold", "diamond", "ruby"] as const).map(
          (material) => itemSprite({ stackable: "resource", material })
        ),
      ]),
      ...change(["Currency: ", sprites.coin, sprites.nugget, sprites.ingot]),
      ...change([
        "Quest items: ",
        sprites.letter,
        sprites.schema,
        sprites.golemHead,
      ]),
      ...change([label(sprites.tree2, "Jungle"), " biome"]),
      ...change([
        "Items: ",
        sprites.apple,
        sprites.shroom,
        sprites.leaf,
        sprites.sapling,
        sprites.grain,
        sprites.wheat,
        sprites.plank,
      ]),
      ...change(
        ["New plant mobs:"],
        [unit("rose"), " with spike"],
        [unit("violet"), " shooting"],
        [unit("clover"), " healing"]
      ),
      ...change(
        [label(sprites.mapHouse, "Earth town"), " with"],
        [
          "NPCs: ",
          ...(
            [
              "earthGuard",
              "earthChief",
              "earthSmith",
              "earthDruid",
              "earthTrader",
            ] as const
          ).map(unitSprite),
        ]
      ),
      ...change([label(unitSprite("chick"), "Chick"), " animal"]),
      ...change([label(shop, "Shop"), " with ", item({ stackable: "coin" })]),
      ...change([label(sprites.bench, "Bench"), " ", label(craft, "Crafting")]),
      ...change(
        [label(sprites.kettle, "Kettle"), " ", label(brew, "Brewing")],
        [
          sprites.fruit,
          sprites.herb,
          sprites.grain,
          sprites.spore,
          sprites.bread,
          sprites.granola,
          sprites.juice,
          sprites.toast,
          sprites.tea,
          sprites.curry,
          sprites.soup,
        ]
      ),
      ...change([label(sprites.anvil, "Anvil"), " ", label(forge, "Forging")]),
      ...change(
        [item({ tool: "shovel", material: "wood" }), " planting"],
        [
          sprites.grain,
          sprites.sapling,
          "Seeds on ",
          label(sprites.soil, "Soil"),
        ],
        [
          "with ",
          label(
            itemSprite({
              consume: "bucket",
              material: "iron",
              element: "water",
            }),
            "Bucket"
          ),
          " and",
        ],
        ["digging ", sprites.sandBlock, sprites.gravelBlock]
      ),
      ...change(
        [
          sprites.salmon,
          sprites.pike,
          sprites.tuna,
          label(sprites.cod, "Fish"),
          ", ",
          item({ tool: "hook", material: "wood" }),
        ],
        [
          "and items ",
          sprites.worm,
          sprites.seastar,
          sprites.eel,
          sprites.algae,
          sprites.pearl,
        ]
      ),
      ...change([item({ tool: "axe", material: "wood" }), " for logging"]),
      ...change([item({ tool: "pickaxe", material: "wood" }), " mining"]),
      ...change([
        item({ tool: "hammer", material: "wood" }),
        " & ",
        label(plot, "Plot"),
      ]),
      ...change(
        ["New ", label(sprites.mana, "Spells", getStatColor("mp")), ":"],
        [item({ spell: "beam", material: "wood" }), " with bolts"],
        [item({ spell: "trap", material: "wood" }), " one cell"],
        [item({ spell: "dash", material: "wood" }), " forward"]
      ),
      ...change([sprites.lily, unit("ilexElite"), " mini boss"]),
      ...change(
        ["New weapons:"],
        [item({ weapon: "spear", material: "wood" }), " ranged"],
        [item({ weapon: "wand", material: "wood" }), " magic"]
      ),
      ...change(
        ["Skill items"],
        ["using ", item({ stackable: "charge" }), ":"],
        [item({ skill: "slash", material: "wood" }), " around"],
        [item({ skill: "zap", material: "wood" }), " hit proc"],
        [item({ skill: "block", material: "wood" }), " attacks"],
        [item({ skill: "totem", material: "wood" }), " aura"]
      ),
      ...change([
        item({ skill: "bow", material: "wood" }),
        " and ",
        item({ stackable: "arrow" }),
      ]),
      ...change([unitSprite("oakTower"), unit("oakBoss"), " boss phase"]),
      ...change([item({ accessory: "boots", material: "wood" }), " speed up"]),
      ...change([
        itemSprite({ accessory: "ring", material: "wood" }),
        itemSprite({ accessory: "amulet", material: "wood" }),
        createText("Accessories", colors.grey),
      ]),
      ...change([label(sprites.cactus1, "Desert"), " biome"]),
      ...change([
        "Items: ",
        sprites.mineral,
        sprites.crystal,
        sprites.thorn,
        sprites.banana,
        sprites.coconut,
      ]),
      ...change([
        "Stronger: ",
        unitSprite("goldEye"),
        unitSprite("goldPrism"),
        unitSprite("goldOrb"),
      ]),
      ...change([unit("golem"), " elite"]),
      ...change(
        [label(sprites.mapFortress, "Fire haven"), " with"],
        [
          "NPCs: ",
          ...(
            [
              "fireGuard",
              "fireChief",
              "fireSmith",
              "fireTrader",
              "fireDruid",
            ] as const
          ).map(unitSprite),
        ]
      ),
      ...change([unit("fireNomad"), " mini boss"]),
    ]),
    update("0x01", "20230316", [
      ...change(["Complete rewrite"], ["as ", accent("React"), " web app"]),
      ...change(
        [accent("HTML"), " and ", accent("CSS"), " on"],
        ["mobile & desktop"]
      ),
      ...change(["Fixed ", accent("21x13"), " view"]),
      ...change(["Keyboard & Touch"]),
      ...change([accent("350ms"), " world tick"]),
      ...change(["Layered sprites"]),
      ...change([
        "New ",
        item({ offhand: "shield", material: "wood" }),
        " gear",
      ]),
      ...change(
        ["Element ", label(sprites.mana, "Spells", getStatColor("mp")), ":"],
        [label(glyph("δ", colors.red), "Fire", colors.red), " burning"],
        [label(glyph("δ", colors.aqua), "Water", colors.aqua), " freezing"],
        [label(glyph("δ", colors.lime), "Earth", colors.lime), " shielding"]
      ),
      ...change(
        [
          "Level ",
          accent("2"),
          " ",
          label(glyph("\u0114", colors.grey), "Spells"),
        ],
        ["with more range"]
      ),
      ...change([originalEye, unit("eye").slice(1), " mob chasing"]),
      ...change([
        originalChest,
        unit("woodChest").slice(1),
        " with ",
        item({ stat: "xp" }, getStatColor("xp")),
      ]),
      ...change([
        label(quest, "Quest", colors.lime),
        " for ",
        createCountable({ xp: 10 }, "xp", "display"),
      ]),
      ...change([label(glyph("≈", colors.grey), "Fog"), " and vision"]),
      ...change([
        "New items: ",
        glyph("≡", colors.maroon),
        glyph("÷", colors.grey),
        originalGrass,
        originalBush,
      ]),
      ...change([
        "Plants: ",
        sprites.tree1,
        sprites.tree2,
        sprites.bush,
        sprites.grass,
      ]),
      ...change(
        [
          label(sprites.waterDeep, "Water"),
          ", ",
          label(glyph("█", colors.olive), "Sand"),
          ",",
        ],
        [
          label(originalIce, "Ice"),
          " and ",
          label(sprites.fire, "Fire", colors.red),
        ]
      ),
    ]),
    update("0x00", "2009", [
      ...change(["First version of"], [createText("ALIVE", colors.maroon)]),
      ...change(
        ["Terminal binary"],
        ["in ", accent("Visual Basic")],
        ["as ", accent("Windows EXE")]
      ),
      ...change(["Fixed ", accent("80x35"), " size"]),
      ...change(["Keyboard only"]),
      ...change(["World updates"], ["after key press"]),
      ...change(["Random generated"], [label(sprites.wall, "Walls")]),
      ...change(
        [
          label(
            recolorSprite(prism.iron.default, colors.white),
            "Prism",
            colors.maroon
          ),
          " mob with",
        ],
        ["linear movement"]
      ),
      ...change(
        [label(glyph("?", colors.blue), "Question", colors.maroon), " mob"],
        ["with pathfinding"]
      ),
      ...change(["Collect ", item({ stackable: "coin" })]),
      ...change(["Find the ", label(sprites.portal, "Portal")]),
    ]),
  ]);
