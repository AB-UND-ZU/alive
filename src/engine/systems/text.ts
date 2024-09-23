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
import { createText } from "../../game/assets/sprites";
import { SPRITE } from "../components/sprite";
import { getLootable, isEmpty } from "./collect";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { isDead } from "./damage";
import * as colors from "../../game/assets/colors";

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

    const tooltips: Entity[] = [];
    let overrides = 0;

    // check any adjacent tooltips
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const delta = { x: offsetX, y: offsetY };
        const targetPosition = add(hero[POSITION], delta);
        const tooltipEntity = getTooltip(world, targetPosition);

        if (!tooltipEntity?.[ANIMATABLE]) continue;

        const isOverride = tooltipEntity[TOOLTIP].override;
        const isDisplayed =
          tooltipEntity[TOOLTIP].override !== false &&
          (isOverride || tooltips.length === overrides);

        if (!isDisplayed) continue;

        if (isOverride) overrides += 1;

        tooltips.push(tooltipEntity);
      }
    }

    // add global tooltips
    for (const dialogId of world.metadata.gameEntity[TOOLTIP].dialogs) {
      const dialogEntity = world.getEntityById(dialogId);

      if (tooltips.some((tooltip) => tooltip.entity === dialogEntity)) continue;

      overrides += 1;
      tooltips.push(dialogEntity);
    }

    const activeTooltips = tooltips.filter((tooltipEntity) => {
      const lootable = getLootable(world, tooltipEntity[POSITION]);
      const item =
        lootable && world.getEntityById(lootable[INVENTORY].items.slice(-1)[0]);

      const isPending = !!tooltipEntity[ANIMATABLE].states.dialog;
      const isCounter = item?.[ITEM].counter;
      const isDone =
        isDead(world, tooltipEntity) || isEmpty(world, tooltipEntity);

      return !isPending && !isCounter && !isDone;
    });

    for (const tooltip of activeTooltips) {
      const delta = {
        x: signedDistance(hero[POSITION].x, tooltip[POSITION].x, size),
        y: signedDistance(hero[POSITION].y, tooltip[POSITION].y, size),
      };

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

      const lootable = getLootable(world, tooltip[POSITION]);
      const dialogs = tooltip[TOOLTIP].dialogs;
      const dialog = dialogs[tooltip[TOOLTIP].nextDialog];
      if (dialogs.length > 0) {
        tooltip[TOOLTIP].nextDialog = normalize(
          tooltip[TOOLTIP].nextDialog + 1,
          dialogs.length
        );
      }
      const orientation =
        delta.y < 0 ? "up" : delta.y > 0 ? "down" : dialog ? "up" : "down";
      const text =
        dialog ||
        (lootable &&
          world.getEntityById(lootable[INVENTORY].items.slice(-1)[0])[SPRITE]
            .name) ||
        tooltip[SPRITE].name;

      const previousTooltip = world
        .getEntities([TOOLTIP, ANIMATABLE])
        .find(
          (entity) =>
            entity[ANIMATABLE].states.dialog && !entity[TOOLTIP].override
        );
      tooltip[ANIMATABLE].states.dialog = {
        name: "dialogText",
        reference: world.getEntityId(animationEntity),
        elapsed: 0,
        args: {
          orientation,
          text: createText(text, dialog ? colors.silver : "#2e2e2e"),
          timestamp: 0,
          active: true,
          after: previousTooltip
            ? world.getEntityId(previousTooltip)
            : undefined,
          lengthOffset: 0,
        },
        particles: {},
      };

      rerenderEntity(world, tooltip);
    }
  };

  return { onUpdate };
}
