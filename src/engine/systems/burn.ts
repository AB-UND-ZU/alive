import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { Entity } from "ecs";
import {
  BurnSequence,
  SEQUENCABLE,
  SmokeSequence,
} from "../components/sequencable";
import { BURNABLE } from "../components/burnable";
import { getCell } from "./map";
import { createSequence } from "./sequence";
import { getSequence } from "./sequence";

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
      SEQUENCABLE,
    ])) {
      // skip if not burning
      if (!isBurning(world, entity)) return;

      // create burning animation
      if (!getSequence(world, entity, "burn")) {
        createSequence<"burn", BurnSequence>(
          world,
          entity,
          "burn",
          "fireBurn",
          { generation: 0 }
        );
        createSequence<"smoke", SmokeSequence>(
          world,
          entity,
          "smoke",
          "smokeWind",
          { generation: 0 }
        );
      }
    }
  };

  return { onUpdate };
}
