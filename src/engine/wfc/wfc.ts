import { Matrix, matrixFactory } from "../../game/math/matrix";
import { add, distribution } from "../../game/math/std";
import {
  Orientation,
  orientationPoints,
  orientations,
} from "../components/orientable";
import { Position } from "../components/position";

const DEBUG_WFC = true;

/*
neighbour constraint

for current tile options
  self:
    if direction given, must not be on edge
    
for adjacent tile options
  forwards:
    check if current cell has compatible option
  backwards:
    check if adjacent cell has compatible option


dimension constraint

for current tile options
  self:
    if any adjacent directions require minimum continuation,
    ban unrelated options


    v
  +=????
  |====|
  +----+
  |    |
  |_#_?|
      ^ 


*/

export type Constraints = {
  neighbour?: {
    up?: string[];
    right?: string[];
    down?: string[];
    left?: string[];
  };
  limit?: {
    vertical?: number;
    horizontal?: number;
    adjacent?: number; // TODO: for groups of tiles
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

  // checks whether any new tiles would exceed the linear count limit
  linearLimitExceeded(
    x: number,
    y: number,
    tileIndizes: number[],
    limit: number,
    directions: Orientation[]
  ) {
    let count = 1;
    let adjacentDefined = false;

    while (directions.length > 0) {
      const direction = directions.pop()!;
      let steps = 1;

      while (count < limit) {
        const delta = orientationPoints[direction];
        const newTile = {
          x: x + delta.x * steps,
          y: y + delta.y * steps,
        };

        if (!this.contains(newTile.x, newTile.y)) break;

        const states = this.getStates(newTile.x, newTile.y);
        const isDefined =
          Object.keys(states).length === 1 &&
          tileIndizes.some((tileIndex) => tileIndex in states);

        if (!isDefined) break;

        adjacentDefined = true;
        steps += 1;
        count += 1;
      }
    }

    // console.log(
    //   `${x}:${y} t${tileIndizes} !!${adjacentDefined} ${count}>${limit}`
    // );

    return adjacentDefined && count > limit;
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
  MAX_ATTEMPTS = 1;

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
      this.weights.push(tile.weight || this.DEFAULT_WEIGHT);
      this.tileNames.push(name);
      this.tileIndizes[name] = index;

      // populate available constraints per tile and type
      this.tileConstraints[name] = { neighbour: [], limit: [] };
      const tileConstraints = this.tileConstraints[name];

      if (tile.constraints?.limit)
        tileConstraints.limit.push({
          constraint: tile.constraints.limit,
          tileIndex: index,
        });
      if (tile.constraints?.neighbour)
        tileConstraints.neighbour.push({
          constraint: tile.constraints.neighbour,
          tileIndex: index,
        });

      for (const tag of tile.tags) {
        if (!(tag in this.tileTagsIndizes)) this.tileTagsIndizes[tag] = [];

        this.tileTagsIndizes[tag].push(index);
        const tagConstraints = this.definition.tags[tag]?.constraints;

        if (tagConstraints?.limit)
          tileConstraints.limit.push({
            constraint: tagConstraints.limit,
            tag,
          });
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

        // if limit constraints are present, ensure the linear count is not exceeded
        const limitConstraints = this.getTileConstraints(tileIndex).limit;

        for (const limitConstraint of limitConstraints) {
          const maxVertical = limitConstraint.constraint.vertical;
          const maxHorizontal = limitConstraint.constraint.horizontal;
          const tileIndizes =
            limitConstraint.tag === undefined
              ? [limitConstraint.tileIndex]
              : this.tileTagsIndizes[limitConstraint.tag];

          if (
            (maxVertical &&
              wave.linearLimitExceeded(
                cell.x,
                cell.y,
                tileIndizes,
                maxVertical,
                ["up", "down"]
              )) ||
            (maxHorizontal &&
              wave.linearLimitExceeded(
                cell.x,
                cell.y,
                tileIndizes,
                maxHorizontal,
                ["left", "right"]
              ))
          ) {
            // console.warn("limited", tileIndizes, cell);

            wave.ban(cell.x, cell.y, tileIndex);
            banned = true;
            break;
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
        const oppositeDirection =
          orientations[(orientations.indexOf(adjacentDirection) + 2) % 4];
        let modified = false;

        // console.log("dir", adjacentDirection, adjacentOptions);

        // check each remaining option if it's still valid forwards and backwards
        for (const adjacentNumber in adjacentOptions) {
          const adjacentIndex = parseInt(adjacentNumber, 10);
          const adjacentTile = this.getTileFromIndex(adjacentIndex);
          const tileIndizes = states
            ? Object.keys(states).map((tileNumber) => parseInt(tileNumber, 10))
            : [];

          // console.log("check", adjacentTile);

          // check if any of the current cell's states is compatible
          let possibleNeighbour = false;
          for (const tileIndex of tileIndizes) {
            const tile = this.getTileFromIndex(tileIndex);
            const neighbourConstraints =
              this.getTileConstraints(tileIndex).neighbour;
            // console.log("forward tile", tile);

            // only allow tiles that match all constraints
            let possibleForwards = true;
            for (const neighbourConstraint of neighbourConstraints) {
              // console.log("neighbour constraint", neighbourConstraint);

              // check if current cell can have adjacent cell as neighbour
              const neighbourTags =
                neighbourConstraint.constraint[adjacentDirection];

              if (
                neighbourTags &&
                !this.tileIntersectsTags(adjacentTile, neighbourTags)
              ) {
                // console.log("!forwards", neighbourTags);
                possibleForwards = false;
                break;
              }
            }

            if (!possibleForwards) continue;

            const adjacentConstraints =
              this.getTileConstraints(adjacentIndex).neighbour;
            // console.log("adjancent constraints", adjacentConstraints);

            // check if adjacent cell can have current cell as neighbour
            let possibleBackwards = true;
            for (const adjacentConstraint of adjacentConstraints) {
              const selfTags = adjacentConstraint.constraint[oppositeDirection];
              // console.log("adjancent constraint", adjacentConstraint, selfTags);
              if (selfTags && !this.tileIntersectsTags(tile, selfTags)) {
                // console.log("!backwards", selfTags);
                possibleBackwards = false;
                break;
              }
            }

            if (!possibleBackwards) {
              continue;
            }

            // console.log("neighbour");
            possibleNeighbour = true;
            break;
          }

          if (!possibleNeighbour) {
            // console.log("!neighbour");
            wave.ban(adjacentCell.x, adjacentCell.y, adjacentIndex);
            modified = true;
          }

          // // restrict minimum dimensions
          // if (tileIndizes.length === 1) {
          //   const tileIndex = tileIndizes[0];
          //   const tile = this.getTileFromIndex(tileIndex);
          //   const dimensionConstraints =
          //     this.getTileConstraints(tileIndex).dimension;

          //   for (const dimensionConstraint of dimensionConstraints) {
          //     // get linear size constraint from currently facing direction
          //     const minSize = {
          //       up: dimensionConstraint.constraint.minHeight,
          //       right: dimensionConstraint.constraint.minWidth,
          //       down: dimensionConstraint.constraint.minHeight,
          //       left: dimensionConstraint.constraint.minWidth,
          //     }[adjacentDirection];

          //     const possibleTiles =
          //       dimensionConstraint.tag === undefined
          //         ? [dimensionConstraint.tileIndex]
          //         : this.tileTagsIndizes[dimensionConstraint.tag];

          //     if (
          //       minSize &&
          //       wave.linearMinimumRequired(
          //         adjacentCell.x,
          //         adjacentCell.y,
          //         possibleTiles,
          //         minSize,
          //         [oppositeDirection]
          //       )
          //     ) {
          //       // console.log("opt", this.tileNames[tileIndex], adjacentOptions);
          //       // ban all unrelated tiles
          //       for (const alternativeNumber in adjacentOptions) {
          //         const alternativeIndex = parseInt(alternativeNumber, 10);
          //         const alternativeTile =
          //           this.getTileFromIndex(alternativeIndex);

          //         if (
          //           !possibleTiles.some((possibleTile) =>
          //             alternativeTile.tags.includes(
          //               this.tileNames[possibleTile]
          //             )
          //           )
          //         ) {
          //           console.log("ban alternative to", possibleTiles);

          //           wave.ban(adjacentCell.x, adjacentCell.y, alternativeIndex);
          //           modified = true;
          //         }
          //       }
          //     }
          //   }
          // }
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
            console.log("force");

            const x = parseInt(column, 10);
            const y = parseInt(row, 10);
            const choice = this.tileIndizes[forced[column][row]];

            wave.collapse(x, y, choice);
            this.propagate(wave, x, y);
          }
        }

        while (!wave.isCompleted()) {
          // this.iterate(wave);
          break;
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
