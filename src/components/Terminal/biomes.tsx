import { TileType } from "worldmap-generator";
import { Burning, Campfire, Cell, DeepWater, Flower, Ice, Mana, Rock, Sand, ShallowWater } from "./entities";

export class World {
  tileTypes: TileType[] = [];
  tileCells: Record<string, Cell>;

  constructor(biomes: Biome[]) {
    this.tileTypes = biomes.reduce<World['tileTypes']>((tileTypes, biome) => tileTypes.concat(biome.tileTypes), []);
    this.tileCells = biomes.reduce<World['tileCells']>((tileCells, biome) => ({ ...tileCells, ...biome.tileCells }), {});
  }
}

type BiomeTile = {
  size: number,
  connections?: Record<string, number>,
  cell: Cell,
};

type BiomeConfiguration = Record<string, BiomeTile>;

class Biome {
  tileTypes: TileType[] = [];
  tileCells: Record<string, Cell>;

  constructor(configuration: BiomeConfiguration) {
    this.tileCells = Object.keys(configuration).reduce((tileCells, tileName) => ({
      ...tileCells,
      [tileName]: configuration[tileName].cell
    }), {})
    this.tileTypes = Object.keys(configuration).map((tileName) => ({
      name: tileName,
      connections: { ...configuration[tileName].connections, [tileName]: configuration[tileName].size }
    }));
  }
}

export const basic = new Biome({
  water: {
    size: 300,
    cell: { grounds: [<ShallowWater amount={1} />] },
    connections: { sand: 1, air: 1 }
  },
  sand: {
    size: 100,
    cell: { grounds: [<Sand amount={1} />] },
    connections: { air: 1 }
  },
  green: {
    size: 100,
    cell: { sprite: <Flower /> },
    connections: { air: 50 }
  },
  ice: {
    size: 50,
    cell: { grounds: [<Ice amount={1} />] },
    connections: { rock: 10 }
  },
  rock: {
    size: 500,
    cell: { terrain: <Rock /> },
    connections: { air: 20 }
  },
  air: {
    size: 500,
    cell: {},
  },
});

export const world = new World([basic]);

/*
export const frozen = new Biome({
  frozen_ice: {
    size: 30,
    cell: { grounds: [<Ice amount={1} />] },
    connections: { frozen_shallow: 1 }
  },
  frozen_shallow: {
    size: 20,
    cell: { grounds: [<ShallowWater amount={1} />] },
    connections: { ocean_shallow: 1 }
  },
});

export const island = new Biome({
  island_green: {
    size: 20,
    cell: { sprite: <Flower /> },
    connections: { island_air: 10, island_sand: 1 }
  },
  island_air: {
    size: 100,
    cell: {},
    connections: { island_sand: 1 }
  },
  island_sand: {
    size: 100,
    cell: { grounds: [<Sand amount={1} />] },
    connections: { ocean_shallow: 1 }
  },
});

export const ocean = new Biome({
  ocean_deep: {
    size: 300,
    cell: { terrain: <DeepWater /> },
    connections: { ocean_shallow: 1 }
  },
  ocean_shallow: {
    size: 100,
    cell: { grounds: [<ShallowWater amount={1} />] },
    connections: { beach_sand: 5, meadow_air: 1, meadow_green: 1 }
  },
});

export const beach = new Biome({
  beach_sand: {
    size: 10,
    cell: { grounds: [<Sand amount={1} />] },
    connections: { meadow_air: 1, meadow_green: 1 }
  },
});

export const meadow = new Biome({
  meadow_air: {
    size: 500,
    cell: {},
    connections: { meadow_green: 10 }
  },
  meadow_green: {
    size: 100,
    cell: { sprite: <Flower /> }
  },
});

export const world = new World([frozen, island, ocean, beach, meadow]);
*/