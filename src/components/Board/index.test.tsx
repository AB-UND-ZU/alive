import { render, screen } from '@testing-library/react';

import { computeUnits } from '../../engine/units';
import { defaultState } from '../../engine/utils';

import Board from '.';
import { bushChar, flowerChar, fullChar, generateMap, mediumChar, rightChar, seedChar, treeChar, upTriangleChar } from '../../engine/testUtils';
import { Triangle } from '../../engine/entities';


test('renders map of cells', () => {
  const generateLevel = generateMap('basic');
  const state = generateLevel(defaultState);
  const units = computeUnits(state);

  render(<Board state={state} units={units} />);

  const rightRock = screen.getByText(rightChar);
  expect(rightRock).toBeInTheDocument();

  const half = screen.getByText(mediumChar);
  expect(half).toBeInTheDocument();

  const blocks = screen.getAllByText(fullChar);
  expect(blocks).toHaveLength(4);

  const flower = screen.getByText(flowerChar);
  expect(flower).toBeInTheDocument();

  const bush = screen.getByText(bushChar);
  expect(bush).toBeInTheDocument();

  const tree = screen.getByText(treeChar);
  expect(tree).toBeInTheDocument();

  const seed = screen.getByText(seedChar);
  expect(seed).toBeInTheDocument();
});

test('renders map with units', () => {
  const generateLevel = generateMap('basic', { creatures: [{
    x: 0,
    y: 0,
    entity: <Triangle orientation='up' amount={3} maximum={3} id={1} />,
  }]});
  const state = generateLevel(defaultState);
  const units = computeUnits(state);

  render(<Board state={state} units={units} />);

  const triangle = screen.getByText(upTriangleChar);
  expect(triangle).toBeInTheDocument();
});
