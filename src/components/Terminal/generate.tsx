import { ReactComponentElement } from 'react';
import WorldmapGenerator, { MapCell } from 'worldmap-generator';
import { World, world } from './biomes';

import { Player, Armor, Sword, Cell, SingleCategories, MultipleCategories, Entity, Rock, directions, Direction, Flower, Tree, Bush, DeepWater, grounds, items, Campfire, Equipment, Particle, ShallowWater, containers } from "./entities";
import { createMatrix, generateWhiteNoise, valueNoise } from './noise';
import { Fog, sum, TerminalState } from "./utils";

// patch infite borders
const getCell = WorldmapGenerator.prototype.getCell;
WorldmapGenerator.prototype.getCell = function(x, y) {
  const fencedX = (x + this.size.width) % this.size.width;
  const fencedY = (y + this.size.height) % this.size.height;
  return getCell.call(this, fencedX, fencedY);
}

const resolveMapCell = WorldmapGenerator.prototype.resolveMapCell;
WorldmapGenerator.prototype.resolveMapCell = function(x, y, name) {
  const fencedX = (x + this.size.width) % this.size.width;
  const fencedY = (y + this.size.height) % this.size.height;
  return resolveMapCell.call(this, fencedX, fencedY, name);
}

const getDeterministicRandomInt = (minimum: number, maximum: number) => {
  return Math.floor(
    window.Rune.deterministicRandom() * (maximum - minimum + 1) + minimum
  );
};

const getSingleElements = (world: World, cells: MapCell[], category: SingleCategories) => cells.map(cell => world.tileCells[cell.name][category]);
const getMultipleElements = (world: World, cells: MapCell[], category: MultipleCategories) => cells.reduce<ReactComponentElement<Entity>[]>((cellTypes, cell) => [
  ...cellTypes,
  ...(world.tileCells[cell.name][category] || [])
], []);


const getCellEntities = (elements: (ReactComponentElement<Entity> | undefined)[], target: Entity) => {
  return elements.filter(element => element?.type === target);
}

// get count and approximate direction for a specific entity in a 2x2 block of map cells
const getBlockLayout = (elements: (ReactComponentElement<Entity> | undefined)[], target: Entity) => {
  const targetedIndizes = elements.map(element => element?.type === target ? 1 : 0);
  const length = sum(targetedIndizes);
  const first = targetedIndizes.indexOf(1);
  const last = targetedIndizes.lastIndexOf(1);
  let direction: Direction | undefined;

  if (length === 1) {
    direction = directions[first];
  } else if (length === 2) {
    const distance = last - first;
    const offset = distance === 2 ? getDeterministicRandomInt(0, 1) * 2 : distance - 1;
    direction = directions[(first - offset + directions.length) % directions.length];
  }

  return { length, direction };
}

const noiseMatrix = (
  width: number,
  height: number,
  iterations: number
) => {
  const noiseMatrix = generateWhiteNoise(width, height, -1, 1); // window.Rune.deterministicRandom
  const valueMatrix = valueNoise(noiseMatrix, iterations);

  return createMatrix(width, height, (x, y) => valueMatrix[y][x] * Math.sqrt(iterations || 0.25) * 100);
};

function generateLevel(state: TerminalState): TerminalState {
  const width = state.width * 2;
  const height = state.height * 2;

  const terrainMatrix = noiseMatrix(width, height, 20);
  const greenMatrix = noiseMatrix(width, height, 1);
  const itemMatrix = noiseMatrix(width / 2, height / 2, 0);
  const elevationMatrix = noiseMatrix(width / 8, height / 8, 20);
  const temperatureMatrix = noiseMatrix(width / 8, height / 8, 20);

  console.log({itemMatrix});
  const worldMap = createMatrix(width, height, (x, y) => {
    const terrainNoise = terrainMatrix[y][x];
    const greenNoise = greenMatrix[y][x];
    const elevationNoise = elevationMatrix[Math.floor(y / 8)][Math.floor(x / 8)];
    const temperatureNoise = temperatureMatrix[Math.floor(y / 8)][Math.floor(x / 8)];

    const height = terrainNoise + elevationNoise * 2;
    let name = 'water';
    if (height >= 10) {
      name = 'rock';
    } else if (height >= -30) {
      name = 'air';
    } else if (height >= -40) {
      name = 'sand';
    }
    if (name === 'air' && greenNoise >= 20) name = 'green';

    return {
      name,
      frequencies: {},
      resolved: true,
    };
  });


  /*
  const mapGenerator = new WorldmapGenerator({
    size: {
      width: state.width * 2,
      height: state.height * 2,
    },
    tileTypes: world.tileTypes,
  });

  mapGenerator.generate();
  */
  
  const rows = Array.from({ length: state.height }).map((_, rowIndex) => {
    const row = Array.from({ length: state.width }).map((_, columnIndex) => {
      const mapCells = [
        worldMap[rowIndex * 2][columnIndex * 2],
        worldMap[rowIndex * 2][columnIndex * 2 + 1],
        worldMap[rowIndex * 2 + 1][columnIndex * 2],
        worldMap[rowIndex * 2 + 1][columnIndex * 2 + 1],
      ];
      
      // resolve four cells into highest matching entity
      const cell: Cell = {};

      // Ground: highest count wins
      const groundElements = getMultipleElements(world, mapCells, 'grounds');
      const groundAmounts = grounds.map(ground => {
        const cellEntities = getCellEntities(groundElements, ground);
        return {
          ground,
          amount: sum(cellEntities.map(entity => entity?.props && 'amount' in entity.props && entity.props.amount as number || 0)),
        };
      }, {});
      const sortedGrounds = [...groundAmounts].sort((left, right) => right.amount - left.amount);
      if (sortedGrounds[0].amount > 0) {
        const FrontElement = sortedGrounds[0].ground;
        cell.grounds = [<FrontElement amount={sortedGrounds[0].amount} />];

        if (sortedGrounds[1].amount > 0) {
          const BackElement = sortedGrounds[1].ground;
          const complementaryAmount = sortedGrounds[0].amount === 1 ? 0 : 4;
          cell.grounds.unshift(<BackElement amount={complementaryAmount} />);
        }
      }

      // Terrain: use angled rocks and move deep water to ground
      const terrainElements = getSingleElements(world, mapCells, 'terrain');

      const rockLayout = getBlockLayout(terrainElements, Rock);
      if (rockLayout.length > 0) {
        cell.terrain = <Rock direction={rockLayout.direction} />;
      }

      const deepWaterLayout = getCellEntities(terrainElements, DeepWater);
      if (deepWaterLayout.length > 0) {
        if (cell.grounds?.length) cell.grounds = undefined;
        cell.terrain = <DeepWater />;
      }

      // Sprite: collapse into bushes or tress, or override campfire
      const spriteElements = getSingleElements(world, mapCells, 'sprite');
      if (!cell.terrain && !cell.grounds?.length) {
        const plantLayout = getCellEntities(spriteElements, Flower);
        if (plantLayout.length > 2) {
          cell.terrain = <Tree />;
        } else if (plantLayout.length > 0) {
          cell.sprite = plantLayout.length === 2 ? <Bush /> : <Flower />;
        }
      }

      // Item: add container item if overlapping with noise
      const itemNoise = itemMatrix[rowIndex][columnIndex];
      const CellItem = containers.get(cell.sprite?.type || cell.terrain?.type);
      if (CellItem && itemNoise > 48 && !cell.terrain?.props.direction) {
        cell.item = <CellItem amount={Math.floor(itemNoise - 46.5 )} />;
        
        if (cell.terrain?.type === Tree) {
          cell.terrain = undefined;
        }
      }

      const campfireLayout = getCellEntities(spriteElements, Campfire);
      if (campfireLayout.length > 0) {
        cell.terrain = undefined;
        cell.sprite = <Campfire />;
      }

      // Equipment: stack from all cells
      const equipmentElements = getMultipleElements(world, mapCells, 'equipments');
      cell.equipments = equipmentElements as ReactComponentElement<Equipment>[];

      // Particle: stack from all cells
      const particleElements = getMultipleElements(world, mapCells, 'particles');
      cell.particles = particleElements as ReactComponentElement<Particle>[];

      return cell;
    });
    return row;
  });

  // insert player at initial coords
  rows[state.y][state.x].creature = <Player direction="up" />;
  rows[state.y][state.x].equipments = [<Armor material="wood" />, <Sword material="iron" />];

  // generate initial darkness
  const fog: Fog[][] = Array.from({ length: state.height }).map(
    () => Array.from<Fog>({ length: state.width }).fill('dark')
  );
  return { ...state, board: rows, fog };
}


export { generateLevel };