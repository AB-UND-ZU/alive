import { ReactComponentElement } from "react";
import { Equipment, Freezing, Ice, Particle, Player, Shock, Spell, Water } from "./entities";
import { getCell, Point, Processor, TerminalState, updateBoard, wrapCoordinates } from "./utils";

const SHOCK_RADIUS = 5;

const createParticle = (state: TerminalState, origin: Processor<Equipment>, particle: ReactComponentElement<Particle>, delta: Point): Processor<Particle> => {
  const [x, y] = wrapCoordinates(state, origin.x + delta[0], origin.y + delta[1]);
  return {
    entity: particle,
    x,
    y,
  };
}

export const tickEquipment = (state: TerminalState, processor: Processor<Equipment>): [TerminalState, Processor<Equipment> | undefined] => {
  const newState = { ...state };
  const newProcessor = { ...processor };
  const radius = newProcessor.entity.props.amount;
  const newParticles: Processor<Particle>[] = [];

  // apply effects of last wave
  newProcessor.entity.props.particles?.forEach(particle => {
    if (newProcessor.entity.type === Spell && newProcessor.entity.props.interaction === 'using') {
      // freeze grounds
      const cell = getCell(state, particle.x, particle.y);
      const frozen = cell.grounds?.map(
        ground => ground.type === Water ? {
          ...ground,
          type: Ice,
        } : ground,
      );
      newState.board = updateBoard(newState.board, particle.x, particle.y, {
        ...cell,
        grounds: frozen,
      });

      // freeze creatures
      const affectedIndex = newState.creatures.findIndex(creature => (
        creature.entity.type !== Player &&
        creature.x === particle.x &&
        creature.y === particle.y
      ));
      const affectedCreature = { ...newState.creatures[affectedIndex] };
      if (affectedCreature.entity) {
        const frozenParticles = affectedCreature.entity.props.particles || [];
        const frozenIndex = frozenParticles.findIndex(particle => particle.type === Freezing);
        const alreadyFrozen = frozenParticles[frozenIndex];
        if (alreadyFrozen) {
          frozenParticles.splice(frozenIndex, 1,{
            ...alreadyFrozen,
            props: {
              ...alreadyFrozen.props,
              amount: 8
            }
          });
         } else {
          frozenParticles.push(<Freezing amount={8} />);
         }
        affectedCreature.entity = {
          ...affectedCreature.entity,
          props: {
            ...affectedCreature.entity.props,
            particles: frozenParticles
          }
        }
        const newCreatures = [...newState.creatures];
        newCreatures.splice(affectedIndex, 1, affectedCreature);
        newState.creatures = newCreatures;
      }

    }
  });

  if (newProcessor.entity.type === Spell && newProcessor.entity.props.interaction === 'using') {
    // create new wave
    if (radius > SHOCK_RADIUS) {
      return [newState, undefined];
    } else {
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

      // invisible particles to prevent mobs passing through
      newParticles.push(
        createParticle(state, newProcessor, <Shock direction="center" />, [0, (radius + 1) * -1]),
        createParticle(state, newProcessor, <Shock direction="center" />, [radius + 1, 0]),
        createParticle(state, newProcessor, <Shock direction="center" />, [0, radius + 1]),
        createParticle(state, newProcessor, <Shock direction="center" />, [(radius + 1) * -1, 0]),
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
  }

  return [newState, newProcessor];
}