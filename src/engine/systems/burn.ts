import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { Entity } from "ecs";
import { entities } from "..";
import { ANIMATABLE } from "../components/animatable";
import { BURNABLE } from "../components/burnable";
import { getCell } from "./map";

export const isBurning = (world: World, entity: Entity) =>
  entity[BURNABLE]?.burning;

export const getBurning = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isBurning(world, entity)
  ) as Entity | undefined;

export default function setupBurn(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([
      POSITION,
      BURNABLE,
      RENDERABLE,
      ANIMATABLE,
    ])) {
      // skip if not burning
      if (!isBurning(world, entity)) return;

      // create burning animation
      if (!entity[ANIMATABLE].states.burn) {
        const animationEntity = entities.createFrame(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 1 },
        });

        entity[ANIMATABLE].states.burn = {
          name: "fireBurn",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: { generation: 0 },
          particles: {},
        };
      }
    }
  };

  return { onUpdate };
}
