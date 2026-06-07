import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { isControllable } from "./freeze";
import { getLootable } from "./collect";
import { ITEM } from "../components/item";
import { EQUIPPABLE } from "../components/equippable";
import { CONDITIONABLE } from "../components/conditionable";
import { isWalkable } from "./movement";
import { getSpikable } from "./spike";
import { canRedeem } from "./popup";
import { Deal } from "../components/popup";
import { getBuildTarget, isCell, triggerTool } from "./harvest";
import { Construction } from "../../game/balancing/building";
import { Entity } from "ecs";
import { getItemStats } from "../../game/balancing/equipment";
import { BUILDABLE } from "../components/buildable";
import { STATS } from "../components/stats";
import { createCell } from "../../bindings/creation";
import { disposeEntity, getCell } from "./map";
import { getSelectedConstruction } from "./trigger";
import { orientationDelta } from "../../game/math/path";
import { HARVESTABLE } from "../components/harvestable";
import { isImmersible } from "./immersion";
import { colors } from "../../game/assets/colors";
import {
  addBackground,
  colorizeSprite,
  recolorSprite,
} from "../../game/assets/ui";
import { IMMERSIBLE } from "../components/immersible";
import { LIQUID } from "../components/liquid";
import { isEnterable } from "./enter";

export const canPlot = (world: World, entity: Entity, position: Position) => {
  const construction = getSelectedConstruction(world, entity);

  if (!construction) return false;

  return construction.grounds.some((ground) => {
    const cells = Object.values(getCell(world, position)).filter(
      (cell) =>
        isCell(world, cell) && !isEnterable(world, cell) && !(LIQUID in cell)
    );
    if (ground === "air" && cells.length === 0) return true;
    if (
      ground === "sand" &&
      cells.length > 0 &&
      cells.every((cell) =>
        ["sand", "beach"].includes(cell[HARVESTABLE]?.resource)
      )
    )
      return true;
    if (
      ground === "path" &&
      cells.length > 0 &&
      cells.every((cell) => cell[HARVESTABLE]?.resource === "path")
    )
      return true;
    if (
      ground === "water" &&
      isImmersible(world, position) &&
      cells.every((cell) => IMMERSIBLE in cell)
    )
      return true;

    return false;
  });
};

export const canConstruct = (
  world: World,
  entity: Entity,
  construction: Construction
) => {
  const toolItem = world.getEntityByIdAndComponents(entity[EQUIPPABLE].tool, [
    ITEM,
  ]);
  if (!toolItem || toolItem[ITEM].tool !== "hammer") return false;
  const toolStats = getItemStats(toolItem[ITEM]);
  return toolStats.build >= construction.level;
};

export const canBuild = (
  world: World,
  entity: Entity,
  construction: Construction
) => {
  const constructable = canConstruct(world, entity, construction);
  const shoppable = canRedeem(world, entity, getBuildingDeal(construction));
  return shoppable && constructable;
};

export const getPlotPreview = (
  world: World,
  construction: Construction,
  variant: number,
  position: Position
) => {
  const immersible = isImmersible(world, position);
  const previewSprite = colorizeSprite(
    construction.variants[variant].sprite,
    colors.green,
    colors.lime
  );
  const backgroundSprite = immersible
    ? recolorSprite(previewSprite, { [colors.black]: colors.navy })
    : previewSprite;
  return addBackground(
    [backgroundSprite],
    immersible ? colors.navy : colors.black
  )[0];
};

export const getBuildingDeal = (construction: Construction): Deal => ({
  item: { amount: 0 },
  stock: Infinity,
  prices: construction.parts,
});

export default function setupBuild(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle plots finishing building
    for (const entity of world.getEntities([
      BUILDABLE,
      POSITION,
      RENDERABLE,
      STATS,
    ])) {
      if (entity[STATS].hp < entity[STATS].maxHp) continue;

      // replace plot with cell
      createCell(world, entity[POSITION], entity[BUILDABLE].cell, "hidden");
      disposeEntity(world, entity);

      // clear water
      if (
        ["jetty_horizontal", "jetty_vertical"].includes(entity[BUILDABLE].cell)
      ) {
        Object.values(getCell(world, entity[POSITION])).forEach((cell) => {
          if (IMMERSIBLE in cell) {
            disposeEntity(world, cell);
          }
        });
      }
    }

    // handle player building or reparing
    for (const entity of world.getEntities([
      POSITION,
      MOVABLE,
      EQUIPPABLE,
      CONDITIONABLE,
      ORIENTABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE]
      )[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if entity already interacted
      if (entity[MOVABLE].lastInteraction === entityReference) continue;

      // skip if not building or repairing
      const toolItem = world.getEntityByIdAndComponents(
        entity[EQUIPPABLE].tool,
        [ITEM]
      );
      const hammerCondition = entity[CONDITIONABLE].hammer;
      const buildCondition = entity[CONDITIONABLE].build;
      if (
        !isControllable(world, entity) ||
        (!hammerCondition && !buildCondition) ||
        toolItem?.[ITEM].tool !== "hammer"
      )
        continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].orientations[0] || entity[MOVABLE].pendingOrientation;

      if (!targetOrientation) continue;

      const currentOrientation = entity[ORIENTABLE].facing;
      const construction = getSelectedConstruction(world, entity);

      if (
        buildCondition &&
        construction &&
        construction.variants.length > 1 &&
        currentOrientation
      ) {
        const rotations = orientationDelta(
          currentOrientation,
          targetOrientation
        );
        const clockwise = rotations === 1;
        const counterClockwise = rotations === -1;
        if (clockwise) {
          if (buildCondition.modifier < construction.variants.length - 1) {
            buildCondition.modifier += 1;
            entity[MOVABLE].orientations = [];
            entity[MOVABLE].pendingOrientation = undefined;
            entity[MOVABLE].lastInteraction = entityReference;
            continue;
          }
          buildCondition.modifier = 0;
        } else if (counterClockwise) {
          if (buildCondition.modifier > 0) {
            entity[MOVABLE].orientations = [];
            entity[MOVABLE].pendingOrientation = undefined;
            entity[MOVABLE].lastInteraction = entityReference;
            buildCondition.modifier -= 1;
            continue;
          }
          buildCondition.modifier = construction.variants.length - 1;
        }
      }
      entity[ORIENTABLE].facing = targetOrientation;
      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const walkable = isWalkable(world, targetPosition);
      const lootable = getLootable(world, targetPosition);

      if (buildCondition) {
        if (currentOrientation === targetOrientation && walkable) {
          continue;
        }
      } else if (hammerCondition) {
        const targetEntity = getBuildTarget(
          world,
          entity,
          toolItem,
          targetOrientation
        );

        if (targetEntity) {
          triggerTool(world, entity, toolItem);
        } else if (walkable || lootable) {
          // prevent all actions except walking and looting
          continue;
        }
      }

      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
