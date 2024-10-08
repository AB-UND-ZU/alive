import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { add, normalize, signedDistance } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { REFERENCE } from "../components/reference";
import { getCell } from "./map";
import { rerenderEntity } from "./renderer";
import { TOOLTIP } from "../components/tooltip";
import { Entity } from "ecs";
import { ANIMATABLE } from "../components/animatable";
import { entities } from "..";
import { createTooltip } from "../../game/assets/sprites";
import { SPRITE } from "../components/sprite";
import { getLootable, isEmpty } from "./collect";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { isDead } from "./damage";
import { isUnlocked } from "./action";

export const getTooltip = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => TOOLTIP in entity
  ) as Entity | undefined;

export default function setupText(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const hero = world.getEntity([PLAYER]);
    const size = world.metadata.gameEntity[LEVEL].size;

    if (!hero || world.metadata.gameEntity[LEVEL].map.length === 0) return;

    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    const activeTooltips: Entity[] = [];

    // check any adjacent tooltips
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const delta = { x: offsetX, y: offsetY };
        const targetPosition = add(hero[POSITION], delta);
        const tooltipEntity = getTooltip(world, targetPosition);

        // handle overrides in next step
        if (!tooltipEntity?.[ANIMATABLE] || tooltipEntity?.[TOOLTIP].override)
          continue;
        
        activeTooltips.push(tooltipEntity);
      }
    }

    // add global tooltips
    let pendingTooltip: Entity | undefined = undefined;
    for (const tooltipEntity of world.getEntities([TOOLTIP, ANIMATABLE])) {
      const isVisible = tooltipEntity[TOOLTIP].override === "visible";
      const hasIdle = !!tooltipEntity[TOOLTIP].idle;
      const isIdle = !!tooltipEntity[ANIMATABLE].states.dialog?.args.isIdle;
      const isAdded = activeTooltips.some(
        (tooltip) => tooltip === tooltipEntity
      );

      // check pending tooltip
      const lootable = getLootable(world, tooltipEntity[POSITION]);
      const item =
        lootable && world.getEntityById(lootable[INVENTORY].items.slice(-1)[0]);
      const isCounter = !!item?.[ITEM].counter;

      const isPending = !!tooltipEntity[ANIMATABLE].states.dialog;

      if (!pendingTooltip && isPending && !isCounter && !isVisible && !isIdle)
        pendingTooltip = tooltipEntity;

      if (isAdded || !(isVisible || hasIdle)) continue;

      activeTooltips.push(tooltipEntity);
    }

    // create or update tooltips
    const updatedTooltips = activeTooltips.filter((tooltipEntity) => {
      const delta = {
        x: signedDistance(hero[POSITION].x, tooltipEntity[POSITION].x, size),
        y: signedDistance(hero[POSITION].y, tooltipEntity[POSITION].y, size),
      };
      const isAdjacent = Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;
      const lootable = getLootable(world, tooltipEntity[POSITION]);
      const item =
        lootable && world.getEntityById(lootable[INVENTORY].items.slice(-1)[0]);
      const isCounter = !!item?.[ITEM].counter;

      const isIdle = !!tooltipEntity[ANIMATABLE].states.dialog?.args.isIdle;
      const isPending = !!tooltipEntity[ANIMATABLE].states.dialog;
      const isChanged = isIdle && isAdjacent;
      const needsUpdate =
        !isPending || (!tooltipEntity[TOOLTIP].changed && isChanged);
      const isDone =
        isDead(world, tooltipEntity) ||
        isEmpty(world, tooltipEntity) ||
        isUnlocked(world, tooltipEntity);

      return needsUpdate && !isCounter && !isDone;
    });

    for (const tooltipEntity of updatedTooltips) {
      const delta = {
        x: signedDistance(hero[POSITION].x, tooltipEntity[POSITION].x, size),
        y: signedDistance(hero[POSITION].y, tooltipEntity[POSITION].y, size),
      };
      const isAdjacent = Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;
      const isVisible = tooltipEntity[TOOLTIP].override === "visible";

      const lootable = getLootable(world, tooltipEntity[POSITION]);
      const idle = tooltipEntity[TOOLTIP].idle;
      const isIdle = !isVisible && !isAdjacent;
      const dialogs = tooltipEntity[TOOLTIP].dialogs;
      const dialog = dialogs[tooltipEntity[TOOLTIP].nextDialog] || dialogs[0];
      const spriteTooltip = createTooltip(
        (lootable &&
          world.getEntityById(lootable[INVENTORY].items.slice(-1)[0])[SPRITE]
            .name) ||
          tooltipEntity[SPRITE].name
      );
      const text = isIdle ? [idle] : dialog || spriteTooltip;

      if (tooltipEntity[ANIMATABLE].states.dialog) {
        // let idle dialog disappear
        tooltipEntity[TOOLTIP].changed = true;
      } else {
        // advance dialog
        if (dialogs.length > 0 && !isIdle) {
          tooltipEntity[TOOLTIP].nextDialog = normalize(
            tooltipEntity[TOOLTIP].nextDialog + 1,
            dialogs.length
          );
        }

        // create tooltip animation
        const animationEntity = entities.createFrame(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 1 },
        });
        tooltipEntity[ANIMATABLE].states.dialog = {
          name: "dialogText",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: {
            text,
            timestamp: 0,
            active: true,
            isDialog: !!dialog,
            isIdle,
            after:
              pendingTooltip && !isIdle
                ? world.getEntityId(pendingTooltip)
                : undefined,
            lengthOffset: 0,
          },
          particles: {},
        };
        pendingTooltip = tooltipEntity;
      }

      rerenderEntity(world, tooltipEntity);
    }
  };

  return { onUpdate };
}
