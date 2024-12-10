import { matrixFactory } from "../../game/math/matrix";
import { findPathSimple } from "../../game/math/path";
import { Point } from "../../game/math/std";
import { Definition, WaveFunctionCollapse } from "./wfc";

const mapTiles: Record<string, string> = {
  air: "",
  gap: "",
  hedge: "hedge",
  path: "path",

  potLeft: "pot",
  potRight: "pot",
  boxLeft: "box",
  boxRight: "box",

  doorLeft: "wood_door",
  doorCenter: "wood_door",
  doorRight: "wood_door",

  wallLeft4: "wall",
  wallLeft3: "wall",
  wallLeft2: "wall",
  wallLeft1: "wall",

  windowLeft3: "wall_window",
  windowLeft2: "wall_window",
  windowLeft1: "wall_window",

  cornerLeft0: "basement_left",

  wallRight4: "wall",
  wallRight3: "wall",
  wallRight2: "wall",
  wallRight1: "wall",

  windowRight3: "wall_window",
  windowRight2: "wall_window",
  windowRight1: "wall_window",

  cornerRight0: "basement_right",

  houseLeft: "house_left",
  houseRight: "house_right",
  house: "house",
  window: "house_window",

  lowerRoofLeft1: "roof_down_left",
  lowerRoof1: "roof_down",
  lowerRoofRight1: "roof_right_down",
  lowerRoofLeft0: "roof_down_left",
  lowerRoof0: "roof_down",
  lowerRoofRight0: "roof_right_down",

  upperRoofLeft: "roof_left_up",
  upperRoof: "roof_up",
  upperRoofRight: "roof_up_right",

  roofLeft: "roof_left",
  roof: "roof",
  roofRight: "roof_right",
};

const definition: Definition = {
  tags: {},
  tiles: {
    air: {
      weight: 200,
      tags: ["air"],
    },
    gap: {
      weight: 100,
      tags: ["gap"],
      constraints: {
        neighbour: {
          up: ["basement"],
          down: ["air"],
        },
      },
    },
    potLeft: {
      weight: 300,
      tags: ["supply"],
      constraints: {
        neighbour: {
          right: ["basement", "house"],
          left: ["air"],
        },
      },
    },
    potRight: {
      weight: 300,
      tags: ["supply"],
      constraints: {
        neighbour: {
          right: ["air"],
          left: ["basement", "house"],
        },
      },
    },
    boxLeft: {
      weight: 200,
      tags: ["supply"],
      constraints: {
        neighbour: {
          right: ["basement", "house"],
          left: ["air"],
        },
      },
    },
    boxRight: {
      weight: 200,
      tags: ["supply"],
      constraints: {
        neighbour: {
          right: ["air"],
          left: ["basement", "house"],
        },
      },
    },

    hedge: {
      weight: 15,
      tags: ["hedge"],
    },

    path: {
      weight: 100,
      tags: ["path"],
      constraints: {
        neighbour: {
          up: ["door"],
          right: ["gap"],
          down: ["air"],
          left: ["gap"],
        },
      },
    },

    // doors

    doorLeft: {
      weight: 100,
      tags: ["basement", "door"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["entryRight4"],
          down: ["path"],
          left: ["entryLeft0"],
        },
      },
    },
    doorCenter: {
      weight: 100,
      tags: ["basement", "door"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["entryRight2"],
          down: ["path"],
          left: ["entryLeft2"],
        },
      },
    },
    doorRight: {
      weight: 100,
      tags: ["basement", "door"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["entryRight0"],
          down: ["path"],
          left: ["entryLeft4"],
        },
      },
    },

    // basement left

    wallLeft4: {
      weight: 100,
      tags: ["basement", "entryLeft4"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["door"],
          down: ["gap"],
          left: ["basementLeft3"],
        },
      },
    },

    wallLeft3: {
      weight: 100,
      tags: ["basement", "basementLeft3"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["entryLeft4"],
          down: ["gap"],
          left: ["basementLeft2"],
        },
      },
    },
    windowLeft3: {
      weight: 150,
      tags: ["basement", "basementLeft3"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["entryLeft4"],
          down: ["gap"],
          left: ["basementLeft2"],
        },
      },
    },

    wallLeft2: {
      weight: 100,
      tags: ["basement", "entryLeft2", "basementLeft2"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["door", "basementLeft3"],
          down: ["gap"],
          left: ["basementLeft1"],
        },
      },
    },
    windowLeft2: {
      weight: 150,
      tags: ["basement", "basementLeft2"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["basementLeft3"],
          down: ["gap"],
          left: ["basementLeft1"],
        },
      },
    },

    wallLeft1: {
      weight: 100,
      tags: ["basement", "basementLeft1"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["entryLeft2"],
          down: ["gap"],
          left: ["basementLeft0"],
        },
      },
    },
    windowLeft1: {
      weight: 150,
      tags: ["basement", "basementLeft1"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["entryLeft2", "basementLeft2"],
          down: ["gap"],
          left: ["basementLeft0"],
        },
      },
    },

    cornerLeft0: {
      weight: 100,
      tags: ["basement", "basementLeft0", "entryLeft0", "cornerLeft"],
      constraints: {
        neighbour: {
          up: ["houseLeft", "lowerRoofLeft1"],
          right: ["basementLeft1", "door"],
          down: ["gap"],
          left: ["air", "supply"],
        },
      },
    },

    // basement right

    wallRight4: {
      weight: 100,
      tags: ["basement", "entryRight4"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["basementRight3"],
          down: ["gap"],
          left: ["door"],
        },
      },
    },

    wallRight3: {
      weight: 100,
      tags: ["basement", "basementRight3"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["basementRight2"],
          down: ["gap"],
          left: ["entryRight4"],
        },
      },
    },
    windowRight3: {
      weight: 150,
      tags: ["basement", "basementRight3"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["basementRight2"],
          down: ["gap"],
          left: ["entryRight4"],
        },
      },
    },

    wallRight2: {
      weight: 100,
      tags: ["basement", "entryRight2", "basementRight2"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["basementRight1"],
          down: ["gap"],
          left: ["door", "basementRight3"],
        },
      },
    },
    windowRight2: {
      weight: 150,
      tags: ["basement", "basementRight2"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["basementRight1"],
          down: ["gap"],
          left: ["basementRight3"],
        },
      },
    },

    wallRight1: {
      weight: 100,
      tags: ["basement", "basementRight1"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["basementRight0"],
          down: ["gap"],
          left: ["entryRight2"],
        },
      },
    },
    windowRight1: {
      weight: 150,
      tags: ["basement", "basementRight1"],
      constraints: {
        neighbour: {
          up: ["house0", "lowerRoof1"],
          right: ["basementRight0"],
          down: ["gap"],
          left: ["entryRight2", "basementRight2"],
        },
      },
    },

    cornerRight0: {
      weight: 100,
      tags: ["basement", "basementRight0", "entryRight0", "cornerRight"],
      constraints: {
        neighbour: {
          up: ["houseRight", "lowerRoofRight1"],
          right: ["air", "supply"],
          down: ["gap"],
          left: ["basementRight1", "door"],
        },
      },
    },

    // house

    houseLeft: {
      weight: 100,
      tags: ["house", "houseLeft"],
      constraints: {
        neighbour: {
          up: ["lowerRoofLeft0"],
          right: ["house"],
          down: ["cornerLeft"],
          left: ["air", "supply"],
        },
      },
    },
    house: {
      weight: 100,
      tags: ["house", "house0"],
      constraints: {
        neighbour: {
          up: ["lowerRoof0"],
          right: ["house"],
          down: ["basement"],
          left: ["house"],
        },
      },
    },
    houseRight: {
      weight: 100,
      tags: ["house", "houseRight"],
      constraints: {
        neighbour: {
          up: ["lowerRoofRight0"],
          right: ["air", "supply"],
          down: ["cornerRight"],
          left: ["house"],
        },
      },
    },
    window: {
      weight: 60,
      tags: ["house", "house0"],
      constraints: {
        neighbour: {
          up: ["lowerRoof0"],
          right: ["house"],
          down: ["basement"],
          left: ["house"],
        },
      },
    },

    // lower roof

    lowerRoofLeft0: {
      weight: 100,
      tags: ["lowerRoof", "lowerRoof0", "lowerRoofLeft", "lowerRoofLeft0"],
      constraints: {
        neighbour: {
          up: ["roofLeft", "upperRoofLeft"],
          right: ["lowerRoof0"],
          down: ["houseLeft", "cornerLeft"],
          left: ["air"],
        },
      },
    },
    lowerRoof0: {
      weight: 100,
      tags: ["lowerRoof", "lowerRoof0"],
      constraints: {
        neighbour: {
          up: ["roof", "upperRoof"],
          right: ["lowerRoof0"],
          down: ["house", "basement"],
          left: ["lowerRoof0"],
        },
      },
    },
    lowerRoofRight0: {
      weight: 100,
      tags: ["lowerRoof", "lowerRoof0", "lowerRoofRight", "lowerRoofRight0"],
      constraints: {
        neighbour: {
          up: ["roofRight", "upperRoofRight"],
          right: ["air"],
          down: ["houseRight", "cornerRight"],
          left: ["lowerRoof0"],
        },
      },
    },

    lowerRoofLeft1: {
      weight: 100,
      tags: ["lowerRoof", "lowerRoof1", "lowerRoofLeft", "lowerRoofLeft1"],
      constraints: {
        neighbour: {
          up: ["roofLeft"],
          right: ["lowerRoof1"],
          down: ["houseLeft", "cornerLeft"],
          left: ["air"],
        },
      },
    },
    lowerRoof1: {
      weight: 100,
      tags: ["lowerRoof", "lowerRoof1"],
      constraints: {
        neighbour: {
          up: ["roof"],
          right: ["lowerRoof1"],
          down: ["house", "basement"],
          left: ["lowerRoof1"],
        },
      },
    },
    lowerRoofRight1: {
      weight: 100,
      tags: ["lowerRoof", "lowerRoof1", "lowerRoofRight", "lowerRoofRight1"],
      constraints: {
        neighbour: {
          up: ["roofRight"],
          right: ["air"],
          down: ["houseRight", "cornerRight"],
          left: ["lowerRoof1"],
        },
      },
    },

    // middle roof
    roofLeft: {
      weight: 100,
      tags: ["roof", "roofLeft"],
      constraints: {
        neighbour: {
          up: ["upperRoofLeft"],
          right: ["roof"],
          down: ["lowerRoofLeft"],
          left: ["air"],
        },
      },
    },
    roof: {
      weight: 100,
      tags: ["roof"],
      constraints: {
        neighbour: {
          up: ["upperRoof"],
          right: ["roof"],
          down: ["lowerRoof"],
          left: ["roof"],
        },
      },
    },
    roofRight: {
      weight: 100,
      tags: ["roof", "roofRight"],
      constraints: {
        neighbour: {
          up: ["upperRoofRight"],
          right: ["air"],
          down: ["lowerRoofRight"],
          left: ["roof"],
        },
      },
    },

    // upper roof

    upperRoofLeft: {
      weight: 100,
      tags: ["upperRoof", "upperRoofLeft"],
      constraints: {
        neighbour: {
          up: ["air"],
          right: ["upperRoof"],
          down: ["lowerRoofLeft0", "roofLeft"],
          left: ["air"],
        },
      },
    },
    upperRoof: {
      weight: 100,
      tags: ["upperRoof"],
      constraints: {
        neighbour: {
          up: ["air"],
          right: ["upperRoof"],
          down: ["lowerRoof0", "roof"],
          left: ["upperRoof"],
        },
      },
    },
    upperRoofRight: {
      weight: 100,
      tags: ["upperRoof", "upperRoofRight"],
      constraints: {
        neighbour: {
          up: ["air"],
          right: ["air"],
          down: ["lowerRoofRight0", "roofRight"],
          left: ["upperRoof"],
        },
      },
    },
  },
};

const airWeight = 20;
const pathWeight = 1;

export default async function generateTown(width: number, height: number) {
  const wfc = new WaveFunctionCollapse(definition);
  const innerWidth = width - 2;
  const innerHeight = height - 2;

  const innX = Math.floor(innerWidth / 2);
  const innY = Math.floor(innerHeight / 2);
  const exits: Point[] = [
    { x: 0, y: innY },
    { x: innerWidth - 1, y: innY },
  ];

  const wave = wfc.generate(innerWidth, innerHeight, [
    // place inn in center
    [innX, innY, "doorCenter"],

    // clear entries
    ...exits.map(({ x, y }): [number, number, string] => [x, y, "air"]),
  ]);

  if (!wave) throw new Error("Could not generate town!");

  const tileMatrix = wave.chosen;
  const paths = [...exits];

  // prefer reusing existing paths
  const walkableMatrix = matrixFactory<number>(
    innerWidth,
    innerHeight,
    (x, y) => {
      const value = tileMatrix[x][y];
      const tile = wfc.tileNames[value];

      if (["doorLeft", "doorCenter", "doorRight"].includes(tile)) {
        if (x !== innX && y !== innY) paths.push({ x, y });

        return airWeight;
      }
      return tile === "path" ? pathWeight : tile === "air" ? airWeight : 0;
    }
  );

  // draw paths from exits and houses to center inn
  const innPath = { x: innX, y: innY + 2 };
  const pathIndex = wfc.tileNames.indexOf("path");
  paths.forEach((path) => {
    const route = findPathSimple(walkableMatrix, path, innPath);

    route.forEach((point) => {
      tileMatrix[point.x][point.y] = pathIndex;
      walkableMatrix[point.x][point.y] = pathWeight;
    });
  });

  // replace free entry air with paths
  exits.forEach((point) => {
    tileMatrix[point.x][point.y] = pathIndex;
  });

  // draw fence around town
  const townMatrix = matrixFactory(width, height, (x, y) => {
    const horizontalEdge = x === 0 || x === width - 1;
    const verticalEdge = y === 0 || y === height - 1;

    if (horizontalEdge && verticalEdge) return "air";
    if (horizontalEdge && y === innY + 1) return "path";

    if (horizontalEdge || verticalEdge) return "fence";

    return mapTiles[wfc.tileNames[tileMatrix[x - 1][y - 1]]];
  });

  return townMatrix;
}
