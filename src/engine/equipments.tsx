import produce from "immer";
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

export const tickEquipment = (
  state: TerminalState,
  processor: Processor<Equipment>,
  parent: Processor<Equipment>[] = state.equipments
) => {
  const radius = processor.entity.props.amount;

  processor.entity.props = produce(processor.entity.props, props => {
    if (!props.particles) {
      props.particles = [];
    }
  })

  // apply effects of last wave
  processor.entity.props.particles!.forEach(particle => {
    if (processor.entity.type === Spell && processor.entity.props.interaction === 'using') {
      // freeze grounds
      const cell = getCell(state, particle.x, particle.y);
      cell.grounds?.forEach(ground => {
        if (ground.type === Water) {
          ground.type = Ice;
        }
      });

      // freeze creatures
      const affectedCreature = state.creatures.find(creature => (
        creature.entity.type !== Player &&
        creature.x === particle.x &&
        creature.y === particle.y
      ));

      if (affectedCreature) {
        if (!affectedCreature.entity.props.particles) {
          affectedCreature.entity.props.particles = [];
        }
        const frozenProcessor = affectedCreature.entity.props.particles.find(particle => particle.entity.type === Freezing);
        if (frozenProcessor) {
          frozenProcessor.entity.props.amount = 8;
         } else {
          const newFrozenProcessor = {
            x: particle.x,
            y: particle.x,
            entity: <Freezing amount={8} />,
          };
          affectedCreature.entity.props.particles.push(newFrozenProcessor);
         }
      }
    }
  });

  if (processor.entity.type === Spell && processor.entity.props.interaction === 'using') {
    // create new wave
    if (radius > SHOCK_RADIUS) {
      parent.splice(parent.indexOf(processor), 1);
    } else {
      // top row
      processor.entity.props.particles.push(
        createParticle(state, processor, <Shock direction="leftUp" />, [-1, radius * -1]),
        createParticle(state, processor, <Shock direction="up" />, [0, radius * -1]),
        createParticle(state, processor, <Shock direction="upRight" />, [1, radius * -1]),
      );

      // upper rows
      Array.from({ length: radius - 1 }).forEach((_, index) => {
        processor.entity.props.particles!.push(
          createParticle(state, processor, <Shock direction="leftUp" />, [(index + 2) * -1, (radius - index - 1) * -1]),
          createParticle(state, processor, <Shock direction="rightDown" />, [(index + 1) * -1, (radius - index - 1) * -1]),
          createParticle(state, processor, <Shock direction="downLeft" />, [index + 1, (radius - index - 1) * -1]),
          createParticle(state, processor, <Shock direction="upRight" />, [index + 2, (radius - index - 1) * -1]),
        );
      });

      // horizontal edges
      processor.entity.props.particles.push(
        createParticle(state, processor, <Shock direction="left" />, [radius * -1, 0]),
        createParticle(state, processor, <Shock direction="right" />, [radius, 0]),
      );

      // lower rows
      Array.from({ length: radius - 1 }).forEach((_, index) => {
        processor.entity.props.particles!.push(
          createParticle(state, processor, <Shock direction="downLeft" />, [(index + 2) * -1, radius - index - 1]),
          createParticle(state, processor, <Shock direction="upRight" />, [(index + 1) * -1, radius - index - 1]),
          createParticle(state, processor, <Shock direction="leftUp" />, [index + 1, radius - index - 1]),
          createParticle(state, processor, <Shock direction="rightDown" />, [index + 2, radius - index - 1]),
        );
      });

      // bottom row
      processor.entity.props.particles.push(
        createParticle(state, processor, <Shock direction="downLeft" />, [-1, radius]),
        createParticle(state, processor, <Shock direction="down" />, [0, radius]),
        createParticle(state, processor, <Shock direction="rightDown" />, [1, radius]),
      );

      // invisible particles to prevent mobs passing through
      processor.entity.props.particles.push(
        createParticle(state, processor, <Shock direction="center" />, [0, (radius + 1) * -1]),
        createParticle(state, processor, <Shock direction="center" />, [radius + 1, 0]),
        createParticle(state, processor, <Shock direction="center" />, [0, radius + 1]),
        createParticle(state, processor, <Shock direction="center" />, [(radius + 1) * -1, 0]),
      );
    }

    processor.entity.props.amount = radius + 1;
  }
}