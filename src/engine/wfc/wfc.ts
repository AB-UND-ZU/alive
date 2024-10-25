import { Matrix, matrixFactory } from "../../game/math/matrix";
import { add, distribution } from "../../game/math/std";
import {
  Orientation,
  orientationPoints,
  orientations,
} from "../components/orientable";
import { Position } from "../components/position";

const DEBUG_WFC = false;

export type Constraints = {
  neighbour?: {
    up?: string[];
    right?: string[];
    down?: string[];
    left?: string[];
  };
};

export type Tile = {
  tags: string[];
  weight?: number;
  constraints?: Constraints;
};

export type Definition = {
  tiles: Record<string, Tile>;
};

export class Wave {
  NOISE_FACTOR = 1000;

  width: number;
  height: number;
  states: Matrix<Record<string, number> | undefined>;
  chosen: Matrix<number>;
  remaining: number;

  constructor(width: number, height: number, weights: number[]) {
    this.width = width;
    this.height = height;
    this.remaining = width * height;
    this.chosen = Array.from({ length: width }).map(() => new Array(height));
    this.states = matrixFactory(this.width, this.height, () =>
      Object.fromEntries(weights.map((weight, index) => [index, weight]))
    );
  }

  reset(weights: number[]) {
    // initialize all possible weighted states
    this.remaining = this.width * this.height;
    this.chosen = Array.from({ length: this.width }).map(
      () => new Array(this.height)
    );
    this.states = matrixFactory(this.width, this.height, () =>
      Object.fromEntries(weights.map((weight, index) => [index, weight]))
    );
  }

  getState(x: number, y: number) {
    return this.states[x][y];
  }

  getChosen(x: number, y: number) {
    return this.chosen[x][y];
  }

  getOptions(x: number, y: number) {
    const state = this.getState(x, y);

    if (state)
      return Object.keys(state).map((tileIndex) => parseInt(tileIndex, 10));

    return [this.getChosen(x, y)];
  }

  getAdjacentCells(
    x: number,
    y: number,
    directions: Orientation[] = [...orientations]
  ) {
    const cell = { x, y };
    const adjacents: Partial<Record<Orientation, Position>> = {};

    if (directions.includes("up") && y > 0)
      adjacents.up = add(cell, orientationPoints.up);
    if (directions.includes("right") && x < this.width - 1)
      adjacents.right = add(cell, orientationPoints.right);
    if (directions.includes("down") && y < this.height - 1)
      adjacents.down = add(cell, orientationPoints.down);
    if (directions.includes("left") && x > 0)
      adjacents.left = add(cell, orientationPoints.left);

    return adjacents;
  }

  collapse(x: number, y: number, force?: number) {
    if (DEBUG_WFC) console.log(Date.now(), "collapse", x, y, force);

    if (y in this.chosen[x])
      throw new Error(`Attempting to re-collapse cell X:${x} Y:${y}!`);

    const state = this.states[x][y];

    if (!state) throw new Error(`Missing state for cell X:${x} Y:${y}!`);

    this.remaining -= 1;

    let choice = force;

    // calculate choice of tile index from weighted distribution
    if (choice === undefined) {
      const indizes = Object.keys(state);
      choice = parseInt(indizes[distribution(...Object.values(state))], 10);
    }

    this.chosen[x][y] = choice;
    this.states[x][y] = undefined;
  }

  ban(x: number, y: number, tileIndex: number) {
    if (DEBUG_WFC) console.log(Date.now(), "ban", x, y, tileIndex);

    const state = this.getState(x, y);

    if (!state || !(tileIndex in state))
      throw new Error(
        `Attempting to ban non-existing state on ${x}:${y} - ${tileIndex}`
      );

    delete state[tileIndex];
  }

  getLowestEntropyCell() {
    let lowestEntropy: number = Infinity;
    let lowestEntropyCell: Position | undefined = undefined;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        // skip for defined states
        const state = this.getState(x, y);
        if (!state) continue;

        const weights = Object.values(state);

        // add noise for even distribution
        const entropy = this.calculateShannonEntropy(weights);
        const entropyNoise = entropy - Math.random() / this.NOISE_FACTOR;

        if (entropyNoise < lowestEntropy) {
          lowestEntropy = entropyNoise;
          lowestEntropyCell = { x, y };
        }
      }
    }

    if (!lowestEntropyCell)
      throw new Error("Unable to find lowest entropy cell!");

    return lowestEntropyCell;
  }

  calculateShannonEntropy(weights: number[]) {
    let weightSum = 0;
    let logWeightSum = 0;

    for (let weight of weights) {
      weightSum += weight;
      logWeightSum += weight * Math.log(weight);
    }

    return Math.log(weightSum) - logWeightSum / weightSum;
  }

  isCompleted() {
    return this.remaining === 0;
  }
}

export class WaveFunctionCollapse {
  DEFAULT_WEIGHT = 1;
  MAX_ATTEMPTS = 5;

  definition: Definition;
  weights: number[] = [];
  tileNames: string[] = [];
  tileIndizes: Record<string, number> = {};
  tileTags: Record<string, string[]> = {};

  constructor(definition: Definition) {
    this.definition = definition;

    // precompute tile names, weights and tags
    let index = 0;
    for (const name in definition.tiles) {
      const tile = definition.tiles[name];
      this.tileNames.push(name);
      this.tileIndizes[name] = index;
      this.weights.push(tile.weight || this.DEFAULT_WEIGHT);

      for (const tag of tile.tags) {
        if (!(tag in this.tileTags)) this.tileTags[tag] = [];

        this.tileTags[tag].push(name);
      }

      index += 1;
    }
  }

  getTilesFromState(state?: Record<string, number>) {
    if (!state) return [];

    return Object.keys(state)
      .map((index) => parseInt(index, 10))
      .map((tileIndex) => this.getTileFromIndex(tileIndex));
  }

  getTileFromIndex(tileIndex: number) {
    return [
      this.definition.tiles[this.tileNames[tileIndex]],
      tileIndex,
    ] as const;
  }

  tileIntersectsTags(tile: Tile, tags: string[]) {
    return tags.some((tag) => tile.tags.includes(tag));
  }

  propagate(wave: Wave, x: number, y: number) {
    const stack = [{ x, y }];

    while (stack.length > 0) {
      const cell = stack.pop()!;

      // ban options that would be cut off by boundaries
      let options = wave.getOptions(cell.x, cell.y);
      const adjacentCells = wave.getAdjacentCells(cell.x, cell.y);

      if (DEBUG_WFC) console.log(Date.now(), "stack", x, y, options);

      let cutOff = false;
      for (const tileIndex of options) {
        const tile = this.getTileFromIndex(tileIndex)[0];
        const neighbourConstraints = tile.constraints?.neighbour;

        if (!neighbourConstraints) continue;

        for (const direction in neighbourConstraints) {
          if (!(direction in adjacentCells)) {
            wave.ban(cell.x, cell.y, tileIndex);
            cutOff = true;
            break;
          }
        }
      }

      if (cutOff) options = wave.getOptions(cell.x, cell.y);

      if (options.length === 0)
        throw new Error(`No valid options after cutoff at ${cell.x}:${cell.y}`);

      for (const [adjacentOrientation, adjacentCell] of Object.entries(
        adjacentCells
      )) {
        // skip if already chosen
        const adjacentState = wave.getState(adjacentCell.x, adjacentCell.y);
        if (!adjacentState) continue;

        const adjacentDirection = adjacentOrientation as Orientation;
        const oppositeDirection =
          orientations[(orientations.indexOf(adjacentDirection) + 2) % 4];
        const adjacentTiles = this.getTilesFromState(adjacentState);
        let modified = false;

        // restrict neighbour tiles
        for (const [adjacentTile, adjacentIndex] of adjacentTiles) {
          let possibleNeighbour = false;
          for (const tileIndex of options) {
            const tile = this.getTileFromIndex(tileIndex)[0];

            const neighbourTags =
              tile.constraints?.neighbour?.[adjacentDirection];
            const possibleForwards =
              !neighbourTags ||
              this.tileIntersectsTags(adjacentTile, neighbourTags);

            const selfTags =
              adjacentTile.constraints?.neighbour?.[oppositeDirection];
            const possibleBackwards =
              !selfTags || this.tileIntersectsTags(tile, selfTags);

            if (possibleForwards && possibleBackwards) {
              possibleNeighbour = true;
              break;
            }
          }

          if (!possibleNeighbour) {
            wave.ban(adjacentCell.x, adjacentCell.y, adjacentIndex);
            if (Object.keys(adjacentState).length === 0)
              throw new Error(
                `Target became unresolvable ${adjacentCell.x}:${adjacentCell.y}!`
              );
            modified = true;
          }
        }

        // recalculate from target if state has changed
        if (modified) {
          stack.push(adjacentCell);
        }
      }
    }
  }

  iterate(wave: Wave) {
    if (DEBUG_WFC) console.log(Date.now(), "iterate", wave.remaining);
    const cell = wave.getLowestEntropyCell();
    wave.collapse(cell.x, cell.y);
    this.propagate(wave, cell.x, cell.y);
  }

  generate(
    width: number,
    height: number,
    forced?: Record<string, Record<string, string>>
  ) {
    const wave = new Wave(width, height, this.weights);

    let attempts = 0;

    while (attempts < this.MAX_ATTEMPTS) {
      attempts += 1;
      if (DEBUG_WFC)
        console.log(Date.now(), "generate", attempts, "attempt", width, height);

      try {
        // apply constraints before collapsing
        for (let x = 0; x < width; x += 1) {
          for (let y = 0; y < height; y += 1) {
            this.propagate(wave, x, y);
          }
        }

        // apply predefined fields
        for (const column in forced) {
          for (const row in forced[column]) {
            const x = parseInt(column, 10);
            const y = parseInt(row, 10);
            const choice = this.tileIndizes[forced[column][row]];

            wave.collapse(x, y, choice);
            this.propagate(wave, x, y);
          }
        }

        while (!wave.isCompleted()) {
          this.iterate(wave);
        }
      } catch (error) {
        if (DEBUG_WFC)
          console.log(Date.now(), "failed", attempts, "attempt", error);

        wave.reset(this.weights);
        continue;
      }

      break;
    }

    return wave;
  }
}
