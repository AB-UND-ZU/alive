import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDimensions } from "../Dimensions";
import "./index.css";
import { MOVABLE } from "../../engine/components/movable";
import { useHero, useWorld } from "../../bindings/hooks";
import { REFERENCE } from "../../engine/components/reference";
import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { degreesToOrientations, pointToDegree } from "../../game/math/tracing";
import Row, { CellSprite } from "../Row";
import {
  arrow,
  buttonColor,
  charge,
  createButton,
  createCountable,
  createText,
  ghost,
  none,
  quest,
} from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { ACTIONABLE, actions } from "../../engine/components/actionable";
import { normalize, repeat } from "../../game/math/std";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { createSprite, getItemSprite } from "../Entity/utils";
import { getAction } from "../../engine/systems/trigger";
import { SPRITE, Sprite } from "../../engine/components/sprite";
import { LOCKABLE } from "../../engine/components/lockable";
import { ITEM, Item } from "../../engine/components/item";
import {
  canAcceptQuest,
  canTrade,
  canUnlock,
  isTradable,
} from "../../engine/systems/action";
import { TRADABLE } from "../../engine/components/tradable";
import { Entity } from "ecs";
import { World } from "../../engine";
import { canRevive } from "../../engine/systems/fate";
import { isDead } from "../../engine/systems/damage";
import Joystick from "../Joystick";
import { canCast } from "../../engine/systems/magic";

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

const getActiveActivations = (item: Item) => {
  if (!item.active) return [none, none, none];

  if (item.active === "bow") return [none, arrow, none];
  else if (item.active === "slash" || item.active === "block")
    return [none, charge, none];
  else if (item.active.endsWith("1"))
    return [...createCountable({ mp: 1 }, "mp"), none];
  else if (item.active.endsWith("2"))
    return [...createCountable({ mp: 2 }, "mp"), none];

  return [none, none, none];
};

const getActivationRow = (item?: Item) => {
  if (!item) return repeat(none, 3);

  if (item.stat)
    return createCountable(
      { [item.stat]: item.amount },
      item.stat,
      "countable"
    );

  const sprite: CellSprite = { ...getItemSprite(item) };

  if (item.stackable) {
    sprite.stackableAmount = item.amount;
  }

  return [none, sprite, none];
};

const buttonWidth = 6;
const inventoryWidth = 10;

type Action = {
  name: string;
  activation: [Sprite[], Sprite[]];
  disabled: boolean;
};

const useAction = (
  action: (typeof actions)[number],
  isDisabled: (world: World, hero: Entity, actionEntity: Entity) => boolean,
  getName: (actionEntity: Entity) => string,
  getActivation: (actionEntity: Entity) => [Sprite[], Sprite[]]
) => {
  const { ecs, paused } = useWorld();
  const heroEntity = useHero();
  const actionId = heroEntity?.[ACTIONABLE]?.[action];
  const actionEntity = ecs?.getEntityById(actionId);

  return useMemo<Action | undefined>(() => {
    if (paused || !ecs || !heroEntity || !actionEntity) return;

    const disabled = isDisabled(ecs, heroEntity, actionEntity);
    const activation = getActivation(actionEntity);
    const name = getName(actionEntity);

    return {
      name,
      activation,
      disabled,
    };
  }, [
    paused,
    ecs,
    actionEntity,
    isDisabled,
    heroEntity,
    getName,
    getActivation,
  ]);
};

export default function Controls() {
  const dimensions = useDimensions();
  const { ecs, setPaused } = useWorld();
  const hero = useHero();
  const inventorySize = hero?.[INVENTORY]?.size || 0;
  const heroRef = useRef<Entity>();
  const pressedOrientations = useRef<Orientation[]>([]);
  const touchOrigin = useRef<[number, number] | undefined>(undefined);
  const [joystickOrientations, setJoystickOrientations] = useState<
    Orientation[]
  >([]);
  const [action, setAction] = useState<Action>();
  const [highlight, setHighlight] = useState(8);
  const highlightRef = useRef<NodeJS.Timeout>();
  const actionRef = useRef<Action>();
  const activeRef = useRef<Action>();

  // update ref for listeners to consume
  heroRef.current = hero || undefined;

  const spawnAction = useAction(
    "spawn",
    (world, hero, spawnEntity) => !canRevive(world, spawnEntity, hero),
    () => "Spawn",
    (spawnEntity) => [[none, spawnEntity ? ghost : none, none], repeat(none, 3)]
  );

  const questAction = useAction(
    "quest",
    (world, hero, questEntity) => !canAcceptQuest(world, hero, questEntity),
    () => "Quest",
    (questEntity) => [[none, questEntity ? quest : none, none], repeat(none, 3)]
  );

  const unlockAction = useAction(
    "unlock",
    (world, hero, unlockEntity) => !canUnlock(world, hero, unlockEntity),
    () => "Open",
    (unlockEntity) => [
      [
        none,
        unlockEntity
          ? getItemSprite({
              consume: "key",
              material: unlockEntity[LOCKABLE].material,
            })
          : none,
        none,
      ],
      repeat(none, 3),
    ]
  );

  const tradeAction = useAction(
    "trade",
    (world, hero, tradeEntity) =>
      !isTradable(world, tradeEntity) || !canTrade(world, hero, tradeEntity),
    () => "Trade",
    (tradeEntity) => [
      getActivationRow(tradeEntity && tradeEntity[TRADABLE].activation[0]),
      getActivationRow(tradeEntity && tradeEntity[TRADABLE].activation[1]),
    ]
  );

  const activeAction = useAction(
    "active",
    (world, hero, activeEntity) =>
      activeEntity[ITEM].active !== "bow" &&
      !canCast(world, hero, activeEntity),
    (activeEntity) => activeEntity[SPRITE].name,
    (activeEntity) => [
      [none, activeEntity[SPRITE], none],
      getActiveActivations(activeEntity[ITEM]),
    ]
  );

  const availableActions = [
    spawnAction,
    questAction,
    unlockAction,
    tradeAction,
    activeAction,
  ];
  const selectedAction = availableActions.find((action) => action);

  activeRef.current = selectedAction;

  // rotate button shadow
  useEffect(() => {
    // clear on fading action
    if (highlightRef.current && !selectedAction) {
      clearInterval(highlightRef.current);
      highlightRef.current = undefined;
    }

    if (!selectedAction || selectedAction.disabled) return;

    // reset on new action
    if (!highlightRef.current) {
      setHighlight(8);

      highlightRef.current = setInterval(() => {
        setHighlight((prevHighlight) => normalize(prevHighlight - 1, 14));
      }, 100);
    }
  }, [selectedAction]);

  const handleAction = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();

      const heroEntity = heroRef.current;
      const currentAction = actionRef.current;
      const active = activeRef.current;

      if (currentAction || !heroEntity || !ecs) return;

      const reference = ecs.assertByIdAndComponents(
        heroEntity[MOVABLE].reference,
        [REFERENCE]
      )[REFERENCE];

      if (!reference) return;

      // skip if waiting for cooldown or not actionable
      if (
        heroEntity[ACTIONABLE].triggered ||
        !getAction(ecs, heroEntity) ||
        active?.disabled
      )
        return;

      heroEntity[ACTIONABLE].triggered = true;

      reference.suspensionCounter = reference.suspensionCounter === -1 ? -1 : 1;
      reference.suspended = false;

      if (active) {
        setAction(active);
        actionRef.current = active;
        setTimeout(() => {
          setAction(undefined);
          actionRef.current = undefined;
        }, reference.tick);
      }
    },
    [ecs]
  );

  const handleMove = useCallback(
    (orientations: Orientation[]) => {
      const heroEntity = heroRef.current;
      if (!heroEntity || !ecs || isDead(ecs, heroEntity)) return;

      const reference = ecs.assertByIdAndComponents(
        heroEntity[MOVABLE].reference,
        [REFERENCE]
      )[REFERENCE];

      if (!reference) return;

      heroEntity[MOVABLE].orientations = orientations;
      const pendingOrientation = orientations[0];

      if (pendingOrientation) {
        heroEntity[MOVABLE].pendingOrientation = pendingOrientation;
        heroEntity[ORIENTABLE].facing = pendingOrientation;
      }

      if (orientations.length === 0) {
        reference.suspensionCounter = 0;

        if (
          heroEntity[MOVABLE].pendingOrientation ||
          heroEntity[ACTIONABLE].triggered
        ) {
          reference.suspensionCounter += 1;
        }
      } else {
        reference.suspensionCounter = -1;
        reference.suspended = false;
      }
    },
    [ecs]
  );

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      // handle pause and resume
      if (event.type === "keydown" && event.key === "Escape") {
        setPaused((prevPaused) => !prevPaused);
        return;
      }

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
    [handleMove, handleAction, setPaused]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      // prevent touches over action bar
      if (
        [...event.changedTouches].some((touch) =>
          ["action", "menu", "resume"].includes(
            (touch.target as HTMLElement).id
          )
        )
      )
        return;

      event.preventDefault();

      if (event.touches.length !== 1) {
        touchOrigin.current = undefined;
        pressedOrientations.current = [];
        setJoystickOrientations([]);
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
          setJoystickOrientations(nextOrientations);
          handleMove(nextOrientations);
        }
        pressedOrientations.current = nextOrientations;
      } else {
        pressedOrientations.current = [];
      }

      return false;
    },
    [handleMove, setJoystickOrientations]
  );

  useEffect(() => {
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
  }, [handleKey, handleTouchMove]);

  const pressedButton =
    action && createButton(repeat(none, buttonWidth), buttonWidth, false, true);
  const emptyButton = [repeat(none, buttonWidth), repeat(none, buttonWidth)];
  const actionButton =
    selectedAction &&
    createButton(
      createText(selectedAction.name, buttonColor),
      buttonWidth,
      selectedAction.disabled,
      false,
      highlight
    );
  const button = pressedButton || actionButton || emptyButton;

  const emptyActivation = [repeat(none, 3), repeat(none, 3)];
  const activation =
    action?.activation || selectedAction?.activation || emptyActivation;

  const itemSprites =
    ecs && hero?.[INVENTORY]
      ? (hero[INVENTORY] as Inventory).items.map((itemId) => {
          const inventoryItem = ecs.assertByIdAndComponents(itemId, [ITEM]);
          return {
            ...createSprite(ecs, itemId),
            stackableAmount:
              (inventoryItem[ITEM].stackable || inventoryItem[ITEM].consume) &&
              inventoryItem[ITEM].amount,
          };
        })
      : [];
  const itemRows = [0, 1].map((row) => {
    return Array.from({ length: inventoryWidth }).map(
      (_, columnIndex) =>
        (columnIndex < inventorySize / 2 &&
          itemSprites[row * (inventorySize / 2) + columnIndex]) ||
        none
    );
  });

  return (
    <footer className="Controls">
      <Joystick
        orientations={joystickOrientations}
        origin={touchOrigin.current}
      />
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
