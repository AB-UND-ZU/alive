import React from "react";
import { ReactComponentElement } from "react";
import { Creature, Freezing, Particle, Player, Swimming, Sword, Triangle } from "./entities";
import { tickParticle } from "./particles";
import { isWalkable, getDeterministicRandomInt, TerminalState, wrapCoordinates, directionOffset, orientations, Processor, isWater, getId } from "./utils";

export const tickCreature = (state: TerminalState, processor: Processor<Creature>): [TerminalState, Processor<Creature>] => {
  const newState = { ...state };
  const newProcessor = { ...processor };
  const creature = { ...newProcessor.entity };

  const freezingIndex = (creature.props.particles || []).findIndex(particle => particle.type === Freezing);
  const freezing = creature.props.particles?.[freezingIndex];

  if (freezing) {
    const frozenParticles = [...(creature.props.particles || [])];
    frozenParticles.splice(freezingIndex, 1);
    const newAmount = (freezing.props.amount || 0) - 1;
    if (newAmount > 0) {
      frozenParticles.push({
        ...freezing,
        props: {
          ...freezing.props,
          amount: newAmount,
        }
      });
    }
    creature.props = {
      ...creature.props,
      particles: frozenParticles
    };
  } else if (creature.type === Player) {
    const newEquipments = [...(creature.props.equipments || [])];
    const swordIndex = newEquipments.findIndex(equipment => equipment.type === Sword);

    if (swordIndex !== -1) {
      const sword = newEquipments[swordIndex];
      newEquipments.splice(swordIndex, 1, React.cloneElement(sword, { direction: undefined }));
      creature.props = {
        ...creature.props,
        equipments: newEquipments,
      };
    }

  } else if (creature.type === Triangle) {
    const orientation = creature.props.orientation;
    const [moveX, moveY] = directionOffset[orientation];
    const [targetX, targetY] = wrapCoordinates(newState, newProcessor.x + moveX, newProcessor.y + moveY);

    if (isWalkable(newState, targetX, targetY)) {
      newProcessor.x = targetX;
      newProcessor.y = targetY;
    } else {
      // find first free cell in either counter- or clockwise orientation by random
      const rotation = getDeterministicRandomInt(0, 1) * 2 - 1;
      const newOrientation = Array.from({ length: 3 }).map((_, offset) => {
        const attemptOrientation = orientations[(orientations.indexOf(orientation) + (offset + 1) * rotation + orientations.length) % orientations.length];
        const [attemptX, attemptY] = directionOffset[attemptOrientation];
        if (isWalkable(newState, newProcessor.x + attemptX, newProcessor.y + attemptY)) {
          return attemptOrientation;
        }
        return undefined;
      }).filter(Boolean)[0];

      // if creature is stuck, make it circle around
      const stuckOrientation = orientations[(orientations.indexOf(orientation) + getDeterministicRandomInt(1, orientations.length - 1)) % orientations.length];

      creature.props = {
        ...creature.props,
        orientation: newOrientation || stuckOrientation,
      };
    }
  }

  // add swimming state
  const swimming = creature.props.particles?.find(particle => particle.type === Swimming);
  if (!swimming && isWater(state, newProcessor.x, newProcessor.y)) {
    creature.props = {
      ...creature.props,
      particles: [...(creature.props.particles || []), <Swimming id={getId()} />],
    };
  };

  // process contained particles
  const newParticles = creature.props.particles?.map(particle => {
    const [particleState, processor] = tickParticle(newState, {
      x: newProcessor.x,
      y: newProcessor.y,
      entity: particle,
    });
    newState.board = particleState.board;
    return processor?.entity;
  }).filter(Boolean) as ReactComponentElement<Particle>[];

  creature.props = {
    ...creature.props,
    particles: newParticles,
  };
  newProcessor.entity = creature;

  return [newState, newProcessor];
}