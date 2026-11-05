import { Sprite } from "../../engine/components/sprite";
import { ClassKey } from "../balancing/classes";
import { colors } from "./colors";
import { heart } from "./sprites";

export const credits: {
  name: string;
  classKey?: ClassKey;
  hairColor?: string;
  sprite?: Sprite;
  thanks: string[];
  role?: string;
  link?: string;
  names?: string[];
}[] = [
  {
    name: "Otto Sichert",
    classKey: "rogue",
    hairColor: colors.maroon,
    thanks: ["Hope you like it!"],
    role: "Founder & Dev",
    link: "mailto:git@ottosichert.de",
  },
  {
    name: "Dmitrii Labadin",
    classKey: "mage",
    hairColor: colors.maroon,
    thanks: ['"You need 3D!"'],
    role: "Strategic Advisor",
    link: "https://store.steampowered.com/app/2730700/DRONE_PERSPECTIVE/",
  },
  {
    name: "Milan Lefferts",
    classKey: "knight",
    hairColor: colors.olive,
    thanks: ['"Add some sound?"'],
    role: "Concept & Design",
    link: "https://milanlefferts.com/",
  },
  {
    name: "Game Testers",
    sprite: heart,
    thanks: ["Thank you for all", "the feedback!"],
    names: [
      "Dmitrii",
      "Milan",
      "Henni",
      "Max",
      "Max",
      "Polina",
      "Aurelie",
      "Anna-Belén",
      "Harald",
      "Cecilia",
      "Pablo",
      "Gabriel",
      "Fadi",
      "Philipp",
      "Alejandro",
      "Nik",
      "Pedro",
      "Akshay",
      "Mariia",
    ],
  },
];
