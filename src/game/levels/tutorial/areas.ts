import type * as questTypes from "../../assets/quests";
import { Position } from "../../../engine/components/position";
import { UnitKey } from "../../balancing/units";

export const roomSize = { x: 20, y: 12 };
export const tutorialSpawn = { x: 0, y: 0 };

export const centerArea = `\
██████████ ██████████
█##&τ,         ,τ&##█
█&τ,             ,τ&█
█τ,       s       ,τ█
█,       ,,,       ,█
█       ,   ,       █
█  ⌠   ,  ♀  ,   *  █
█       ,   ,       █
█,       ,,,       ,█
█τ,               ,τ█
█&τ,      ¡      ,τ&█
█##&τ,         ,τ&##█
█████████████████████\
`;

export const up1Area = `\
██████████ ██████████
█                   █
█  ╒╦╦╦╦╕    ±±±±±  █
█  ╠╬╬╬╬╣   ±     ± █
█  ╞╪╪╪╪╡   ±  Ω  ± █
█ ■└G┴──┘o  ±     ± █
█   ▒        ±±=±±  █
█   ▒  .       ▒    █
█  ,▒▒▒≡     ▒▒▒    █
█ ,ττ·▒▒▒▒▒▒▒▒      █
█ ,',          g    █
█                   █
██████████ ██████████\
`;

export const up2Cactus = { x: -7, y: 1 - roomSize.y * 2 };

export const up2Area = `\
██████████ ██████████
█░░░░░░░^░░░^░░░░░░░█
█░░░░░░░░^^^░░░¶(¶░░█
█░░f░░░░░░░░░░¶≈≈≈¶░█
█░░░░░░░¥░░░░░¶≈≈≈¶░█
█░░░░░░░░░░░░░░¶(¶░░█
█░░░░░██████░░░░░░░░ 
██¥¥¥██░░░░██░░░░░░░█
██░░░█░░░░░░█░░░░░^░█
█░░░░█^^██░░███░░░░░█
█░░░░░░░█░░░░░█░░F░░█
█░░░░░░░█░░░░░█░░░░░█
██████████ ██████████\
`;

export const up2Right1Area = `\
█████████████████████
█░░░░░░░░░░░░░░░░░░░█
█░░░░≈≈≈≈≈≈≈≈≈≈≈░░░░█
█░░≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈░░█
█░≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈░█
█░≈≈≈≈≈≈≈░░░≈≈≈≈≈≈≈░█
 ░░░░≈≈≈░p P░≈≈░░░░░█
█░≈≈≈≈≈≈≈░░░≈≈≈≈≈≈≈░█
█░≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈░█
█░░≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈░░█
█░░░░≈≈≈≈≈≈≈≈≈≈≈░░░░█
█░░░░░░░░░░░░░░░░░░░█
█████████████████████\
`;

export const up3Left = { x: -7, y: -roomSize.y * 3 };
export const up3Right = { x: 7, y: -roomSize.y * 3 };

export const up3Area = `\
██████████ ██████████
█#.&τ,         ,τ&.#█
█&τ,             ,τ&█
█τ,               ,τ█
█,   >   ,&,   >   ,█
█       ,# #,       █
█  ÷    & ! &    ÷  █
█       ,# #,       █
█,   >   ,&,   >   ,█
█τ,               ,τ█
█&τ,             ,τ&█
█#.&τ,         ,τ&.#█
██████████ ██████████\
`;

export const up4Center = { x: 0, y: -roomSize.y * 4 - 2 };

export const up4Area = `\
██████████ ██████████
█                   █
█    ,,       ,,    █
█   ,ττ,     ,ττ,   █
█   ,ττ,  ÷  ,ττ,   █
█    ,,       ,,    █
█                   █
█    ,,       ,,    █
█   ,ττ,     ,ττ,   █
█   ,ττ,     ,ττ,   █
█    ,,       ,,    █
█                   █
██████████ ██████████\
`;

export const up5Area = `\
█████████████████████
█   ,,         ,,   █
█  ,    τττττ    ,  █
█ ,   ττ     ττ   , █
█,   τ   &&&   τ   ,█
█,  τ   &   &   τ  ,█
█,  τ  &  ∩  &  τ  ,█
█,  τ   &   &   τ  ,█
█,   τ   &&&   τ   ,█
█ ,   ττ     ττ  w, █
█  ,    τττττ    ,  █
█   ,,         ,,   █
██████████ ██████████\
`;

export const tutorialRooms: {
  name: string;
  area: string;
  offsetX: number;
  offsetY: number;
  quest?: keyof typeof questTypes;
  waves?: { types: (UnitKey | undefined)[]; position: Position }[];
}[] = [
  {
    name: "center",
    offsetX: 0,
    offsetY: 0,
    quest: "centerQuest",
    area: centerArea,
  },
  {
    name: "north1",
    offsetX: 0,
    offsetY: roomSize.y * -1,
    quest: "north1Quest",
    area: up1Area,
  },
  {
    name: "north2",
    offsetX: 0,
    offsetY: roomSize.y * -2,
    quest: "north2Quest",
    area: up2Area,
  },
  {
    name: "north2east1",
    offsetX: roomSize.x,
    offsetY: roomSize.y * -2,
    area: up2Right1Area,
  },
  {
    name: "north3",
    offsetX: 0,
    offsetY: roomSize.y * -3,
    waves: [
      { types: ["eye", "prism", "orb"], position: up3Left },
      { types: ["eye", "prism", "orb"], position: up3Right },
    ],
    area: up3Area,
  },
  {
    name: "north4",
    offsetX: 0,
    offsetY: roomSize.y * -4,
    area: up4Area,
    waves: [{ types: ["tutorialBoss"], position: up4Center }],
  },
  { name: "north5", offsetX: 0, offsetY: roomSize.y * -5, area: up5Area },
];
