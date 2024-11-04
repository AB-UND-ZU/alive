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
      column.map((cell) => mapTiles[wfc.tileNames[cell]] || "?").join("")
    )
    .join("\n");
};

const definition: Definition = {
  tags: {
    // basement_left: {
    //   constraints: {
    //     limit: {
    //       horizontal: 3
    //     },
    //   },
    // },
    // basement_right: {
    //   constraints: {
    //     limit: {
    //       horizontal: 3
    //     },
    //   },
    // },
    // house_left: {
    //   constraints: {
    //     limit: {
    //       horizontal: 3
    //     },
    //   },
    // },
    // house_right: {
    //   constraints: {
    //     limit: {
    //       horizontal: 3
    //     },
    //   },
    // },
  },
  tiles: {
    // 0
    air: {
      weight: 100,
      tags: ["air"],
    },

    // 1
    leaves: {
      weight: 2,
      tags: ["leaves"],
      constraints: {
        neighbour: {
          down: ["trunk"],
        },
      },
    },
    // 2
    trunk: {
      weight: 2,
      tags: ["trunk"],
      constraints: {
        neighbour: {
          up: ["leaves"],
        },
      },
    },

    // 3
    door: {
      weight: 10,
      tags: ["house", "door"],
      constraints: {
        neighbour: {
          up: ["house"],
          right: ["basement_right"],
          down: ["path"],
          left: ["basement_left"],
        },
      },
    },
    // 4
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
    // 5
    groundLeft: {
      weight: 2,
      tags: ["basement", "basement_left"],
      constraints: {
        neighbour: {
          up: ["house_left"],
          right: ["basement_left", "door"],
          down: ["air"],
          left: ["air"],
        },
      },
    },
    // 6
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
    // 7
    groundRight: {
      weight: 2,
      tags: ["basement", "basement_right"],
      constraints: {
        neighbour: {
          up: ["house_right"],
          right: ["air"],
          down: ["air"],
          left: ["basement_right", "door"],
        },
      },
    },

    // 8
    upperLeft: {
      weight: 2,
      tags: ["house_left"],
      constraints: {
        neighbour: {
          up: ["air", "house_left"],
          right: ["house"],
          down: ["house_left", "basement_left"],
          left: ["air"],
        },
      },
    },
    // 9
    house: {
      weight: 2,
      tags: ["house"],
      constraints: {
        neighbour: {
          up: ["air", "house"],
          right: ["house", "house_right"],
          down: ["house"],
          left: ["house", "house_left"],
        },
      },
    },
    // 10
    upperRight: {
      weight: 2,
      tags: ["house_right"],
      constraints: {
        neighbour: {
          up: ["air", "house_right"],
          right: ["air"],
          down: ["house_right", "basement_right"],
          left: ["house"],
        },
      },
    },

    // 11
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
  console.log(wfc, wave);

  if (!wave) return "error";

  while (!wave.isCompleted()) {
    console.info(waveToString(wfc, wave));
    wfc.iterate(wave);
  }

  return waveToString(wfc, wave);
}
