import { transpose } from "../../game/math/matrix";
import { Definition, Wave, WaveFunctionCollapse } from "./wfc";

const mapTiles: Record<string, string> = {
  air: " ",
  door: "◙",
  wallLeft: "█",
  wallRight: "█",
  leaves: "#",
  trunk: "|",
  path: "░",
};

const waveToString = (wfc: WaveFunctionCollapse, wave: Wave) => {
  return transpose(wave.chosen)
    .map((column) =>
      column.map((cell) => mapTiles[wfc.tileNames[cell]]).join("")
    )
    .join("\n");
};

const definition: Definition = {
  tiles: {
    air: {
      weight: 100,
      tags: ["air"],
    },
    leaves: {
      weight: 2,
      tags: ["leaves"],
      constraints: {
        neighbour: {
          down: ["trunk"],
        },
      },
    },
    trunk: {
      weight: 2,
      tags: ["trunk"],
      constraints: {
        neighbour: {
          up: ["leaves"],
        },
      },
    },
    door: {
      weight: 1,
      tags: ["house", "door", "basement"],
      constraints: {
        neighbour: {
          up: ["air"],
          right: ["basement_right"],
          down: ["path"],
          left: ["basement_left"],
        },
      },
    },
    wallLeft: {
      weight: 2,
      tags: ["house", "basement", "basement_left"],
      constraints: {
        neighbour: {
          up: ["air"],
          right: ["basement_left", "door"],
          down: ["air"],
          left: ["basement_left", "air"],
        },
      },
    },
    wallRight: {
      weight: 2,
      tags: ["house", "basement", "basement_right"],
      constraints: {
        neighbour: {
          up: ["air"],
          right: ["basement_right", "air"],
          down: ["air"],
          left: ["basement_right", "door"],
        },
      },
    },
    path: {
      weight: 1,
      tags: ["path"],
      constraints: {
        neighbour: {
          up: ["door"],
        },
      },
    },
  },
};

export default function wfc() {
  const wfc = new WaveFunctionCollapse(definition);

  const wave = wfc.generate(20, 20, {
    10: { 10: "door" },
  });

  return waveToString(wfc, wave);
}
