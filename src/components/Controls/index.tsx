import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isTouch, useDimensions } from "../Dimensions";
import "./index.css";
import { MOVABLE } from "../../engine/components/movable";
import { useHero, useWorld } from "../../bindings/hooks";
import { REFERENCE } from "../../engine/components/reference";
import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { degreesToOrientations, pointToDegree } from "../../game/math/tracing";
import Row from "../Row";
import {
  createButton,
  createCountable,
  createText,
  ghost,
  mana,
  mergeSprites,
  none,
  Palette,
  portal,
  quest,
} from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { ACTIONABLE, actions } from "../../engine/components/actionable";
import { normalize, repeat } from "../../game/math/std";
import { getSegments } from "../Entity/utils";
import { SPRITE, Sprite } from "../../engine/components/sprite";
import { LOCKABLE } from "../../engine/components/lockable";
import { ITEM, Item } from "../../engine/components/item";
import {
  canAcceptQuest,
  canUnlock,
  castablePrimary,
  castableSecondary,
} from "../../engine/systems/action";
import { Entity } from "ecs";
import { World } from "../../engine";
import { canRevive } from "../../engine/systems/fate";
import { isDead } from "../../engine/systems/damage";
import Joystick from "../Joystick";
import { canCast } from "../../engine/systems/magic";
import {
  canForge,
  canTrade,
  getDeal,
  getTab,
  getTabSelections,
  getVerticalIndex,
  isInPopup,
  isPopupAvailable,
  isQuestCompleted,
  popupActions,
  popupIdles,
} from "../../engine/systems/popup";
import { isControllable } from "../../engine/systems/freeze";
import { Deal, POPUP } from "../../engine/components/popup";
import { TypedEntity } from "../../engine/entities";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { STATS } from "../../engine/components/stats";
import { getConsumption } from "../../engine/systems/consume";
import { PLAYER } from "../../engine/components/player";
import { ensureAudio } from "../../game/sound/resumable";
import Cursor from "../Cursor";
import { getItemSprite } from "../../game/assets/utils";
import { canWarp } from "../../engine/systems/trigger";
import { getForgeStatus } from "../../game/balancing/forging";
import { centerSprites } from "../../game/assets/pixels";
import { LEVEL } from "../../engine/components/level";
import { menuName } from "../../game/levels/menu";

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
export const inspectKeys = ["Tab"];

const getActiveActivations = (world: World, hero: TypedEntity, item: Item) => {
  const itemSprite = getItemSprite(item, "display");

  if (item.secondary) {
    const stackable = item.secondary === "bow" ? "arrow" : "charge";
    const stackableItem = hero[INVENTORY]?.items
      .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM]))
      .find((item) => item[ITEM].stackable === stackable);
    const stackableSprite = getItemSprite({ stackable });

    return [
      ...repeat(none, 2),
      itemSprite,
      ...createText(
        `1/${stackableItem ? stackableItem[ITEM].amount : 0}`,
        colors.grey
      ),
      stackableSprite,
    ].slice(-6);
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

const buttonWidth = 6;
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

export default function Controls() {
  const dimensions = useDimensions();
  const { ecs, setPaused, paused, initial, flipped } = useWorld();
  const level = ecs?.metadata.gameEntity[LEVEL].name;
  const inMenu = level === menuName;
  const hero = useHero();
  const heroRef = useRef<Entity>();
  const pressedOrientations = useRef<Orientation[]>([]);
  const touchOrigin = useRef<[number, number] | undefined>(undefined);
  const [joystickOrientations, setJoystickOrientations] = useState<
    Orientation[]
  >([]);
  const [primary, setPrimary] = useState<Action>();
  const [secondary, setSecondary] = useState<Action>();
  const [highlight, setHighlight] = useState(8);
  const highlightRef = useRef<NodeJS.Timeout>();
  const actionRef = useRef<Action>();
  const primaryRef = useRef<Action>();
  const secondaryRef = useRef<Action>();

  // update ref for listeners to consume
  heroRef.current = hero || undefined;

  const warpAction = useAction(
    "warp",
    (world, hero, warpEntity) =>
      !isControllable(world, hero) || !canWarp(world, hero, warpEntity),
    (world, hero) => (isInPopup(world, hero) ? "GO!" : "WARP"),
    (_, __, warpEntity) => [
      ...repeat(none, 2),
      warpEntity ? portal : none,
      ...repeat(none, 3),
    ],
    "lime"
  );

  const spawnAction = useAction(
    "spawn",
    (world, hero, spawnEntity) => !canRevive(world, spawnEntity, hero),
    () => "SPAWN",
    (_, __, spawnEntity) => [
      ...repeat(none, 2),
      spawnEntity ? ghost : none,
      ...repeat(none, 3),
    ],
    "lime"
  );

  const questAction = useAction(
    "quest",
    (world, hero, questEntity) =>
      !isControllable(world, hero) || !canAcceptQuest(world, hero, questEntity),
    () => "START",
    (_, __, questEntity) => [
      ...repeat(none, 2),
      questEntity ? quest : none,
      ...repeat(none, 3),
    ],
    "lime"
  );

  const unlockAction = useAction(
    "unlock",
    (world, hero, unlockEntity) =>
      !isControllable(world, hero) || !canUnlock(world, hero, unlockEntity),
    () => "OPEN",
    (_, __, unlockEntity) =>
      unlockEntity
        ? [
            ...repeat(none, 2),
            getItemSprite(
              {
                materialized: unlockEntity[LOCKABLE].type,
                material: unlockEntity[LOCKABLE].material,
              },
              "display"
            ),
            unlockEntity[LOCKABLE].material === "wood"
              ? none
              : getItemSprite({
                  consume: "key",
                  material: unlockEntity[LOCKABLE].material,
                }),
            ...repeat(none, 2),
          ]
        : repeat(none, 6),
    "lime"
  );

  const popupAction = useAction(
    "popup",
    (world, hero, popupEntity) =>
      !isControllable(world, hero) ||
      isInPopup(world, hero) ||
      !isPopupAvailable(world, popupEntity),
    (world, _, popupEntity) =>
      popupEntity[POPUP] ? popupActions[getTab(world, popupEntity)] : "",
    (world, _, popupEntity) =>
      popupEntity[POPUP]
        ? [
            ...repeat(none, 2),
            mergeSprites(
              ...getSegments(world, popupEntity, {
                isTransparent: false,
                receiveShadow: false,
              }).map((segment) => segment.sprite)
            ),
            popupIdles[getTab(world, popupEntity)] || none,
            ...repeat(none, 2),
          ]
        : repeat(none, 6),
    "lime"
  );

  const claimAction = useAction(
    "claim",
    (world, hero, claimEntity) =>
      !isControllable(world, hero) ||
      !isQuestCompleted(world, hero, claimEntity),
    () => "CLAIM",
    (_, __, claimEntity) =>
      [
        ...repeat(none, 2),
        ...claimEntity[POPUP].deals
          .map((deal: Deal) => getActivationRow(deal.item))
          .flat(),
        ...repeat(none, 4),
      ]
        .slice(claimEntity[POPUP].deals.length)
        .slice(0, 6),
    "lime"
  );

  const tradeAction = useAction(
    "trade",
    (world, hero, tradeEntity) =>
      !isControllable(world, hero) || !canTrade(world, hero, tradeEntity),
    (world, _, tradeEntity) => getTab(world, tradeEntity).toUpperCase(),
    (world, hero, tradeEntity) => {
      const deal = hero && getDeal(world, hero, tradeEntity);
      return deal && canTrade(world, hero, tradeEntity)
        ? [
            ...repeat(none, 2),
            ...getActivationRow(deal.item),
            ...repeat(none, 4),
          ].slice(1, 6)
        : repeat(none, 6);
    },
    "lime"
  );

  const addAction = useAction(
    "add",
    (world, hero, addEntity) => {
      const tab = getTab(world, addEntity);
      const verticalIndex = getVerticalIndex(world, addEntity);
      return (
        !isControllable(world, hero) ||
        (tab === "forge" && !canForge(world, hero, addEntity)) ||
        (tab === "class" && verticalIndex !== 0)
      );
    },
    (world, _, addEntity) => {
      const tab = getTab(world, addEntity);
      return tab === "class"
        ? "PICK"
        : tab === "forge"
        ? getTabSelections(world, addEntity).length === 0
          ? "BASE"
          : "ADD"
        : "VIEW";
    },
    (world, hero, addEntity) => {
      const tab = getTab(world, addEntity);
      const [firstIndex, secondIndex] = getTabSelections(world, addEntity);
      const verticalIndex = getVerticalIndex(world, addEntity);

      if (tab === "forge") {
        const { baseItem, addItem, forgeable } = getForgeStatus(
          world,
          hero,
          firstIndex,
          secondIndex,
          verticalIndex
        );
        const nextItem = addItem || baseItem;

        if (forgeable && nextItem) {
          return centerSprites(
            [
              ...createText(nextItem.amount.toString()),
              getItemSprite(nextItem),
            ],
            6
          );
        }
      } else if (tab === "craft") {
        const recipe = addEntity[POPUP].recipes[verticalIndex];
        return centerSprites(
          [
            ...createText(recipe.item.amount.toString()),
            getItemSprite(recipe.item),
          ],
          6
        );
      }

      return repeat(none, 6);
    },
    "lime"
  );

  const useItemAction = useAction(
    "use",
    (world, hero, useEntity) =>
      !isControllable(world, hero) || !getConsumption(world, hero, useEntity),
    (world, hero, useEntity) =>
      getConsumption(world, hero, useEntity) ? "EAT" : "USE",
    (world, _, useEntity) => {
      const consumption = hero && getConsumption(world, hero, useEntity);
      if (!consumption) return repeat(none, 6);

      const countable = createCountable(
        { [consumption.countable]: consumption.amount },
        consumption.countable
      );

      return [
        ...repeat(none, countable.length > 2 ? 0 : 1),
        getItemSprite(consumption.item[ITEM]),
        none,
        ...countable,
        ...repeat(none, 2),
      ].slice(0, 6);
    },
    "lime"
  );

  const closeAction = useAction(
    "close",
    (world, hero) => !isControllable(world, hero),
    (world, _, closeEntity) =>
      getTabSelections(world, closeEntity).length > 0 ? "BACK" : "CLOSE",
    () => repeat(none, 6),
    "red"
  );

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
        : repeat(none, 6)
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

    (_, __, secondaryEntity) => secondaryEntity[SPRITE].name.toUpperCase(),
    (world, _, secondaryEntity) =>
      hero
        ? getActiveActivations(world, hero, secondaryEntity[ITEM])
        : repeat(none, 6),
    "silver"
  );

  const availablePrimary = [
    warpAction,
    spawnAction,
    questAction,
    unlockAction,
    popupAction,
    claimAction,
    tradeAction,
    useItemAction,
    addAction,
    primaryAction,
  ];
  const selectedPrimary = availablePrimary.find((action) => action);
  primaryRef.current = selectedPrimary;

  const availableSecondary = [closeAction, secondaryAction];
  const selectedSecondary = availableSecondary.find((action) => action);
  secondaryRef.current = selectedSecondary;

  // rotate button shadow
  useEffect(() => {
    // clear on fading action
    if (highlightRef.current && !selectedPrimary && !selectedSecondary) {
      clearInterval(highlightRef.current);
      highlightRef.current = undefined;
    }

    if (
      (!selectedPrimary || selectedPrimary.disabled) &&
      (!selectedSecondary || selectedSecondary.disabled)
    )
      return;

    // reset on new action
    if (!highlightRef.current) {
      setHighlight(8);

      highlightRef.current = setInterval(() => {
        setHighlight((prevHighlight) => normalize(prevHighlight - 1, 12));
      }, 100);
    }
  }, [selectedPrimary, selectedSecondary]);

  const handleAction = useCallback(
    (action: "primary" | "secondary" | "inspect") => {
      const heroEntity = heroRef.current;
      const currentAction = actionRef.current;
      const active =
        action === "primary"
          ? primaryRef.current
          : action === "secondary"
          ? secondaryRef.current
          : undefined;

      if (
        currentAction ||
        !heroEntity ||
        !ecs ||
        paused ||
        (!isControllable(ecs, heroEntity) && !isDead(ecs, heroEntity))
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
        heroEntity[PLAYER].inspectTriggered
      )
        return;

      if (action === "inspect") {
        heroEntity[PLAYER].inspectTriggered = true;
      } else {
        heroEntity[ACTIONABLE][
          action === "primary" ? "primaryTriggered" : "secondaryTriggered"
        ] = true;
      }

      reference.suspensionCounter = reference.suspensionCounter === -1 ? -1 : 1;
      reference.suspended = false;

      if (active && !active.disabled) {
        if (action === "primary") {
          setPrimary(active);
        } else {
          setSecondary(active);
        }
        actionRef.current = active;
        setTimeout(() => {
          if (action === "primary") {
            setPrimary(undefined);
          } else {
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

  const handleInspect = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      if (!inMenu) {
        handleAction("inspect");
      }
    },
    [handleAction, inMenu]
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

      const attemptedOrientations = isControllable(ecs, heroEntity)
        ? orientations
        : [];
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
          heroEntity[ACTIONABLE].secondaryTriggered
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
      if (event.type === "keydown" && event.key === "Escape" && !initial) {
        // handle pause and resume
        setPaused((prevPaused) => !prevPaused);
        return;
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
      } else if (inspectKeys.includes(event.key) && event.type === "keydown") {
        handleInspect(event);
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
      handleMove,
      setPaused,
      handlePrimary,
      handleSecondary,
      handleInspect,
      paused,
      initial,
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
        [...event.changedTouches].some((touch) =>
          ["primary", "secondary", "menu", "resume", "inspect"].includes(
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
    true
  );
  const pressedPrimary =
    primary && createButton("", buttonWidth, false, true, 0, primary.palette);
  const primaryButton =
    selectedPrimary &&
    createButton(
      selectedPrimary.name,
      buttonWidth,
      selectedPrimary.disabled,
      false,
      highlight,
      selectedPrimary.palette
    );
  const rightButton = pressedPrimary || primaryButton || emptyPrimary;
  const emptySecondary = createButton(
    isTouch ? "ITEM" : "SHIFT",
    buttonWidth,
    true
  );
  const pressedSecondary =
    secondary &&
    createButton("", buttonWidth, false, true, 0, secondary.palette);
  const secondaryButton =
    selectedSecondary &&
    createButton(
      selectedSecondary.name,
      buttonWidth,
      selectedSecondary.disabled,
      false,
      (highlight + 3) % 12,
      selectedSecondary.palette
    );
  const leftButton = pressedSecondary || secondaryButton || emptySecondary;

  const emptyActivation = repeat(none, 6);
  const primaryActivation =
    primary?.activation || selectedPrimary?.activation || emptyActivation;
  const secondaryActivation =
    secondary?.activation || selectedSecondary?.activation || emptyActivation;

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
          return [
            equipmentSprite,
            ...createText(equipmentSprite.name, colors.grey),
            ...repeat(none, inventoryWidth - equipmentSprite.name.length - 1),
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
      {initial ? (
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
                    none,
                    ...rightButton[0],
                    ...leftButton[0],
                  ]
                : [
                    ...leftButton[0],
                    ...rightButton[0],
                    none,
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
                    ...rightButton[1],
                    ...leftButton[1],
                  ]
                : [
                    ...leftButton[1],
                    ...rightButton[1],
                    none,
                    ...equipmentRows[1],
                  ]
            }
          />
          <Row
            cells={
              flipped
                ? [
                    ...equipmentRows[2],
                    none,
                    ...primaryActivation,
                    ...secondaryActivation,
                  ]
                : [
                    ...secondaryActivation,
                    ...primaryActivation,
                    none,
                    ...equipmentRows[2],
                  ]
            }
          />
        </>
      )}
      <div className="Secondary" id="secondary" onClick={handleSecondary} />
      <div className="Primary" id="primary" onClick={handlePrimary} />
    </footer>
  );
}
