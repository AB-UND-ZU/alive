import { CellType } from "../../bindings/creation";
import { Item } from "../../engine/components/item";
import { Sprite } from "../../engine/components/sprite";
import { colors } from "../assets/colors";
import {
  anvil,
  barrier,
  bench,
  boat,
  box,
  campfire,
  chairLeft,
  chairRight,
  fence,
  fire,
  jetty,
  kettle,
  palisade,
  path,
  pot,
  sand,
  table,
  waterShallow,
} from "../assets/sprites";
import { fenceDoorClosed, palisadeDoorClosed } from "../assets/templates/units";
import {
  brew,
  craft,
  createCountable,
  createText,
  forge,
  recolorSprite,
} from "../assets/ui";
import { getOrientedSprite } from "../assets/ui";

export type Construction = {
  description: Sprite[][];
  sprite: Sprite;
  variants: {
    sprite?: Sprite;
    cell: CellType;
  }[];
  grounds: ("air" | "water" | "sand" | "path")[];
  parts: Omit<Item, "carrier" | "bound">[];
  level: number;
  effort: number;
};

export const buildConstructions: Construction[] = [
  {
    sprite: fence,
    description: [
      createText("A sturdy wooden"),
      createText("post to enclose"),
      createText("an area."),
    ],
    variants: [
      {
        cell: "fence",
      },
    ],
    grounds: ["air", "sand", "path", "water"],
    parts: [{ stackable: "stick", amount: 3 }],
    level: 1,
    effort: 10,
  },
  {
    sprite: fenceDoorClosed.wood.default,
    description: [
      createText("Pass through a"),
      [...createText("wall of "), fence, ...createText("Fences", colors.grey)],
      createText("with a gate."),
    ],
    variants: [
      {
        cell: "fence_door",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "stick", amount: 2 },
      { stackable: "ore", amount: 2 },
    ],
    level: 1,
    effort: 15,
  },
  {
    sprite: box,
    description: [
      createText("An empty crate"),
      createText("that can be moved"),
      createText("around."),
    ],
    variants: [
      {
        cell: "box_empty",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "resource", material: "wood", amount: 1 },
      { stackable: "ore", amount: 4 },
    ],
    level: 1,
    effort: 8,
  },
  {
    sprite: pot,
    description: [
      createText("A decorative pot"),
      createText("made from burnt"),
      createText("clay."),
    ],
    variants: [
      {
        cell: "pot_empty",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "sand", amount: 3 },
      { stackable: "gravel", amount: 3 },
    ],
    level: 1,
    effort: 8,
  },
  {
    sprite: chairLeft,
    description: [
      createText("A small but comfy"),
      createText("stool made from"),
      createText("wood."),
    ],
    variants: [
      {
        sprite: chairLeft,
        cell: "chair_left",
      },
      {
        sprite: chairRight,
        cell: "chair_right",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [{ stackable: "stick", amount: 2 }],
    level: 1,
    effort: 8,
  },
  {
    sprite: table,
    description: [
      createText("A flat surface to"),
      createText("put things on."),
    ],
    variants: [
      {
        cell: "table",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "stick", amount: 2 },
      { stackable: "ore", amount: 3 },
    ],
    level: 1,
    effort: 10,
  },
  {
    sprite: bench,
    description: [
      createText("A workbench with"),
      createText("tools used for"),
      [craft, ...createText("Crafting", colors.grey), ...createText(".")],
    ],
    variants: [
      {
        sprite: recolorSprite(bench, { [colors.silver]: colors.grey }),
        cell: "bench",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "stick", amount: 10 },
      { stackable: "ore", amount: 3 },
    ],
    level: 1,
    effort: 20,
  },
  {
    sprite: anvil,
    description: [
      createText("Heavy iron block"),
      createText("which can be used"),
      [
        ...createText("for "),
        forge,
        ...createText("Forging", colors.grey),
        ...createText("."),
      ],
    ],
    variants: [
      {
        cell: "anvil",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "resource", material: "iron", amount: 5 },
      { stackable: "ore", amount: 10 },
    ],
    level: 1,
    effort: 25,
  },
  {
    sprite: kettle,
    description: [
      createText("A large cauldron"),
      createText("with lot of space"),
      [
        ...createText("for "),
        brew,
        ...createText("Brewing", colors.grey),
        ...createText("."),
      ],
    ],
    variants: [
      {
        sprite: recolorSprite(kettle, { [colors.blue]: colors.navy }),
        cell: "kettle",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "resource", material: "iron", amount: 3 },
      { consume: "bucket", material: "iron", element: "water", amount: 3 },
    ],
    level: 1,
    effort: 20,
  },
  {
    sprite: campfire,
    description: [
      createText("Neatly arranged"),
      createText("sticks to start"),
      [
        ...createText("a "),
        fire,
        ...createText("Fire", colors.yellow),
        ...createText("."),
      ],
    ],
    variants: [
      {
        cell: "campfire",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [{ stackable: "stick", amount: 10 }],
    level: 1,
    effort: 8,
  },
  {
    sprite: sand,
    description: [
      createText("A dry and sandy"),
      createText("ground slowing"),
      createText("you down."),
    ],
    variants: [
      {
        cell: "sand",
      },
    ],
    grounds: ["air"],
    parts: [{ stackable: "sand", amount: 1 }],
    level: 1,
    effort: 0,
  },
  {
    sprite: path,
    description: [
      createText("A trail made of"),
      createText("gravel speeding"),
      createText("you up."),
    ],
    variants: [
      {
        cell: "path",
      },
    ],
    grounds: ["air"],
    parts: [{ stackable: "gravel", amount: 2 }],
    level: 1,
    effort: 0,
  },
  {
    sprite: boat,
    description: [
      createText("A small vessel"),
      createText("which can carry"),
      [
        ...createText("you over "),
        waterShallow,
        ...createText("Water", colors.blue),
        ...createText("."),
      ],
    ],
    variants: [
      {
        cell: "boat",
      },
    ],
    grounds: ["water"],
    parts: [
      { stackable: "plank", amount: 1 },
      { stackable: "resource", material: "iron", amount: 1 },
    ],
    level: 1,
    effort: 15,
  },
  {
    sprite: jetty,
    description: [
      createText("Used to build a"),
      createText("jetty by the"),
      [waterShallow, ...createText("Water", colors.blue), ...createText(".")],
    ],
    variants: [
      {
        cell: "jetty_vertical",
        sprite: recolorSprite(getOrientedSprite(jetty, "up"), {
          [colors.navy]: colors.blue,
        }),
      },
      {
        cell: "jetty_horizontal",
        sprite: recolorSprite(getOrientedSprite(jetty, "right"), {
          [colors.navy]: colors.blue,
        }),
      },
    ],
    grounds: ["water"],
    parts: [
      { stackable: "plank", amount: 1 },
      { stackable: "resource", material: "wood", amount: 1 },
    ],
    level: 2,
    effort: 15,
  },
  {
    sprite: palisade,
    description: [
      createText("A heavy stone"),
      createText("barrier enclosing"),
      createText("an area."),
    ],
    variants: [
      {
        cell: "palisade",
      },
    ],
    grounds: ["air", "sand", "path", "water"],
    parts: [{ stackable: "ore", amount: 6 }],
    level: 2,
    effort: 20,
  },
  {
    sprite: barrier,
    description: [
      createText("A defensive stone"),
      createText("wall with spikes."),
      createCountable({ spike: 1 }, "spike", "display"),
    ],
    variants: [
      {
        cell: "barrier",
      },
    ],
    grounds: ["air", "sand", "path", "water"],
    parts: [
      { stackable: "ore", amount: 6 },
      { stackable: "thorn", amount: 4 },
    ],
    level: 2,
    effort: 20,
  },
  {
    sprite: palisadeDoorClosed.wood.default,
    description: [
      createText("Pass through a"),
      [...createText("stone "), palisade, ...createText("Wall", colors.grey)],
      createText("with a gate."),
    ],
    variants: [
      {
        cell: "palisade_door",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "ore", amount: 4 },
      { stackable: "stick", amount: 4 },
    ],
    level: 2,
    effort: 30,
  },
];
