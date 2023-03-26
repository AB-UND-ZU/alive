import { ReactComponentElement } from 'react';
import WorldmapGenerator, { MapCell } from 'worldmap-generator';
import { World, world } from './biomes';

import { Player, Cell, SingleCategories, MultipleCategories, Entity, Rock, Flower, Tree, Bush, grounds, Campfire, containers, Triangle, Creature, Spell, Sword, Armor } from "./entities";
import { generateFog } from './fog';
import { createMatrix, generateWhiteNoise, valueNoise } from './noise';
import { Fog, getDeterministicRandomInt, Orientation, orientations, Point, Processor, sum, TerminalState } from "./utils";

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

const getSingleElements = (world: World, cells: MapCell[], category: SingleCategories) => cells.map(cell => world.tileCells[cell.name][category]);
const getMultipleElements = (world: World, cells: MapCell[], category: MultipleCategories) => cells.reduce<ReactComponentElement<Entity>[]>((cellTypes, cell) => [
  ...cellTypes,
  ...(world.tileCells[cell.name][category] || [])
], []);


const getCellEntities = (elements: (ReactComponentElement<Entity> | undefined)[], target: Entity) => {
  return elements.filter(element => element?.type === target);
}

// get count and approximate orientation for a specific entity in a 2x2 block of map cells
const getBlockLayout = (elements: (ReactComponentElement<Entity> | undefined)[], target: Entity) => {
  const targetedIndizes = elements.map(element => element?.type === target ? 1 : 0);
  const length = sum(targetedIndizes);
  const first = targetedIndizes.indexOf(1);
  const last = targetedIndizes.lastIndexOf(1);
  let orientation: Orientation | undefined;

  if (length === 1) {
    orientation = orientations[first];
  } else if (length === 2) {
    const distance = last - first;
    const offset = distance === 2 ? getDeterministicRandomInt(0, 1) * 2 : distance - 1;
    orientation = orientations[(first - offset + orientations.length) % orientations.length];
  }

  return { length, orientation };
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

  const worldMap = createMatrix(width, height, (x, y) => {
    const terrainNoise = terrainMatrix[y][x];
    const greenNoise = greenMatrix[y][x];
    const elevationNoise = elevationMatrix[Math.floor(y / 8)][Math.floor(x / 8)];
    const temperatureNoise = temperatureMatrix[Math.floor(y / 8)][Math.floor(x / 8)];

    const height = terrainNoise + elevationNoise * 2;
    let name = 'water';
    if (height >= 10) {
      name = temperatureNoise * 2 + height >= 40 ? 'green' :  'rock';
    } else if (height >= -30) {
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
  
  const creatures: Processor<Creature>[] = [];
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
        cell.terrain = <Rock orientation={rockLayout.orientation} />;
      }

      // Sprite: collapse into bushes or tress, or override campfire
      const spriteElements = getSingleElements(world, mapCells, 'sprite');
      if (!cell.terrain && !cell.grounds?.length) {
        const plantLayout = getCellEntities(spriteElements, Flower);
        if (plantLayout.length > 2) {
          cell.terrain = <Tree orientation={orientations[getDeterministicRandomInt(0, 7)]} />;
        } else if (plantLayout.length > 0) {
          cell.sprite = plantLayout.length === 2 ? <Bush /> : <Flower />;
        }
      }

      // Item: add container item if overlapping with noise
      const itemNoise = itemMatrix[rowIndex][columnIndex];
      const CellItem = containers.get(cell.sprite?.type || cell.terrain?.type);
      if (CellItem && itemNoise > 48 && !cell.terrain?.props.orientation) {
        cell.item = <CellItem amount={Math.floor(itemNoise - 46.5 )} />;
        
        if (cell.terrain?.type === Tree) {
          cell.terrain = undefined;
        }
      }

      if (!cell.terrain && !cell.grounds && !cell.sprite) {
        if (itemNoise < -48) {
          creatures.push({
            entity: <Triangle orientation='up' amount={3} maximum={3} />,
            x: columnIndex,
            y: rowIndex,
          });
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
  creatures.push({
    entity: <Player orientation='up' amount={10} maximum={10} />,
    x: state.x,
    y: state.y,
  });

  const equipments = [{
    x: 1,
    y: 1,
    entity: <Sword amount={2} material="iron" />,
  }, {
    x: 2,
    y: 2,
    entity: <Armor amount={1} material="wood" />,
  }, {
    x: 3,
    y: 3,
    entity: <Spell amount={3} material="ice" />,
  }];

  const fog = generateFog(state);

  return { ...state, board: rows, fog, creatures, equipments };
}


export { generateLevel };