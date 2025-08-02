import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { add, getDistance, signedDistance } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { REFERENCE } from "../components/reference";
import { getCell } from "./map";
import { rerenderEntity } from "./renderer";
import { TOOLTIP } from "../components/tooltip";
import { Entity } from "ecs";
import { createTooltip } from "../../game/assets/sprites";
import { SPRITE } from "../components/sprite";
import { isDead } from "./damage";
import { isUnlocked } from "./action";
import { DialogSequence, SEQUENCABLE } from "../components/sequencable";
import { createSequence, getSequence } from "./sequence";
import { TypedEntity } from "../entities";
import { LIGHT } from "../components/light";
import { SPAWNABLE } from "../components/spawnable";
import { isInPopup } from "./popup";

export const getTooltip = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => TOOLTIP in entity
  ) as Entity | undefined;

export default function setupText(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const hero = world.getEntity([PLAYER, POSITION, LIGHT, SPAWNABLE]);
    const size = world.metadata.gameEntity[LEVEL].size;

    if (!world.metadata.gameEntity[LEVEL].initialized) return;

    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    let pendingTooltip: Entity | undefined = undefined;
    let activeTooltips: TypedEntity<
      "TOOLTIP" | "POSITION" | "SPRITE" | "SEQUENCABLE"
    >[] = [];

    // check any adjacent tooltips
    if (hero && !isDead(world, hero) && !isInPopup(world, hero)) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          const delta = { x: offsetX, y: offsetY };
          const targetPosition = add(hero[POSITION], delta);
          const tooltip = getTooltip(world, targetPosition);
          const tooltipEntity =
            tooltip &&
            world.assertComponents(tooltip, [
              POSITION,
              SPRITE,
              TOOLTIP,
              SEQUENCABLE,
            ]);

          // handle overrides in next step and ignore self
          if (
            (tooltipEntity === hero && hero[TOOLTIP]?.override !== "visible") ||
            !tooltipEntity?.[SEQUENCABLE] ||
            tooltipEntity?.[TOOLTIP].override
          )
            continue;

          if (getSequence(world, tooltipEntity, "dialog")) {
            pendingTooltip = tooltipEntity;
            activeTooltips = [tooltipEntity];
          } else if (!pendingTooltip) {
            activeTooltips = [tooltipEntity];
          }
        }
      }
    }

    // add global tooltips
    for (const tooltipEntity of world.getEntities([
      TOOLTIP,
      SEQUENCABLE,
      POSITION,
    ])) {
      const inRange =
        !hero ||
        getDistance(hero[POSITION], tooltipEntity[POSITION], size) <
          hero[SPAWNABLE].light.visibility + 2;

      // ignore self and out of range
      if (
        (tooltipEntity === hero && hero[TOOLTIP]?.override !== "visible") ||
        !inRange
      )
        continue;

      const delta = hero && {
        x: signedDistance(hero[POSITION].x, tooltipEntity[POSITION].x, size),
        y: signedDistance(hero[POSITION].y, tooltipEntity[POSITION].y, size),
      };

      const isAdjacent =
        delta && Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;

      const isVisible = tooltipEntity[TOOLTIP].override === "visible";
      const hasIdle = !!tooltipEntity[TOOLTIP].idle;
      const isIdle = !!tooltipEntity[SEQUENCABLE].states.dialog?.args.isIdle;
      const isAdded = activeTooltips.some(
        (tooltip) => tooltip === tooltipEntity
      );

      // check pending tooltip
      const isPending = !!getSequence(world, tooltipEntity, "dialog");

      if (!pendingTooltip && isPending && !isVisible && !isIdle) {
        pendingTooltip = tooltipEntity;
      }

      if (
        isAdded ||
        !(isVisible || hasIdle) ||
        (isAdjacent && hasIdle && isPending)
      )
        continue;

      activeTooltips.push(
        world.assertComponents(tooltipEntity, [
          POSITION,
          SPRITE,
          TOOLTIP,
          SEQUENCABLE,
        ])
      );
    }

    // create or update tooltips
    const updatedTooltips = activeTooltips.filter((tooltipEntity) => {
      const delta = hero &&
        !isDead(world, hero) && {
          x: signedDistance(hero[POSITION].x, tooltipEntity[POSITION].x, size),
          y: signedDistance(hero[POSITION].y, tooltipEntity[POSITION].y, size),
        };
      const isAdjacent =
        delta && Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;
      const isIdle = getSequence(world, tooltipEntity, "dialog")?.args.isIdle;
      const isPending = !!getSequence(world, tooltipEntity, "dialog");
      const isChanged = isIdle && isAdjacent;
      const needsUpdate =
        !isPending || (!tooltipEntity[TOOLTIP].changed && isChanged);
      const isDone =
        isDead(world, tooltipEntity) || isUnlocked(world, tooltipEntity);

      return needsUpdate && !isDone;
    });

    for (const tooltipEntity of updatedTooltips) {
      const delta = hero && {
        x: signedDistance(hero[POSITION].x, tooltipEntity[POSITION].x, size),
        y: signedDistance(hero[POSITION].y, tooltipEntity[POSITION].y, size),
      };

      const isAdjacent =
        delta && Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;
      const isVisible = tooltipEntity[TOOLTIP].override === "visible";

      const idle = tooltipEntity[TOOLTIP].idle;
      const dialogs = tooltipEntity[TOOLTIP].dialogs;
      const spriteText = tooltipEntity[SPRITE].name;
      const spriteTooltip = spriteText ? createTooltip(spriteText) : [];
      const isIdle =
        !isVisible &&
        (!isAdjacent ||
          (isAdjacent && dialogs.length === 0 && spriteTooltip.length === 0));
      const dialog = dialogs[tooltipEntity[TOOLTIP].nextDialog] || dialogs[0];
      const text = isIdle && idle ? [idle] : dialog || spriteTooltip;

      if (text.length === 0) continue;

      const textSequence = getSequence(world, tooltipEntity, "dialog");
      if (textSequence) {
        // let idle dialog disappear
        if (!textSequence.args.isIdle || !isIdle) {
          tooltipEntity[TOOLTIP].changed = true;
        }
      } else {
        if (isIdle || isVisible) {
          tooltipEntity[TOOLTIP].nextDialog = 0;
        }
        tooltipEntity[TOOLTIP].changed = false;

        // create tooltip animation
        createSequence<"dialog", DialogSequence>(
          world,
          tooltipEntity,
          "dialog",
          "dialogText",
          {
            text,
            timestamp: 0,
            active: true,
            isDialog: !isIdle && !!dialog,
            isEnemy: !!tooltipEntity[TOOLTIP].enemy,
            isIdle,
            lengthOffset: 0,
            overridden: tooltipEntity[TOOLTIP].override === "visible",
          }
        );

        pendingTooltip = tooltipEntity;
      }

      rerenderEntity(world, tooltipEntity);
    }
  };

  return { onUpdate };
}
