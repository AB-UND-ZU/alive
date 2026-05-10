import { CellType } from "../../bindings/creation";
import { Definition } from "./wfc";

export const getDefinition: (emptyTile: CellType) => Definition = (emptyTile: CellType) => ({
  tags: {},
  tiles: {
    air: {
      weight: 200,
      tags: [emptyTile],
    },
    gap: {
      weight: 100,
      tags: ["gap"],
      constraints: {
        neighbour: {
          up: ["basement"],
          down: [emptyTile],
        },
      },
    },
    potLeft: {
      weight: 300,
      tags: ["supply"],
      constraints: {
        neighbour: {
          right: ["basement", "house"],
          left: [emptyTile],
        },
      },
    },
    potRight: {
      weight: 300,
      tags: ["supply"],
      constraints: {
        neighbour: {
          right: [emptyTile],
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
          left: [emptyTile],
        },
      },
    },
    boxRight: {
      weight: 200,
      tags: ["supply"],
      constraints: {
        neighbour: {
          right: [emptyTile],
          left: ["basement", "house"],
        },
      },
    },

    hedge: {
      weight: 0,
      tags: ["hedge"],
    },

    path: {
      weight: 100,
      tags: ["path"],
      constraints: {
        neighbour: {
          up: ["door"],
          right: ["gap"],
          down: [emptyTile],
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
          left: [emptyTile, "supply"],
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
          right: [emptyTile, "supply"],
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
          left: [emptyTile, "supply"],
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
          right: [emptyTile, "supply"],
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
          left: [emptyTile],
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
          right: [emptyTile],
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
          left: [emptyTile],
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
          right: [emptyTile],
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
          left: [emptyTile],
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
          right: [emptyTile],
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
          up: [emptyTile],
          right: ["upperRoof"],
          down: ["lowerRoofLeft0", "roofLeft"],
          left: [emptyTile],
        },
      },
    },
    upperRoof: {
      weight: 100,
      tags: ["upperRoof"],
      constraints: {
        neighbour: {
          up: [emptyTile],
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
          up: [emptyTile],
          right: [emptyTile],
          down: ["lowerRoofRight0", "roofRight"],
          left: ["upperRoof"],
        },
      },
    },
  },
});
