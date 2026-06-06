import { CellType } from "../../bindings/creation";
import { Item } from "../../engine/components/item";
import { Orientation } from "../../engine/components/orientable";
import { Sprite } from "../../engine/components/sprite";
import { colors } from "../assets/colors";
import {
  anvil,
  bench,
  boat,
  box,
  campfire,
  chairLeft,
  chairRight,
  fence,
  fenceDoor,
  fire,
  jetty,
  kettle,
  palisade,
  palisadeDoor,
  path,
  pot,
  sand,
  table,
  waterShallow,
} from "../assets/sprites";
import { brew, craft, createText, forge, recolorSprite } from "../assets/ui";
import { getOrientedSprite } from "../assets/ui";

export type Construction = {
description: Sprite[][];
  variants: {
    orientation?: Orientation;
    sprite: Sprite;
    cell: CellType;
  }[];
  grounds: ("air" | "water" | "sand" | "path")[];
  parts: Omit<Item, "carrier" | "bound">[];
  level: number;
  effort: number;
};

export const buildConstructions: Construction[] = [
  {
    description: [
      createText("A sturdy wooden"),
      createText("post to enclose"),
      createText("an area."),
    ],
    variants: [
      {
        cell: "fence",
        sprite: fence,
      },
    ],
    grounds: ["air", "sand", "path", "water"],
    parts: [{ stackable: "stick", amount: 3 }],
    level: 1,
    effort: 10,
  },
  {
    description: [
      createText("Pass through a"),
      [...createText("wall of "), fence, ...createText("Fences", colors.grey)],
      createText("with a gate."),
    ],
    variants: [
      {
        sprite: fenceDoor,
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
    description: [
      createText("An empty crate"),
      createText("that can be moved"),
      createText("around."),
    ],
    variants: [
      {
        sprite: box,
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
    description: [
      createText("A decorative pot"),
      createText("made from burnt"),
      createText("clay."),
    ],
    variants: [
      {
        sprite: pot,
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
    description: [
      createText("A flat surface to"),
      createText("put things on."),
    ],
    variants: [
      {
        sprite: table,
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
        sprite: anvil,
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
        sprite: campfire,
        cell: "campfire",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [{ stackable: "stick", amount: 10 }],
    level: 1,
    effort: 8,
  },
  {
    description: [
      createText("A dry and sandy"),
      createText("ground slowing"),
      createText("you down."),
    ],
    variants: [
      {
        cell: "sand",
        sprite: sand,
      },
    ],
    grounds: ["air"],
    parts: [{ stackable: "sand", amount: 1 }],
    level: 1,
    effort: 0,
  },
  {
    description: [
      createText("A trail made of"),
      createText("gravel speeding"),
      createText("you up."),
    ],
    variants: [
      {
        cell: "path",
        sprite: path,
      },
    ],
    grounds: ["air"],
    parts: [{ stackable: "gravel", amount: 1 }],
    level: 1,
    effort: 0,
  },
  {
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
        sprite: boat,
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
    description: [
      createText("Used to build a"),
      createText("jetty by the"),
      [waterShallow, ...createText("Water", colors.blue), ...createText(".")],
    ],
    variants: [
      {
        cell: "jetty_horizontal",
        sprite: getOrientedSprite(jetty, "up"),
      },
      {
        cell: "jetty_vertical",
        sprite: getOrientedSprite(jetty, "right"),
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
    description: [
      createText("A heavy stone"),
      createText("barrier enclosing"),
      createText("an area."),
    ],
    variants: [
      {
        cell: "palisade",
        sprite: palisade,
      },
    ],
    grounds: ["air", "sand", "path", "water"],
    parts: [{ stackable: "ore", amount: 6 }],
    level: 2,
    effort: 20,
  },
  {
    description: [
      createText("Pass through a"),
      [...createText("stone "), palisade, ...createText("Wall", colors.grey)],
      createText("with a gate."),
    ],
    variants: [
      {
        sprite: palisadeDoor,
        cell: "palisade_door",
      },
    ],
    grounds: ["air", "sand", "path"],
    parts: [
      { stackable: "ore", amount: 4 },
      { stackable: "stick", amount: 2 },
    ],
    level: 2,
    effort: 30,
  },
];
