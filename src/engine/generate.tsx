import { ReactComponentElement } from 'react';
import { MapCell } from 'worldmap-generator';
import { World, world } from './biomes';

import { Player, Cell, SingleCategories, MultipleCategories, Entity, Rock, Flower, Tree, Bush, grounds, Campfire, containers, Triangle, Spell, Sword, Armor, Terrain, Sand, Water, Circle } from "./entities";
import { generateFog } from './fog';
import { createMatrix, generateWhiteNoise, valueNoise } from './noise';
import { corners, createCreature, createEquipment, getDeterministicRandomInt, orientations, sum, TerminalState } from "./utils";

const getSingleElements = (world: World, cells: MapCell[], category: SingleCategories) => cells.map(cell => world.tileCells[cell.name][category]);
const getMultipleElements = (world: World, cells: MapCell[], category: MultipleCategories) => cells.reduce<ReactComponentElement<Entity>[]>((cellTypes, cell) => [
  ...cellTypes,
  ...(world.tileCells[cell.name][category] || [])
], []);


const getCellEntities = (elements: (ReactComponentElement<Entity> | undefined)[], target: Entity) => {
  return elements.filter(element => element?.type === target);
}

// get count and approximate orientation for a specific entity in a 2x2 block of map cells
const getBlockLayout = (elements: (ReactComponentElement<Entity> | undefined)[], target: Terrain) => {
  const TargetElement = target;
  return elements.map(
    (element, elementIndex) => element?.type === target ? <TargetElement direction={corners[elementIndex]} /> : undefined
  ).filter(Boolean) as ReactComponentElement<Terrain>[];
};

const noiseMatrix = (
  width: number,
  height: number,
  iterations: number
) => {
  const noiseMatrix = generateWhiteNoise(width, height, -1, 1); // window.Rune.deterministicRandom
  const valueMatrix = valueNoise(noiseMatrix, iterations);

  return createMatrix(width, height, (x, y) => valueMatrix[y][x] * Math.sqrt(iterations || 0.25) * 100);
};

const getInterpolatedValue = (matrix: number[][], ratio: number, x: number, y: number) => {
  const baseX = x - x % ratio;
  const baseY = y - y % ratio;

  const wrappedX = (x + ratio) % (matrix[0].length * ratio);
  const wrappedY = (y + ratio) % (matrix.length * ratio);

  const values = [
    matrix[Math.floor(baseY / ratio)][Math.floor(baseX / ratio)],
    matrix[Math.floor(baseY / ratio)][Math.floor(wrappedX / ratio)],
    matrix[Math.floor(wrappedY / ratio)][Math.floor(baseX / ratio)],
    matrix[Math.floor(wrappedY / ratio)][Math.floor(wrappedX / ratio)],
  ];

  return sum(values.map((value, index) => {
    const factorX = index % 2 === 0 ? (ratio - x % ratio) : x % ratio;
    const factorY = index < 2 ? (ratio - y % ratio) : y % ratio;
    return value * factorX * factorY / ratio ** 2;
  }));
}

function generateLevel(state: TerminalState): TerminalState {
  const width = state.width * 2;
  const height = state.height * 2;

  const terrainMatrix = noiseMatrix(width, height, 20);
  const greenMatrix = noiseMatrix(width, height, 1);
  const itemMatrix = noiseMatrix(width / 2, height / 2, 0);
  const elevationMatrix = noiseMatrix(width / 8, height / 8, 20);
  const temperatureMatrix = noiseMatrix(width / 8, height / 8, 20);

  const worldMap = createMatrix(width, height, (x, y) => {
    const terrainNoise = terrainMatrix[y][x];
    const greenNoise = greenMatrix[y][x];
    const elevationNoise = getInterpolatedValue(elevationMatrix, 8, x, y);
    const temperatureNoise = getInterpolatedValue(temperatureMatrix, 8, x, y);

    const height = terrainNoise + elevationNoise * 3.5;
    let name = 'water';
    if (height >= 10) {
      name = temperatureNoise * 3 + height >= 40 ? 'green' :  'rock';
    } else if (height >= -35) {
      name = 'air';
    } else if (height >= -40) {
      name = 'sand';
    }
    //if (temperatureNoise <= 30 && height + temperatureNoise <= -45) name = 'ice';
    if (name === 'air' && greenNoise >= 20) name = 'green';

    return {
      name,
      frequencies: {},
      resolved: true,
    };
  });

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
          amount: sum(cellEntities.map(entity => (entity?.props && 'amount' in entity.props && entity.props.amount as number) || 0)),
        };
      }, {});
      const sand = groundAmounts.find(({ ground }) => ground === Sand);
      const water = groundAmounts.find(({ ground }) => ground === Water);
      if (sand && sand.amount > 0) {
        cell.grounds = [<Sand amount={1} />];
      }
      if (water && water.amount > 0) {
        const newWaterAmount = sand ? 4 : water.amount - water.amount % 2;
        if (newWaterAmount > 0) {
          cell.grounds = [<Water amount={newWaterAmount} />, ...(cell.grounds || [])];
        }
      }

      // Terrain: use quarter sized rocks
      const terrainElements = getSingleElements(world, mapCells, 'terrain');

      const rocks = getBlockLayout(terrainElements, Rock);
      if (rocks.length > 0) {
        cell.terrain = <Rock />;
      }

      // Sprite: collapse into bushes or tress, or override campfire
      const spriteElements = getSingleElements(world, mapCells, 'sprite');
      if (!cell.terrain && !cell.grounds?.length) {
        const plantLayout = getCellEntities(spriteElements, Flower);
        if (plantLayout.length > 2) {
          cell.terrain = <Tree direction={orientations[getDeterministicRandomInt(0, 7)]} />;
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

      if (!cell.terrain && !cell.grounds && !cell.sprite) {
        if (itemNoise < -48) {
          const spawns = [Triangle, Circle];
          const Creature = spawns[getDeterministicRandomInt(0, 1)];
          state = createCreature(
            state,
            { x: columnIndex, y: rowIndex },
            Creature,
            { orientation: 'up', amount: 3, maximum: 3, equipments: [], particles: [] }
          )[0];
        }
      }

      const campfireLayout = getCellEntities(spriteElements, Campfire);
      if (campfireLayout.length > 0) {
        cell.terrain = undefined;
        cell.sprite = <Campfire />;
      }

      return cell;
    });
    return row;
  });

  // insert player at initial coords
  
  const [newState, player] = createCreature(
    state,
    { x: state.cameraX, y: state.cameraY },
    Player,
    { orientation: 'up', amount: 10, maximum: 10, equipments: [], particles: [] }
  );
  state = newState;

  state = createEquipment(state, { x: 1, y: 1}, Sword, { amount: 2, material: 'iron', particles: [] })[0];
  state = createEquipment(state, { x: 2, y: 2}, Armor, { amount: 1, material: 'wood', particles: [] })[0];
  state = createEquipment(state, { x: 3, y: 3}, Spell, { amount: 3, material: 'ice', particles: [] })[0];

  const fog = generateFog(state);

  return { ...state, board: rows, fog, playerId: player.id };
}

export { generateLevel };
