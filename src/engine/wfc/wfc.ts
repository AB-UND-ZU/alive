import { Matrix, matrixFactory } from "../../game/math/matrix";
import { invertOrientation } from "../../game/math/path";
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

export type Tag = {
  constraints?: Constraints;
};

export type Tile = {
  tags: string[];
  weight?: number;
  constraints?: Constraints;
};

export type Definition = {
  tags: Record<string, Tag>;
  tiles: Record<string, Tile>;
};

export class Wave {
  NOISE_FACTOR = 1000;

  width: number;
  height: number;
  options: Matrix<Record<string, number> | undefined>;
  chosen: Matrix<number>;
  remaining: number;

  constructor(width: number, height: number, weights: number[]) {
    this.width = width;
    this.height = height;
    this.remaining = width * height;
    this.chosen = Array.from({ length: width }).map(() => new Array(height));
    this.options = matrixFactory(this.width, this.height, () =>
      Object.fromEntries(weights.map((weight, index) => [index, weight]))
    );
  }

  reset(weights: number[]) {
    // initialize all possible weighted states
    this.remaining = this.width * this.height;
    this.chosen = Array.from({ length: this.width }).map(
      () => new Array(this.height)
    );
    this.options = matrixFactory(this.width, this.height, () =>
      Object.fromEntries(weights.map((weight, index) => [index, weight]))
    );
  }

  getOptions(x: number, y: number) {
    return this.options[x][y];
  }

  getChosen(x: number, y: number) {
    return this.chosen[x][y];
  }

  getStates(x: number, y: number) {
    const options = this.getOptions(x, y);

    if (options) return options;

    return { [this.getChosen(x, y)]: Infinity };
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
    if (y in this.chosen[x])
      throw new Error(`Attempting to re-collapse cell X:${x} Y:${y}!`);

    const options = this.getOptions(x, y);

    if (!options) throw new Error(`Missing options for cell X:${x} Y:${y}!`);

    this.remaining -= 1;

    let choice = force;

    // calculate choice of tile index from weighted distribution
    if (choice === undefined) {
      const indizes = Object.keys(options);
      choice = parseInt(indizes[distribution(...Object.values(options))], 10);
    }

    this.chosen[x][y] = choice;
    this.options[x][y] = undefined;

    if (DEBUG_WFC)
      console.log(Date.now(), "collapse", x, y, choice, Object.keys(options));
  }

  ban(x: number, y: number, tileIndex: number) {
    const options = this.getOptions(x, y);

    if (!options || !(tileIndex in options))
      throw new Error(
        `Attempting to ban non-existing state on ${x}:${y} - ${tileIndex}`
      );

    delete options[tileIndex];

    if (DEBUG_WFC)
      console.log(
        Date.now(),
        `ban ${x} ${y} ${tileIndex}`,
        Object.keys(options)
      );

    if (Object.keys(options).length === 0)
      throw new Error(
        `No valid options after banning ${tileIndex} at ${x}:${y}`
      );
  }

  getLowestEntropyCell() {
    let lowestEntropy: number = Infinity;
    let lowestEntropyCell: Position | undefined = undefined;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        // skip for defined states
        const options = this.getOptions(x, y);
        if (!options) continue;

        const weights = Object.values(options);

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
      if (weight <= 0) continue;

      weightSum += weight;
      logWeightSum += weight * Math.log(weight);
    }

    return Math.log(weightSum) - logWeightSum / weightSum;
  }

  isCompleted() {
    return this.remaining === 0;
  }

  contains(x: number, y: number) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}

type MappedConstraint<K extends keyof Constraints> = {
  constraint: Partial<NonNullable<Constraints[K]>>;
} & (
  | {
      tag: string;
      tileIndex?: never;
    }
  | {
      tag?: never;
      tileIndex: number;
    }
);

type MappedConstraints = Required<{
  [K in keyof Constraints]: MappedConstraint<K>[];
}>;

export class WaveFunctionCollapse {
  DEFAULT_WEIGHT = 1;
  MAX_ATTEMPTS = 5;

  definition: Definition;
  weights: number[] = [];
  tileConstraints: Record<string, MappedConstraints> = {};
  tileNames: string[] = [];
  tileIndizes: Record<string, number> = {};
  tileTagsIndizes: Record<string, number[]> = {};

  constructor(definition: Definition) {
    this.definition = definition;

    // precompute tile names, weights and tags
    let index = 0;
    for (const name in definition.tiles) {
      const tile = definition.tiles[name];
      this.weights.push(tile.weight ?? this.DEFAULT_WEIGHT);
      this.tileNames.push(name);
      this.tileIndizes[name] = index;

      // populate available constraints per tile and type
      this.tileConstraints[name] = { neighbour: [] };
      const tileConstraints = this.tileConstraints[name];

      if (tile.constraints?.neighbour)
        tileConstraints.neighbour.push({
          constraint: tile.constraints.neighbour,
          tileIndex: index,
        });

      for (const tag of tile.tags) {
        if (!(tag in this.tileTagsIndizes)) this.tileTagsIndizes[tag] = [];

        this.tileTagsIndizes[tag].push(index);
        const tagConstraints = this.definition.tags[tag]?.constraints;

        if (tagConstraints?.neighbour)
          tileConstraints.neighbour.push({
            constraint: tagConstraints.neighbour,
            tag,
          });
      }

      index += 1;
    }
  }

  getTilesFromOptions(options?: Record<string, number>) {
    if (!options) return [];

    return Object.keys(options)
      .map((index) => parseInt(index, 10))
      .map(
        (tileIndex) => [this.getTileFromIndex(tileIndex), tileIndex] as const
      );
  }

  getTileFromIndex(tileIndex: number) {
    return this.definition.tiles[this.tileNames[tileIndex]];
  }

  getTileConstraints(tileIndex: number) {
    return this.tileConstraints[this.tileNames[tileIndex]];
  }

  tileIntersectsTags(tile: Tile, tags: string[]) {
    return tags.some((tag) => tile.tags.includes(tag));
  }

  propagate(wave: Wave, x: number, y: number) {
    const stack = [{ x, y }];

    while (stack.length > 0) {
      const cell = stack.pop()!;

      // ban options that would be cut off by boundaries
      const adjacentCells = wave.getAdjacentCells(cell.x, cell.y);
      let options = wave.getOptions(cell.x, cell.y);

      if (DEBUG_WFC) console.log(Date.now(), "stack", cell.x, cell.y, options);

      // restrict current tiles with own constraints
      for (const tileNumber in options) {
        const tileIndex = parseInt(tileNumber, 10);

        // if neighbour constraints are present, tile must not be on edge boundaries
        const neighbourConstraints =
          this.getTileConstraints(tileIndex).neighbour;

        let banned = false;

        for (const neighbourConstraint of neighbourConstraints) {
          for (const direction in neighbourConstraint.constraint) {
            if (!(direction in adjacentCells)) {
              wave.ban(cell.x, cell.y, tileIndex);
              banned = true;
              break;
            }
          }
        }

        if (banned) continue;
      }

      const states = wave.getStates(cell.x, cell.y);

      // restrict adjacent cells with own constraints forwards and backwards
      for (const [adjacentOrientation, adjacentCell] of Object.entries(
        adjacentCells
      )) {
        // skip if already chosen
        const adjacentOptions = wave.getOptions(adjacentCell.x, adjacentCell.y);
        if (!adjacentOptions) continue;

        const adjacentDirection = adjacentOrientation as Orientation;
        const oppositeDirection = invertOrientation(adjacentDirection);
        let modified = false;

        // check each remaining option if it's still valid forwards and backwards
        for (const adjacentNumber in adjacentOptions) {
          const adjacentIndex = parseInt(adjacentNumber, 10);
          const adjacentTile = this.getTileFromIndex(adjacentIndex);
          const tileIndizes = states
            ? Object.keys(states).map((tileNumber) => parseInt(tileNumber, 10))
            : [];

          // check if any of the current cell's states is compatible
          let possibleNeighbour = false;
          for (const tileIndex of tileIndizes) {
            const tile = this.getTileFromIndex(tileIndex);
            const neighbourConstraints =
              this.getTileConstraints(tileIndex).neighbour;

            // only allow tiles that match all constraints
            let possibleForwards = true;
            for (const neighbourConstraint of neighbourConstraints) {
              // check if current cell can have adjacent cell as neighbour
              const neighbourTags =
                neighbourConstraint.constraint[adjacentDirection];

              if (
                neighbourTags &&
                !this.tileIntersectsTags(adjacentTile, neighbourTags)
              ) {
                possibleForwards = false;
                break;
              }
            }

            if (!possibleForwards) continue;

            const adjacentConstraints =
              this.getTileConstraints(adjacentIndex).neighbour;

            // check if adjacent cell can have current cell as neighbour
            let possibleBackwards = true;
            for (const adjacentConstraint of adjacentConstraints) {
              const selfTags = adjacentConstraint.constraint[oppositeDirection];

              if (selfTags && !this.tileIntersectsTags(tile, selfTags)) {
                possibleBackwards = false;
                break;
              }
            }

            if (!possibleBackwards) {
              continue;
            }

            possibleNeighbour = true;
            break;
          }

          if (!possibleNeighbour) {
            wave.ban(adjacentCell.x, adjacentCell.y, adjacentIndex);
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
    forced: [number, number, string][] = []
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
        for (const [x, y, tile] of forced) {
          const choice = this.tileIndizes[tile];

          wave.collapse(x, y, choice);
          this.propagate(wave, x, y);
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

      return wave;
    }

    return;
  }
}
