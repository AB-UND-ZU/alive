import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import FakeTimers from "@sinonjs/fake-timers";

import { Armor, Player, Spell, Sword, Triangle } from '../../engine/entities';
import { armorChar, darkChar, downChar, downTriangleChar, fullChar, generateMap, getLocation, health3Char, health5Char, health8Char, mediumChar, playerChar } from '../../engine/testUtils';

import Terminal from '.';

const user = userEvent.setup({ delay: null });

describe('Terminal', () => {
  let clock: FakeTimers.InstalledClock | void;

  beforeEach(() => {
    clock = FakeTimers.install();
  });

  afterEach(() => {
    clock = clock!.uninstall();
  });

  test('renders map with player', () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }]
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} stats={false} />);

    const player = screen.getByText(playerChar);
    expect(player).toBeInTheDocument();
  });

  test('walk', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }]
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} stats={false} />);

    expect(getLocation(screen.getByText(playerChar))).toEqual([0, 0]);

    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);

    expect(getLocation(screen.getByText(playerChar))).toEqual([1, 2]);
  });

  test('hit a wall', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }]
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} stats={false} />);

    expect(getLocation(screen.getByText(playerChar))).toEqual([0, 0]);

    await user.keyboard('[ArrowRight]');
    clock!.tick(500);
    await user.keyboard('[ArrowUp]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);

    expect(getLocation(screen.getByText(playerChar))).toEqual([1, 2]);
  });

  test('loop through map', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }]
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} stats={false} />);

    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    expect(getLocation(screen.getByText(playerChar))).toEqual([0, 1]);

    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    expect(getLocation(screen.getByText(playerChar))).toEqual([0, 0]);
  });

  test('pick up item', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }]
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} />);

    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);

    expect(getLocation(screen.getByText(playerChar))).toEqual([0, 1]);
    expect(screen.getByText(2)).toBeInTheDocument();

    await user.keyboard('[ArrowRight]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);

    expect(getLocation(screen.getByText(playerChar))).toEqual([1, 1]);
    expect(screen.getByText(3)).toBeInTheDocument();
  });

  test('pick up equipment', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }],
      equipments: [{
        x: 0,
        y: 2,
        entity: <Armor material='wood' amount={1} />,
      }],
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} />);

    expect(getLocation(screen.getByText(armorChar))).toEqual([0, 2]);

    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);

    expect(getLocation(screen.getByText(playerChar))).toEqual([1, 2]);
    const armors = screen.getAllByText(armorChar);
    expect(armors).toHaveLength(2);
    expect(armors[0]).toBeInTheDocument();
    expect(getLocation(armors[1])).toEqual([1, 2]);
  });

  test('take a dip', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }]
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} stats={false} />);

    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);

    expect(getLocation(screen.getByText(playerChar))).toEqual([2, 2]);
    expect(getLocation(screen.getByText(downChar))).toEqual([2, 2]);

    await user.keyboard('[ArrowLeft]');
    clock!.tick(500);

    expect(getLocation(screen.getByText(playerChar))).toEqual([1, 2]);
    expect(screen.queryByText(downChar)).toBeNull();
  });

  test('fight a triangle', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }, {
        x: 0,
        y: 1,
        entity: <Triangle orientation='down' amount={3} maximum={3} id={1} />,
      }],
      equipments: [{
        x: 2,
        y: 2,
        entity: <Sword material='wood' amount={1} />,
      }],
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} stats={false} />);

    expect(getLocation(screen.getByText(downTriangleChar))).toEqual([0, 1]);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);
    await user.keyboard('[ArrowRight]');
    clock!.tick(500);

    expect(getLocation(screen.getByText(playerChar))).toEqual([1, 2]);
    expect(getLocation(screen.getByText(downTriangleChar))).toEqual([0, 0]);
    const healths = screen.getAllByText(health8Char);
    expect(healths).toHaveLength(2);
    expect(getLocation(healths[0])).toEqual([1, 2]);
    expect(getLocation(healths[1])).toEqual([0, 0]);

    clock!.tick(1000);
    await user.keyboard('[ArrowLeft]');
    clock!.tick(500);
    expect(getLocation(screen.getByText(downTriangleChar))).toEqual([0, 0]);
    expect(getLocation(screen.getByText(health5Char))).toEqual([0, 0]);

    clock!.tick(1000);
    await user.keyboard('[ArrowLeft]');
    clock!.tick(500);
    expect(getLocation(screen.getByText(downTriangleChar))).toEqual([0, 0]);
    expect(getLocation(screen.getByText(health3Char))).toEqual([0, 0]);

    clock!.tick(1000);
    await user.keyboard('[ArrowLeft]');
    clock!.tick(500);
    expect(screen.queryByText(downTriangleChar)).toBeNull();
  });

  test('freeze water', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const generateLevel = generateMap('basic', {
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} id={0} />,
      }],
      equipments: [{
        x: 0,
        y: 1,
        entity: <Spell material='ice' amount={1} />,
      }],
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} stats={false} />);

    let blocks = screen.getAllByText(fullChar);
    let half = screen.getByText(mediumChar);
    expect(getLocation(blocks[0])).toEqual([2, 2]);
    expect(blocks[0]).toHaveClass('Water');
    expect(getLocation(half)).toEqual([1, 2]);
    expect(half).toHaveClass('Sand');
    
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);
    await user.keyboard('[Space]');
    clock!.tick(2500);

    blocks = screen.getAllByText(fullChar);
    half = screen.getByText(mediumChar);
    expect(getLocation(blocks[0])).toEqual([2, 2]);
    expect(blocks[0]).toHaveClass('Ice');
    expect(getLocation(half)).toEqual([1, 2]);
    expect(half).toHaveClass('Sand');
  });

  test('freeze a triangle', async () => {
    const setScore = jest.fn();
    const gameOver = jest.fn();
    const spell = <Spell material='ice' amount={1} />;
    const generateLevel = generateMap('basic', {
      inventory: { spell },
      creatures: [{
        x: 0,
        y: 0,
        entity: <Player orientation='up' amount={10} maximum={10} equipments={[spell]} id={0} />,
      }, {
        x: 0,
        y: 1,
        entity: <Triangle orientation='down' amount={3} maximum={3} id={1} />,
      }],
    });

    render(<Terminal score={0} setScore={setScore} gameOver={gameOver} generateLevel={generateLevel} controls={false} stats={false} />);
    
    await user.keyboard('[Space]');
    clock!.tick(500);
    await user.keyboard('[ArrowUp]');
    clock!.tick(500);
    await user.keyboard('[ArrowDown]');
    clock!.tick(500);

    const dark = screen.getByText(darkChar);
    expect(getLocation(screen.getByText(playerChar))).toEqual([0, 0]);
    expect(getLocation(screen.getByText(downTriangleChar))).toEqual([0, 1]);
    expect(getLocation(dark)).toEqual([0, 1]);
    expect(dark).toHaveClass('Freezing');
  });
});