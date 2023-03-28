import { Bush, Cell, Flower, Rock, Sand, Seed, Tree, Triangle, Water } from './entities';
import { generateFog } from './fog';
import { TerminalState } from './utils';

export const lightChar = '░';
export const mediumChar = '▒';
export const darkChar = '▓';
export const fullChar = '█';

export const upChar = '▀';
export const rightChar = '▐';
export const downChar = '▄';
export const leftChar = '▌';

export const flowerChar = ',';
export const bushChar = 'τ';
export const treeChar = '#';

export const seedChar = '°';

export const playerChar = '\u010b';
export const upTriangleChar = '\u011d';
export const downTriangleChar = '\u011e';
export const armorChar = '¬';

export const health8Char = '\u0120';
export const health7Char = '\u0121';
export const health6Char = '\u0122';
export const health5Char = '\u0123';
export const health4Char = '\u0124';
export const health3Char = '\u0125';
export const health2Char = '\u0126';
export const health1Char = '\u0127';

export const maps: Record<string, Cell[][]> = {
  basic: [
    [
      {},
      { terrain: <Rock orientation='right' /> },
      { terrain: <Rock /> },
    ],
    [
      { sprite: <Flower />},
      { sprite: <Bush />, item: <Seed amount={3} /> },
      { sprite: <Tree />},
    ],
    [
      { grounds: [<Sand amount={4} />] },
      { grounds: [<Sand amount={2} />, <Water amount={4} />] },
      { grounds: [<Water amount={4} />] },
    ],
  ]
};

export const generateMap = (name: keyof typeof maps, initialState?: Partial<TerminalState>) => jest.fn<TerminalState, [TerminalState]>((state: TerminalState) => {
  const map = maps[name];
  const width = map[0].length;
  const height = map.length;
  const newState: TerminalState = {
    ...state,
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    ...initialState,
  };

  return {
    ...newState,
    fog: generateFog(newState, 'visible'),
    board: map,
  };
});

export const getLocation = (element: HTMLElement) => {
  const cell = element.closest('[data-testid]') as HTMLElement;
  return cell.dataset.testid!.split(',').map(offset => parseInt(offset, 10));
}