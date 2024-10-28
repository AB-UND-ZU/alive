import { transpose } from "../../game/math/matrix";
import { Definition, Wave, WaveFunctionCollapse } from "./wfc";

const mapTiles: Record<string, string> = {
  air: " ",
  door: "◙",
  wallLeft: "█",
  groundLeft: "▐",
  wallRight: "█",
  groundRight: "▌",
  upperLeft: "▐",
  house: "█",
  upperRight: "▌",
  leaves: "#",
  trunk: "|",
  path: "░",
};

const waveToString = (wfc: WaveFunctionCollapse, wave: Wave) => {
  return transpose(wave.chosen)
    .map((column) =>
      column.map((cell) => mapTiles[wfc.tileNames[cell]] || " ").join("")
    )
    .join("\n");
};

const definition: Definition = {
  tags: {
    house: {
      constraints: {
        dimension: {
          minWidth: 5,
          maxWidth: 10,
          minHeight: 3,
          maxHeight: 6,
        },
      },
    },
  },
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
      weight: 10,
      tags: ["house", "door", "basement"],
      constraints: {
        neighbour: {
          up: ["house"],
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
          up: ["house"],
          right: ["basement_left", "door"],
          down: ["air"],
          left: ["basement_left"],
        },
      },
    },
    groundLeft: {
      weight: 2,
      tags: ["house", "basement", "basement_left"],
      constraints: {
        neighbour: {
          up: ["house_left"],
          right: ["basement_left", "door"],
          down: ["air"],
          left: ["air"],
        },
      },
    },
    wallRight: {
      weight: 2,
      tags: ["house", "basement", "basement_right"],
      constraints: {
        neighbour: {
          up: ["house"],
          right: ["basement_right"],
          down: ["air"],
          left: ["basement_right", "door"],
        },
      },
    },
    groundRight: {
      weight: 2,
      tags: ["house", "basement", "basement_right"],
      constraints: {
        neighbour: {
          up: ["house_right"],
          right: ["air"],
          down: ["air"],
          left: ["basement_right", "door"],
        },
      },
    },

    upperLeft: {
      weight: 2,
      tags: ["house", "house_left"],
      constraints: {
        neighbour: {
          up: ["air", "house_left"],
          right: ["house"],
          down: ["house_left", "basement_left"],
          left: ["air"],
        },
      },
    },
    house: {
      weight: 2,
      tags: ["house"],
      constraints: {
        neighbour: {
          up: ["air", "house"],
          right: ["house"],
          down: ["house"],
          left: ["house"],
        },
      },
    },
    upperRight: {
      weight: 2,
      tags: ["house", "house_right"],
      constraints: {
        neighbour: {
          up: ["air", "house_right"],
          right: ["air"],
          down: ["house_right", "basement_right"],
          left: ["house"],
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
