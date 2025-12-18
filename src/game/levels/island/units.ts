import { BiomeName } from "../../../engine/components/level";
import { NpcDistribution } from "../../balancing/units";

export const islandNpcDistribution: Record<BiomeName, NpcDistribution> = {
  ocean: {},
  jungle: {
    prism: 43,
    eye: 30,
    orb: 25,
    fairy: 2,
  },
  desert: {
    goldPrism: 43,
    goldEye: 30,
    goldOrb: 25,
    fairy: 2,
  },
  glacier: {},
};
