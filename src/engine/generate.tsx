import { ReactComponentElement } from 'react';
import { MapCell } from 'worldmap-generator';
import { creatureSpawns, creatureStats, getRandomDistribution } from './balancing';
import { World, world } from './biomes';

import { Player, Cell, SingleCategories, MultipleCategories, Entity, Rock, Flower, Tree, Bush, grounds, containers, Spell, Armor, Terrain, Sand, Water } from "./entities";
import { generateFog } from './fog';
import { createMatrix, generateWhiteNoise, valueNoise } from './noise';
import { corners, createCreature, createEquipment, createParticle, getDeterministicRandomInt, orientations, sum, TerminalState, updateCell, wrapCoordinates } from "./utils";
import { rural } from './worlds';

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

const valueNoiseMatrix = (
  width: number,
  height: number,
  iterations: number,
  noiseMatrix = generateWhiteNoise(width, height, -1, 1), // window.Rune.deterministicRandom
) => {
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
};

const whiteNoiseWithFlatCorners = (width: number, height: number, cornersX: number, cornersY: number) => {
  const noiseMatrix = generateWhiteNoise(width, height, -1, 1);
  Array.from({ length: cornersX }).forEach((_, x) => {
    Array.from({ length: cornersY }).forEach((_, y) => {
      noiseMatrix[y][x] = 0;
      noiseMatrix[y][width - x - 1] = 0;
      noiseMatrix[height - y - 1][x] = 0;
      noiseMatrix[height - y - 1][width - x - 1] = 0;
    });
  });
  return noiseMatrix;
}

function generateLevel(state: TerminalState): TerminalState {
  const width = state.width * 2;
  const height = state.height * 2;

  const terrainMatrix = valueNoiseMatrix(width, height, 20, whiteNoiseWithFlatCorners(width, height, 25, 14));
  const greenMatrix = valueNoiseMatrix(width, height, 1, whiteNoiseWithFlatCorners(width, height, 21, 12));
  const itemMatrix = valueNoiseMatrix(width / 2, height / 2, 0, whiteNoiseWithFlatCorners(width / 2, height / 2, 16, 9));
  const elevationMatrix = valueNoiseMatrix(width / 8, height / 8, 20, whiteNoiseWithFlatCorners(width / 8, height / 8, 21, 12));
  const temperatureMatrix = valueNoiseMatrix(width / 8, height / 8, 20);

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

      // Sprite: collapse into bushes or tress
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
      if (CellItem && itemNoise > 48) {
        cell.item = <CellItem amount={Math.floor(itemNoise - 46.5 )} />;
        
        if (cell.terrain?.type === Tree) {
          cell.terrain = undefined;
        }
      }

      if (!cell.terrain && !cell.grounds && !cell.sprite) {
        const [creature, props] = getRandomDistribution(creatureSpawns);
        const spawnedStats = creatureStats.get(creature!);
        if (itemNoise < -48 && creature && spawnedStats) {
          state = createCreature(
            state,
            { x: columnIndex, y: rowIndex },
            creature,
            { amount: spawnedStats.hp, maximum: spawnedStats.hp, ...props },
          )[0];
        }
      }

      return cell;
    });
    return row;
  });

  // insert player at initial coords
  const hp = creatureStats.get(Player)?.hp || 1;
  const [newState, player] = createCreature(
    state,
    { x: state.cameraX, y: state.cameraY },
    Player,
    { orientation: 'up', amount: hp, maximum: hp, equipments: [], particles: [] }
  );
  state = newState;

  // populate state
  const fog = generateFog(state);
  state = { ...state, board: rows, fog, playerId: player.id };

  // insert spawn room
  const layout = rural.rooms.spawn.layout;
  Array.from({ length: layout.length }).forEach((_, rowIndex) => {
    Array.from({ length: layout[0].length }).forEach((_, columnIndex) => {
      const [x, y] = wrapCoordinates(state, player.x - (layout[0].length - 1) / 2 + columnIndex, player.y - (layout.length - 1) / 2 + rowIndex);
      const cellLayout = layout[rowIndex][columnIndex];
      if (!cellLayout) return;

      const { equipment, creature, ...cell } = cellLayout;
      state = updateCell(state, x, y, { terrain: undefined, sprite: undefined, grounds: [], ...cell });

      if (equipment) {
        const [equipmentEntity, { particle, ...props }] = equipment;
        let newEquipment;
        [state, newEquipment] = createEquipment(state, { x, y }, equipmentEntity, { ...props, particles: [] });
        if (particle) {
          state = createParticle(state, { x: 0, y: 0, parent: { container: 'equipments', id: newEquipment.id } }, particle[0], particle[1])[0];
        }
      }

      if (creature) {
        state = createCreature(state, { x, y }, creature[0], creature[1])[0];
      }
    });
  });

  state = createEquipment(state, { x: 0, y: -6 }, Armor, { amount: 0, maximum: 0, level: 1, material: 'wood', particles: [] })[0];

  state = createEquipment(state, { x: 1, y: -6 }, Spell, { amount: 0, maximum: 0, level: 1, material: 'ice', particles: [] })[0];
  state = createEquipment(state, { x: 2, y: -6 }, Spell, { amount: 0, maximum: 0, level: 1, material: 'fire', particles: [] })[0];
  state = createEquipment(state, { x: 3, y: -6 }, Spell, { amount: 0, maximum: 0, level: 1, material: 'plant', particles: [] })[0];

  state = createEquipment(state, { x: -1, y: -6 }, Spell, { amount: 0, maximum: 0, level: 2, material: 'ice', particles: [] })[0];
  state = createEquipment(state, { x: -2, y: -6 }, Spell, { amount: 0, maximum: 0, level: 2, material: 'fire', particles: [] })[0];
  state = createEquipment(state, { x: -3, y: -6 }, Spell, { amount: 0, maximum: 0, level: 2, material: 'plant', particles: [] })[0];


  return state;
}

export { generateLevel };
