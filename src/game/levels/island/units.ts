import { BiomeName } from "../../../engine/components/level";
import { NpcDistribution } from "../../balancing/units";

export const islandNpcDistribution: Record<BiomeName, NpcDistribution> = {
  ocean: {},
  jungle: {
    prism: 30,
    eye: 24,
    orb: 20,
    rose: 8,
    violet: 8,
    clover: 8,
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
