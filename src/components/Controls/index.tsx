import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDimensions } from "../Dimensions";
import "./index.css";
import { MOVABLE } from "../../engine/components/movable";
import { useHero, useWorld } from "../../bindings/hooks";
import { REFERENCE } from "../../engine/components/reference";
import { Orientation } from "../../engine/components/orientable";
import { degreesToOrientations, pointToDegree } from "../../game/math/tracing";
import Row from "../Row";
import {
  buttonColor,
  createButton,
  createStat,
  createText,
  none,
  quest,
} from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { ACTIONABLE } from "../../engine/components/actionable";
import { repeat } from "../../game/math/std";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { createSprite, getMaterialSprite } from "../Entity/utils";
import { getAction } from "../../engine/systems/trigger";
import { Sprite } from "../../engine/components/sprite";
import { LOCKABLE } from "../../engine/components/lockable";
import { Item } from "../../engine/components/item";
import {
  canAcceptQuest,
  canTrade,
  canUnlock,
  isTradable,
} from "../../engine/systems/action";
import { TRADABLE } from "../../engine/components/tradable";

export const keyToOrientation: Record<KeyboardEvent["key"], Orientation> = {
  ArrowUp: "up",
  w: "up",
  ArrowRight: "right",
  d: "right",
  ArrowDown: "down",
  s: "down",
  ArrowLeft: "left",
  a: "left",
};

export const actionKeys = [" ", "Enter"];

const getActivationRow = (item?: Item) => {
  if (!item) return repeat(none, 3);

  if (item.counter) return createStat(item.amount, item.counter, true);

  return [
    none,
    getMaterialSprite(item.slot || item.consume, item.material),
    none,
  ];
};

const buttonWidth = 6;
const inventoryWidth = 10;

type Action = {
  name: string;
  activation: [Sprite[], Sprite[]];
  disabled: boolean;
};

export default function Controls() {
  const dimensions = useDimensions();
  const { ecs } = useWorld();
  const hero = useHero();
  const pressedOrientations = useRef<Orientation[]>([]);
  const touchOrigin = useRef<[number, number] | undefined>(undefined);
  const [action, setAction] = useState<Action>();

  const questId = hero?.[ACTIONABLE].quest;
  const questEntity = ecs && hero && questId && ecs.getEntityById(questId);
  const questActive = questEntity && canAcceptQuest(ecs, hero, questEntity);
  const questAction = useMemo<Action | undefined>(
    () =>
      questEntity && {
        name: "Quest",
        activation: [[none, questId ? quest : none, none], repeat(none, 3)],
        disabled: !questActive,
      },
    [questId, questEntity, questActive]
  );

  const unlockId = hero?.[ACTIONABLE].unlock;
  const unlockEntity = ecs && hero && unlockId && ecs.getEntityById(unlockId);
  const unlockActive = unlockEntity && canUnlock(ecs, hero, unlockEntity);
  const unlockAction = useMemo<Action | undefined>(
    () =>
      unlockEntity && {
        name: "Open",
        activation: [
          [
            none,
            getMaterialSprite("key", unlockEntity[LOCKABLE].material),
            none,
          ],
          repeat(none, 3),
        ],
        disabled: !unlockActive,
      },
    [unlockEntity, unlockActive]
  );

  const tradeId = hero?.[ACTIONABLE].trade;
  const tradeEntity = ecs && hero && tradeId && ecs.getEntityById(tradeId);
  const tradeActive =
    tradeEntity &&
    isTradable(ecs, tradeEntity) &&
    canTrade(ecs, hero, tradeEntity);
  const tradeAction = useMemo<Action | undefined>(() => {
    if (!tradeEntity) return;

    const activation = tradeEntity[TRADABLE].activation;
    return {
      name: "Buy",
      activation: [
        getActivationRow(activation[0]),
        getActivationRow(activation[1]),
      ],
      disabled: !tradeActive,
    };
  }, [tradeEntity, tradeActive]);

  const availableActions = [questAction, unlockAction, tradeAction].filter(
    Boolean
  ) as Action[];
  const activeAction =
    availableActions.find((action) => !action.disabled) || availableActions[0];

  const handleAction = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();

      if (action || !hero || !ecs) return;

      const reference = ecs.getEntityById(hero[MOVABLE].reference)[REFERENCE];

      if (!reference) return;

      // skip if waiting for cooldown or not actionable
      if (
        hero[ACTIONABLE].triggered ||
        !getAction(ecs, hero) ||
        activeAction?.disabled
      )
        return;

      hero[ACTIONABLE].triggered = true;

      reference.suspensionCounter = reference.suspensionCounter === -1 ? -1 : 1;
      reference.suspended = false;

      if (activeAction) {
        setAction(activeAction);
        setTimeout(setAction, reference.tick, undefined);
      }
    },
    [activeAction, action, hero, ecs]
  );

  const handleMove = useCallback(
    (orientations: Orientation[]) => {
      if (!hero || !ecs) return;

      const reference = ecs.getEntityById(hero[MOVABLE].reference)[REFERENCE];

      if (!reference) return;

      hero[MOVABLE].orientations = orientations;
      const pendingOrientation = orientations[0];

      if (pendingOrientation) {
        hero[MOVABLE].pendingOrientation = pendingOrientation;
      }

      if (orientations.length === 0) {
        reference.suspensionCounter = 0;

        if (hero[MOVABLE].pendingOrientation) {
          reference.suspensionCounter += 1;
        }
      } else {
        reference.suspensionCounter = -1;
        reference.suspended = false;
      }
    },
    [hero, ecs]
  );

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      // since macOS doesn't fire keyup when meta key is pressed, prevent it from moving.
      // still not working: arrow keydown -> meta keydown -> arrow keyup -> meta keyup
      // also prevent repeat events
      if (
        event.type === "keydown" &&
        (event.altKey || event.shiftKey || event.metaKey || event.repeat)
      )
        return;

      if (actionKeys.includes(event.key) && event.type === "keydown") {
        handleAction(event);
        return;
      }

      const orientation = keyToOrientation[event.key];

      if (!orientation) return;

      const orientations = pressedOrientations.current;

      if (event.type === "keydown") {
        orientations.unshift(orientation);
      } else if (event.type === "keyup") {
        orientations.splice(orientations.indexOf(orientation), 1);
      }

      handleMove(orientations);
    },
    [handleMove, handleAction]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      // prevent touches over action bar
      if (
        [...event.changedTouches].some(
          (touch) => (touch.target as HTMLElement).id === "action"
        )
      )
        return;

      event.preventDefault();

      if (event.touches.length !== 1) {
        touchOrigin.current = undefined;
        pressedOrientations.current = [];
        handleMove(pressedOrientations.current);
        return false;
      }

      const [x, y] = [event.touches[0].clientX, event.touches[0].clientY];

      if (!touchOrigin.current) {
        touchOrigin.current = [x, y];
      }

      const [deltaX, deltaY] = [
        x - touchOrigin.current[0],
        y - touchOrigin.current[1],
      ];

      if (Math.sqrt(deltaX ** 2 + deltaY ** 2) <= 5) {
        // handle spell
        return false;
      }

      const degrees = pointToDegree({ x: deltaX, y: deltaY });
      const nextOrientations = degreesToOrientations(degrees);

      if (nextOrientations.length > 0) {
        if (
          nextOrientations.length !== pressedOrientations.current.length ||
          !nextOrientations.every(
            (orientation, index) =>
              orientation === pressedOrientations.current[index]
          )
        ) {
          handleMove(nextOrientations);
        }
        pressedOrientations.current = nextOrientations;
      } else {
        pressedOrientations.current = [];
      }

      return false;
    },
    [handleMove]
  );

  useEffect(() => {
    if (!hero) return;

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);

    window.addEventListener("touchstart", handleTouchMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchMove);
    window.addEventListener("touchcancel", handleTouchMove);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);

      window.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchMove);
      window.removeEventListener("touchcancel", handleTouchMove);
    };
  }, [handleKey, handleTouchMove, hero]);

  const pressedButton =
    action && createButton(repeat(none, buttonWidth), buttonWidth, false, true);
  const emptyButton = [repeat(none, buttonWidth), repeat(none, buttonWidth)];
  const actionButton =
    activeAction &&
    createButton(
      createText(activeAction.name, buttonColor),
      buttonWidth,
      activeAction.disabled
    );
  const button = pressedButton || actionButton || emptyButton;

  const emptyActivation = [repeat(none, 3), repeat(none, 3)];
  const activation =
    action?.activation || activeAction?.activation || emptyActivation;

  const itemSprites =
    ecs && hero?.[INVENTORY]
      ? (hero[INVENTORY] as Inventory).items.map((itemId) =>
          createSprite(ecs, itemId)
        )
      : [];
  const itemRows = [0, 1].map((row) =>
    Array.from({ length: inventoryWidth }).map(
      (_, column) => itemSprites[row * inventoryWidth + column] || none
    )
  );

  return (
    <footer className="Controls">
      <Row
        cells={[
          ...createText("═".repeat(dimensions.padding + 10), colors.grey),
          ...createText("╤", colors.grey),
          ...createText("═".repeat(dimensions.padding + 10), colors.grey),
        ]}
      />
      <Row
        cells={[
          none,
          ...button[0],
          ...activation[0],
          ...createText("│", colors.grey),
          ...itemRows[0],
        ]}
      />
      <Row
        cells={[
          none,
          ...button[1],
          ...activation[1],
          ...createText("│", colors.grey),
          ...itemRows[1],
        ]}
      />
      <div className="Action" id="action" onClick={handleAction} />
    </footer>
  );
}
