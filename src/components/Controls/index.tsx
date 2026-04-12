import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isTouch, useDimensions } from "../Dimensions";
import "./index.css";
import { MOVABLE } from "../../engine/components/movable";
import { useHero, useViewpoint, useWorld } from "../../bindings/hooks";
import { REFERENCE } from "../../engine/components/reference";
import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { degreesToOrientations, pointToDegree } from "../../game/math/tracing";
import Row from "../Row";
import {
  createButton,
  createCountable,
  createText,
  getButtonSeparator,
  mana,
  none,
  Palette,
} from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { ACTIONABLE, actions } from "../../engine/components/actionable";
import { normalize, repeat, signedDistance } from "../../game/math/std";
import { SPRITE, Sprite } from "../../engine/components/sprite";
import { ITEM, Item, rechargables } from "../../engine/components/item";
import {
  castablePrimary,
  castableSecondary,
} from "../../engine/systems/action";
import { Entity } from "ecs";
import { World } from "../../engine";
import { isDead } from "../../engine/systems/damage";
import Joystick from "../Joystick";
import { canCast } from "../../engine/systems/magic";
import {
  getTab,
  getTabSelections,
  isInPopup,
  isQuestCompleted,
} from "../../engine/systems/popup";
import { isActionable, isControllable } from "../../engine/systems/freeze";
import { POPUP } from "../../engine/components/popup";
import { TypedEntity } from "../../engine/entities";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { ensureAudio } from "../../game/sound/resumable";
import Cursor from "../Cursor";
import { getItemSprite } from "../../game/assets/utils";
import { centerSprites } from "../../game/assets/pixels";
import { LEVEL } from "../../engine/components/level";
import { menuName } from "../../game/levels/menu";
import { CONDITIONABLE } from "../../engine/components/conditionable";

// allow queueing of next actions 50ms before start of next tick
const queueThreshold = 50;

export const keyToOrientation: Record<KeyboardEvent["key"], Orientation> = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
};

export const primaryKeys = [" "];
export const secondaryKeys = ["Shift"];
export const tabKeys = ["Tab"];
export const inspectKeys = ["i", "b"];
export const mapKeys = ["m"];
export const interactKeys = ["Enter"];
export const closeKeys = ["Escape"];

const getActiveActivations = (world: World, hero: TypedEntity, item: Item) => {
  const itemSprite = getItemSprite(item, "display");

  if (
    item.secondary === "bow" ||
    rechargables.includes(item.secondary as (typeof rechargables)[number])
  ) {
    const ammo = item.secondary === "bow" ? "arrow" : "charge";
    const stackableItem = hero[INVENTORY]?.items
      .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM]))
      .find((item) => item[ITEM].stackable === ammo);
    const stackableSprite = getItemSprite({ stackable: ammo });

    return [
      ...repeat(none, 2),
      itemSprite,
      ...createText(
        `1/${stackableItem ? stackableItem[ITEM].amount : 0}`,
        colors.grey
      ),
      stackableSprite,
    ].slice(-6);
  } else if (item.secondary === "axe") {
    if (!hero[CONDITIONABLE]?.axe) {
      return centerSprites([itemSprite], 6);
    }
    const swordEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.sword,
      [SPRITE]
    );
    return centerSprites([swordEntity?.[SPRITE] || none], 6);
  } else if (item.primary) {
    const amount = item.primary.endsWith("2") ? 2 : 1;
    return [
      ...repeat(none, 2),
      itemSprite,
      ...createText(`${amount}/${hero[STATS]?.mp || 0}`, colors.blue),
      mana,
    ].slice(-6);
  }

  return repeat(none, 6);
};

export const getActivationRow = (item?: Omit<Item, "carrier" | "bound">) => {
  if (!item) return repeat(none, 3);

  if (item.stat)
    return createCountable(
      { [item.stat]: item.amount },
      item.stat,
      "countable"
    );

  return [
    ...createText(item.amount.toString().padStart(2, " "), colors.grey),
    getItemSprite(item),
  ];
};

const buttonWidth = 7;
const inventoryWidth = 8;

type Action = {
  name: string;
  activation: Sprite[];
  disabled: boolean;
  palette: Palette;
};

const useAction = (
  action: (typeof actions)[number],
  isDisabled: (world: World, hero: Entity, actionEntity: Entity) => boolean,
  getName: (world: World, hero: Entity, actionEntity: Entity) => string,
  getActivation: (world: World, hero: Entity, actionEntity: Entity) => Sprite[],
  palette: Palette = "white"
) => {
  const { ecs, paused } = useWorld();
  const heroEntity = useHero();
  const actionId = heroEntity?.[ACTIONABLE]?.[action];
  const actionEntity = ecs?.getEntityById(actionId);

  return useMemo<Action | undefined>(() => {
    if (paused || !ecs || !heroEntity || !actionEntity) return;

    const disabled = isDisabled(ecs, heroEntity, actionEntity);
    const activation = getActivation(ecs, heroEntity, actionEntity);
    const name = getName(ecs, heroEntity, actionEntity);

    return {
      name,
      activation,
      disabled,
      palette,
    };
  }, [
    paused,
    ecs,
    actionEntity,
    isDisabled,
    heroEntity,
    getName,
    getActivation,
    palette,
  ]);
};

const highlightDuration = 100;
const swipeThreshold = 10;

export default function Controls() {
  const dimensions = useDimensions();
  const { ecs, setPaused, paused, initial, flipped } = useWorld();
  const level = ecs?.metadata.gameEntity[LEVEL].name;
  const size = ecs?.metadata.gameEntity[LEVEL].size || 0;
  const interactable = ecs?.metadata.interact.active && ecs.metadata.interact;
  const { position, fraction } = useViewpoint();
  const inMenu = level === menuName;
  const hero = useHero();
  const heroRef = useRef<Entity>();
  const popup =
    ecs &&
    hero &&
    isInPopup(ecs, hero) &&
    ecs.getEntityById(hero[PLAYER].popup);
  const pressedOrientations = useRef<Orientation[]>([]);
  const touchOrigin = useRef<[number, number] | undefined>(undefined);
  const [joystickOrientations, setJoystickOrientations] = useState<
    Orientation[]
  >([]);
  const [primary, setPrimary] = useState<Action>();
  const [secondary, setSecondary] = useState<Action>();
  const [highlight, setHighlight] = useState(0);
  const highlightRef = useRef<NodeJS.Timeout>();
  const actionRef = useRef<Action>();
  const primaryRef = useRef<Action>();
  const secondaryRef = useRef<Action>();

  // update ref for listeners to consume
  heroRef.current = hero || undefined;

  const hidden =
    initial || !ecs || !heroRef.current || isDead(ecs, heroRef.current);

  const primaryAction = useAction(
    "primary",
    (world, hero, primaryEntity) =>
      !isControllable(world, hero) ||
      !canCast(world, hero, primaryEntity) ||
      !castablePrimary(
        world,
        hero as TypedEntity<"INVENTORY">,
        primaryEntity as TypedEntity<"ITEM">
      ),
    (_, __, primaryEntity) => primaryEntity[SPRITE].name.toUpperCase(),
    (world, _, primaryEntity) =>
      hero
        ? getActiveActivations(world, hero, primaryEntity[ITEM])
        : repeat(none, 6),
    "silver"
  );

  const secondaryAction = useAction(
    "secondary",
    (world, hero, secondaryEntity) =>
      !isControllable(world, hero) ||
      !castableSecondary(
        world,
        hero as TypedEntity<"INVENTORY">,
        secondaryEntity as TypedEntity<"ITEM">
      ),

    (world, hero, secondaryEntity) => {
      const swordEntity = world.getEntityByIdAndComponents(
        hero[EQUIPPABLE]?.sword,
        [SPRITE]
      );
      if (hero[CONDITIONABLE]?.axe) {
        return (swordEntity?.[SPRITE].name || "Stow").toUpperCase();
      }

      return secondaryEntity[SPRITE].name.toUpperCase();
    },
    (world, _, secondaryEntity) =>
      hero
        ? getActiveActivations(world, hero, secondaryEntity[ITEM])
        : repeat(none, 6),
    "silver"
  );

  primaryRef.current = primaryAction;
  secondaryRef.current = secondaryAction;

  // rotate button shadow
  useEffect(() => {
    // clear on fading action
    if (highlightRef.current && !primaryAction && !secondaryAction) {
      clearInterval(highlightRef.current);
      highlightRef.current = undefined;
    }

    if (
      (!primaryAction || primaryAction.disabled) &&
      (!secondaryAction || secondaryAction.disabled)
    )
      return;

    // reset on new action
    if (!highlightRef.current) {
      setHighlight(0);

      highlightRef.current = setInterval(() => {
        setHighlight((prevHighlight) =>
          normalize(prevHighlight + 1, highlightDuration)
        );
      }, 100);
    }
  }, [primaryAction, secondaryAction]);

  const handleAction = useCallback(
    (
      action:
        | "primary"
        | "secondary"
        | "interact"
        | "inspect"
        | "map"
        | "close"
        | "left"
        | "right"
        | "tab"
        | "backtab",
      index?: number
    ) => {
      const heroEntity = heroRef.current;
      const currentAction = actionRef.current;
      const active =
        action === "primary"
          ? primaryRef.current
          : action === "secondary"
          ? secondaryRef.current
          : undefined;

      // allow action while moving but not in popup
      if (
        currentAction ||
        !heroEntity ||
        !ecs ||
        paused ||
        (pressedOrientations.current.length > 0 &&
          isInPopup(ecs, heroEntity)) ||
        (!isActionable(ecs, heroEntity) && !isDead(ecs, heroEntity))
      )
        return;

      const reference = ecs.assertByIdAndComponents(
        heroEntity[MOVABLE].reference,
        [REFERENCE]
      )[REFERENCE];

      if (!reference) return;

      // skip if already triggered
      if (
        heroEntity[ACTIONABLE].primaryTriggered ||
        heroEntity[ACTIONABLE].secondaryTriggered ||
        heroEntity[PLAYER].actionTriggered
      )
        return;

      if (action === "primary") {
        heroEntity[ACTIONABLE].primaryTriggered = true;
      } else if (action === "secondary") {
        heroEntity[ACTIONABLE].secondaryTriggered = true;
      } else {
        heroEntity[PLAYER].actionTriggered = action;

        if (index !== undefined && action === "tab") {
          heroEntity[PLAYER].tabTriggered = index;
        }
      }

      reference.suspensionCounter =
        reference.suspensionCounter === -1
          ? -1
          : reference.suspensionCounter + 1;
      reference.suspended = false;

      if (active && !active.disabled) {
        if (action === "primary") {
          setPrimary(active);
        } else if (action === "secondary") {
          setSecondary(active);
        }
        actionRef.current = active;
        setTimeout(() => {
          if (action === "primary") {
            setPrimary(undefined);
          } else if (action === "secondary") {
            setSecondary(undefined);
          }
          actionRef.current = undefined;
        }, reference.tick);
      }
    },
    [ecs, paused]
  );

  const handlePrimary = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("primary");
    },
    [handleAction]
  );

  const handleSecondary = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("secondary");
    },
    [handleAction]
  );

  const handleInteract = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("interact");
    },
    [handleAction]
  );

  const handleMap = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      if (inMenu || !ecs || !hero || !isActionable(ecs, hero)) return;

      handleAction("map");
    },
    [handleAction, inMenu, ecs, hero]
  );

  const handleInspect = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      if (inMenu || !ecs || !hero || !isActionable(ecs, hero)) return;

      handleAction("inspect");
    },
    [handleAction, inMenu, ecs, hero]
  );

  const handleClose = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("close");
    },
    [handleAction]
  );

  const handleTab = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>,
      back = false
    ) => {
      event.preventDefault();
      if (back) {
        handleAction("backtab");
        return;
      }
      const tab = (event.target as HTMLElement)?.dataset.tab;
      handleAction("tab", tab ? parseInt(tab) : undefined);
    },
    [handleAction]
  );

  const handleLeft = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("left");
    },
    [handleAction]
  );

  const handleRight = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("right");
    },
    [handleAction]
  );

  const handleMove = useCallback(
    (orientations: Orientation[]) => {
      const heroEntity = heroRef.current;

      if (
        !heroEntity ||
        !heroEntity[MOVABLE] ||
        !ecs ||
        isDead(ecs, heroEntity)
      )
        return;

      const reference = ecs.assertByIdAndComponents(
        heroEntity[MOVABLE].reference,
        [REFERENCE]
      )[REFERENCE];

      if (!reference) return;

      const attemptedOrientations = orientations;
      heroEntity[MOVABLE].orientations = attemptedOrientations;
      const pendingOrientation = attemptedOrientations[0];

      if (pendingOrientation) {
        heroEntity[MOVABLE].pendingOrientation = pendingOrientation;
      }

      if (attemptedOrientations.length === 0 && !heroEntity[MOVABLE].momentum) {
        reference.suspensionCounter = 0;

        // only allow queueing actions in short moment at end of frame
        const remaining = reference.tick - reference.delta;

        if (
          (remaining < queueThreshold &&
            heroEntity[MOVABLE].pendingOrientation) ||
          heroEntity[ACTIONABLE].primaryTriggered ||
          heroEntity[ACTIONABLE].secondaryTriggered ||
          heroEntity[PLAYER].actionTriggered
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
      if (event.type === "keydown" && closeKeys.includes(event.key)) {
        if (!popup && !initial) {
          // handle pause and resume
          setPaused((prevPaused) => !prevPaused);
          return;
        }
      } else if (event.type === "keydown" && !document.body.style.cursor) {
        // hide cursor
        document.body.classList.add("no-cursor");
      }

      if (!paused) {
        ensureAudio();
      }

      // since macOS doesn't fire keyup when meta key is pressed, prevent it from moving.
      // still not working: arrow keydown -> meta keydown -> arrow keyup -> meta keyup
      // also prevent repeat events
      if (
        event.type === "keydown" &&
        (event.altKey || event.metaKey || event.repeat)
      )
        return;

      if (primaryKeys.includes(event.key) && event.type === "keydown") {
        handlePrimary(event);
        return;
      } else if (
        secondaryKeys.includes(event.key) &&
        event.type === "keydown"
      ) {
        handleSecondary(event);
        return;
      } else if (interactKeys.includes(event.key) && event.type === "keydown") {
        if (popup) {
          handleRight(event);
        } else {
          handleInteract(event);
        }
        return;
      } else if (mapKeys.includes(event.key) && event.type === "keydown") {
        handleMap(event);
        return;
      } else if (inspectKeys.includes(event.key) && event.type === "keydown") {
        handleInspect(event);
        return;
      } else if (tabKeys.includes(event.key) && event.type === "keydown") {
        if (popup) {
          handleTab(event, event.shiftKey);
        } else {
          handleInspect(event);
        }
        return;
      } else if (closeKeys.includes(event.key) && event.type === "keydown") {
        if (popup) {
          const selections = getTabSelections(ecs, popup);
          const tab = getTab(ecs, popup);
          if (
            ecs &&
            hero &&
            (selections.length === 0 ||
              (selections.length <= 1 &&
                (tab === "style" || tab === "class")) ||
              (selections.length === 2 && isQuestCompleted(ecs, hero, popup)))
          ) {
            handleClose(event);
          } else {
            handleLeft(event);
          }
        }
        return;
      }

      const orientation = keyToOrientation[event.key];

      if (!orientation) return;

      const orientations = [...pressedOrientations.current];

      if (event.type === "keydown" && !orientations.includes(orientation)) {
        orientations.unshift(orientation);
      } else if (event.type === "keyup") {
        orientations.splice(orientations.indexOf(orientation), 1);
      }

      pressedOrientations.current = orientations;
      handleMove(orientations);
    },
    [
      ecs,
      hero,
      initial,
      handleMove,
      setPaused,
      handlePrimary,
      handleSecondary,
      handleInteract,
      handleInspect,
      handleTab,
      handleMap,
      handleLeft,
      handleRight,
      handleClose,
      paused,
      popup,
    ]
  );

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (document.body.classList.contains("no-cursor")) {
      document.body.classList.remove("no-cursor");
    }
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!paused) {
        ensureAudio();
      }

      // prevent touches over action bar
      if (
        ![...event.changedTouches].some((touch) =>
          [
            "primary",
            "secondary",
            "menu",
            "resume",
            "interact",
            "inspect",
            "survey",
            "close",
            "tab-0",
            "tab-1",
            "tab-2",
            "left",
            "right",
            "stats",
          ].includes(
            (touch.target as HTMLElement).id ||
              (touch.target as HTMLElement).parentElement?.id!
          )
        )
      ) {
        event.preventDefault();
      }

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

      if (Math.sqrt(deltaX ** 2 + deltaY ** 2) <= swipeThreshold) {
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
    [handleMove, setJoystickOrientations, paused]
  );

  const handleVisibility = useCallback(() => {
    if (document.hidden) {
      setPaused(true);
    }
  }, [setPaused]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);

    window.addEventListener("touchstart", handleTouchMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchMove);
    window.addEventListener("touchcancel", handleTouchMove);

    window.addEventListener("mousemove", handleMouseMove);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);

      window.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchMove);
      window.removeEventListener("touchcancel", handleTouchMove);

      window.removeEventListener("mousemove", handleMouseMove);

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [handleKey, handleMouseMove, handleTouchMove, handleVisibility]);

  const emptyPrimary = createButton(
    isTouch ? "SPELL" : "SPACE",
    buttonWidth,
    true,
    false,
    false,
    "white"
  );
  const primaryHighlighted = highlight === 0 || highlight === 1;
  const primaryButton =
    primaryAction &&
    createButton(
      primaryAction.name,
      buttonWidth,
      primaryAction.disabled,
      false,
      primaryHighlighted,
      primaryAction.palette
    );
  const rightButton = primaryButton || emptyPrimary;
  const emptySecondary = createButton(
    isTouch ? "SKILL" : "SHIFT",
    buttonWidth,
    true,
    false,
    false,
    "white"
  );
  const secondaryHighlighted = highlight === 4 || highlight === 5;
  const secondaryButton =
    secondaryAction &&
    createButton(
      secondaryAction.name,
      buttonWidth,
      !secondary && secondaryAction.disabled,
      !!secondary,
      !secondary && secondaryHighlighted,
      secondaryAction.palette
    );
  const leftButton = secondaryButton || emptySecondary;

  const emptyActivation = repeat(none, 6);
  const primaryActivation =
    primary?.activation || primaryAction?.activation || emptyActivation;
  const secondaryActivation =
    secondary?.activation || secondaryAction?.activation || emptyActivation;

  const equipments = ecs
    ? (["compass"] as const)
        .filter((equipment) => hero?.[EQUIPPABLE]?.[equipment])
        .map((equipment) => {
          const equipmentEntity = ecs.assertByIdAndComponents(
            hero?.[EQUIPPABLE]?.[equipment],
            [ITEM]
          );
          const equipmentSprite = getItemSprite(
            equipmentEntity[ITEM],
            "display",
            equipment === "compass"
              ? equipmentEntity[ORIENTABLE]?.facing
              : undefined
          );
          return flipped
            ? [
                ...repeat(
                  none,
                  inventoryWidth - equipmentSprite.name.length - 1
                ),
                ...createText(equipmentSprite.name, colors.grey),
                equipmentSprite,
              ]
            : [
                equipmentSprite,
                ...createText(equipmentSprite.name, colors.grey),
                ...repeat(
                  none,
                  inventoryWidth - equipmentSprite.name.length - 1
                ),
              ];
        })
    : [];

  const equipmentRows = [
    ...equipments,
    ...repeat(repeat(none, inventoryWidth), 3 - equipments.length),
  ];

  return (
    <footer className={flipped ? "ControlsFlipped" : "Controls"}>
      <Joystick
        orientations={joystickOrientations}
        origin={touchOrigin.current}
      />
      <Cursor />
      <Row
        cells={[
          ...repeat(none, dimensions.padding + dimensions.visibleColumns),
        ]}
      />
      <Row
        cells={createText(
          "─".repeat(dimensions.visibleColumns + dimensions.padding * 2 + 1),
          colors.grey
        )}
      />
      {Array.from({ length: dimensions.hudRows - 4 }).map((_, index) => (
        <Row key={index} />
      ))}
      {hidden ? (
        <>
          <Row />
          <Row />
          <Row />
        </>
      ) : (
        <>
          <Row
            cells={
              flipped
                ? [
                    ...equipmentRows[0],
                    ...rightButton.slice(0, -1),
                    getButtonSeparator(
                      primaryAction?.palette || "white",
                      !primaryAction || primaryAction.disabled,
                      primaryHighlighted,
                      !!primary,
                      secondaryAction?.palette || "white",
                      !secondaryAction || secondaryAction.disabled,
                      secondaryHighlighted,
                      !!secondary
                    ),
                    ...leftButton.slice(1),
                  ]
                : [
                    ...leftButton.slice(0, -1),
                    getButtonSeparator(
                      secondaryAction?.palette || "white",
                      !secondaryAction || secondaryAction.disabled,
                      secondaryHighlighted,
                      !!secondary,
                      primaryAction?.palette || "white",
                      !primaryAction || primaryAction.disabled,
                      primaryHighlighted,
                      !!primary
                    ),
                    ...rightButton.slice(1),
                    ...equipmentRows[0],
                  ]
            }
          />
          <Row
            cells={
              flipped
                ? [
                    ...equipmentRows[1],
                    none,
                    ...primaryActivation,
                    ...secondaryActivation,
                  ]
                : [
                    ...secondaryActivation,
                    ...primaryActivation,
                    none,
                    ...equipmentRows[1],
                  ]
            }
          />
          <Row
            cells={
              flipped
                ? [...equipmentRows[2], ...repeat(none, 13)]
                : [...repeat(none, 13), ...equipmentRows[2]]
            }
          />
        </>
      )}
      <div className="Secondary" id="secondary" onClick={handleSecondary} />
      <div className="Primary" id="primary" onClick={handlePrimary} />
      {interactable && (
        <div
          className="Interact"
          id="interact"
          onClick={handleInteract}
          style={
            {
              "--interact-x":
                signedDistance(position.x, interactable.position.x, size) -
                fraction.x,
              "--interact-y":
                signedDistance(position.y, interactable.position.y, size) -
                fraction.y,
              "--interact-width": interactable.size.x,
              "--interact-height": interactable.size.y,
            } as React.CSSProperties
          }
        />
      )}
      {Array.from({ length: popup?.[POPUP].tabs.length || 0 }).map(
        (_, index) => (
          <div
            key={index}
            className="PopupTab"
            id={`tab-${index}`}
            onClick={handleTab}
            data-tab={index}
            style={{ "--popup-tab": index } as React.CSSProperties}
          />
        )
      )}
      {popup && (
        <>
          <div className="PopupClose" id="close" onClick={handleClose} />
          <div className="PopupLeft" id="left" onClick={handleLeft} />
          <div className="PopupRight" id="right" onClick={handleRight} />
        </>
      )}
    </footer>
  );
}
