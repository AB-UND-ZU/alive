import { ReactComponentElement } from "react";
import { Equipment, Particle, Shock } from "./entities";
import { addPoints, directionOffset, directions, Point, Processor, TerminalState, wrapCoordinates } from "./utils";

const SHOCK_RADIUS = 5;

const createParticle = (state: TerminalState, origin: Processor<Equipment>, particle: ReactComponentElement<Particle>, delta: Point): Processor<Particle> => {
  const [x, y] = wrapCoordinates(state, origin.x + delta[0], origin.y + delta[1]);
  return {
    entity: particle,
    x,
    y,
  };
}

export const tickSpell = (state: TerminalState, processor: Processor<Equipment>): [TerminalState, Processor<Equipment>] => {
  const newState = { ...state };
  const newProcessor = { ...processor };
  const radius = newProcessor.entity.props.amount;
  const newParticles: Processor<Particle>[] = [];

  if (radius <= SHOCK_RADIUS) {
    // top row
    newParticles.push(
      createParticle(state, newProcessor, <Shock direction="leftUp" />, [-1, radius * -1]),
      createParticle(state, newProcessor, <Shock direction="up" />, [0, radius * -1]),
      createParticle(state, newProcessor, <Shock direction="upRight" />, [1, radius * -1]),
    );

    // upper rows
    Array.from({ length: radius - 1 }).forEach((_, index) => {
      newParticles.push(
        createParticle(state, newProcessor, <Shock direction="leftUp" />, [(index + 2) * -1, (radius - index - 1) * -1]),
        createParticle(state, newProcessor, <Shock direction="rightDown" />, [(index + 1) * -1, (radius - index - 1) * -1]),
        createParticle(state, newProcessor, <Shock direction="downLeft" />, [index + 1, (radius - index - 1) * -1]),
        createParticle(state, newProcessor, <Shock direction="upRight" />, [index + 2, (radius - index - 1) * -1]),
      );
    });

    // horizontal edges
    newParticles.push(
      createParticle(state, newProcessor, <Shock direction="left" />, [radius * -1, 0]),
      createParticle(state, newProcessor, <Shock direction="right" />, [radius, 0]),
    );

    // lower rows
    Array.from({ length: radius - 1 }).forEach((_, index) => {
      newParticles.push(
        createParticle(state, newProcessor, <Shock direction="downLeft" />, [(index + 2) * -1, radius - index - 1]),
        createParticle(state, newProcessor, <Shock direction="upRight" />, [(index + 1) * -1, radius - index - 1]),
        createParticle(state, newProcessor, <Shock direction="leftUp" />, [index + 1, radius - index - 1]),
        createParticle(state, newProcessor, <Shock direction="rightDown" />, [index + 2, radius - index - 1]),
      );
    });

    // bottom row
    newParticles.push(
      createParticle(state, newProcessor, <Shock direction="downLeft" />, [-1, radius]),
      createParticle(state, newProcessor, <Shock direction="down" />, [0, radius]),
      createParticle(state, newProcessor, <Shock direction="rightDown" />, [1, radius]),
    );
  }

  newProcessor.entity = {
    ...newProcessor.entity,
    props: {
      ...newProcessor.entity.props,
      amount: radius + 1,
      particles: newParticles,
    },
  }

  return [newState, newProcessor];
}