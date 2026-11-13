import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isTouch, useDimensions } from "../Dimensions";
import "./index.css";
import { MOVABLE } from "../../engine/components/movable";
import { useHero, useViewpoint, useWorld } from "../../bindings/hooks";
import { REFERENCE } from "../../engine/components/reference";
import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { degreesToOrientations, pointToDegree } from "../../game/math/tracing";
import Row from "../Row";
import {
  mana,
  ninePlusAmmo,
  ninePlusMana,
  none,
} from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { ACTIONABLE, actions } from "../../engine/components/actionable";
import {
  clamp,
  normalize,
  range,
  repeat,
  signedDistance,
} from "../../game/math/std";
import { SPRITE, Sprite } from "../../engine/components/sprite";
import { ITEM, Item, rechargables } from "../../engine/components/item";
import { castableSpell, castableSkill } from "../../engine/systems/action";
import { Entity } from "ecs";
import { World } from "../../engine";
import { isDead } from "../../engine/systems/damage";
import Joystick from "../Joystick";
import { canCast } from "../../engine/systems/magic";
import {
  getTab,
  typeChat,
  completeChat,
  navigateChat,
  getActivePopup,
  getVerticalIndex,
  isInPopup,
} from "../../engine/systems/popup";
import { credits } from "../../game/assets/credits";
import { isActionable, isInteractable } from "../../engine/systems/freeze";
import { POPUP } from "../../engine/components/popup";
import { TypedEntity } from "../../engine/entities";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { ensureAudio } from "../../game/sound/resumable";
import { play } from "../../game/sound";
import Cursor from "../Cursor";
import {
  frameHeight,
  frameWidth,
  getItemSprite,
} from "../../game/assets/utils";
import { centerSprites } from "../../game/assets/pixels";
import { LEVEL } from "../../engine/components/level";
import { menuName } from "../../game/levels/menu";
import {
  Conditionable,
  CONDITIONABLE,
} from "../../engine/components/conditionable";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { getSequence } from "../../engine/systems/sequence";
import { harvestConditions } from "../../game/balancing/harvesting";
import Keyboard, {
  getIndexFromKey,
  keyboardColumns,
  keyboardSize,
} from "../Keyboard";
import { TEST_MODE } from "../../engine/utils";
import {
  createText,
  Palette,
  createButton,
  getButtonSeparator,
} from "../../game/assets/ui";
import { frameColor } from "../Terminal";

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

export const spellKeys = [" "];
export const skillKeys = ["Shift"];
export const equipKeys = ["q", "Q"];
export const tabKeys = ["Tab"];
export const inspectKeys = ["b", "B"];
export const useKeys = ["e", "E"];
export const mapKeys = ["m", "M"];
export const gearKeys = ["g", "G"];
export const statsKeys = ["t", "T"];
export const chatKeys = ["c", "C"];
export const commandKeys = ["/"];
export const backspaceKeys = ["Backspace"];
export const interactKeys = ["Enter"];
export const closeKeys = ["Escape"];
export const historyKeys = ["ArrowUp", "ArrowDown"];
export const hotKeys = range(0, 9).map((key) => key.toString());

const getActionActivations = (
  world: World,
  hero: TypedEntity,
  item: Item,
  alignRight: boolean
) => {
  const itemSprite = getItemSprite(item, "display");
  const hookCondition = hero[CONDITIONABLE]?.hook;

  if (
    item.skill === "bow" ||
    rechargables.includes(item.skill as (typeof rechargables)[number]) ||
    (item.tool === "hook" && !hookCondition)
  ) {
    const ammo =
      item.skill === "bow" ? "arrow" : item.tool === "hook" ? "worm" : "charge";
    const stackableItem = hero[INVENTORY]?.items
      .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM]))
      .find((item) => item[ITEM].stackable === ammo);
    const stackableSprite = getItemSprite({ stackable: ammo });
    const supply = stackableItem ? stackableItem[ITEM].amount : 0;
    const supplySegment =
      supply > 99
        ? [...createText("9", colors.silver), ninePlusAmmo]
        : createText(supply.toString(), colors.silver);

    return [
      ...repeat(none, alignRight ? 2 : 0),
      itemSprite,
      ...createText("1", colors.silver),
      ...createText("/", colors.grey),
      ...supplySegment,
      stackableSprite,
      ...repeat(none, alignRight ? 0 : 2),
    ].slice(alignRight ? -6 : 0, alignRight ? undefined : 6);
  } else if (
    item.tool === "axe" ||
    item.tool === "pickaxe" ||
    item.tool === "shovel"
  ) {
    if (!hero[CONDITIONABLE]?.[harvestConditions[item.tool]]) {
      return centerSprites([itemSprite], 6);
    }
    const weaponEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.weapon,
      [SPRITE]
    );
    return centerSprites([weaponEntity?.[SPRITE] || none], 6);
  } else if (
    item.tool === "hook" &&
    hookCondition &&
    !hookCondition.orientation
  ) {
    const weaponEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.weapon,
      [SPRITE]
    );
    return centerSprites([weaponEntity?.[SPRITE] || none], 6);
  } else if (item.spell) {
    const mp = hero[STATS]?.mp || 0;
    const mpSegment =
      mp > 99
        ? [...createText("9", colors.blue), ninePlusMana]
        : createText(mp.toString(), colors.blue);
    return [
      ...repeat(none, alignRight ? 2 : 0),
      itemSprite,
      ...createText("1", colors.blue),
      ...createText("/", colors.navy),
      ...mpSegment,
      mana,
      ...repeat(none, alignRight ? 0 : 2),
    ].slice(alignRight ? -6 : 0, alignRight ? undefined : 6);
  } else if (item.weapon) {
    const weaponEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.weapon,
      [SPRITE]
    );
    return centerSprites([weaponEntity?.[SPRITE] || none], 6);
  }

  return repeat(none, 6);
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

export default function Controls({
  compact = false,
  children,
}: React.PropsWithChildren<{ compact?: boolean }>) {
  const dimensions = useDimensions();
  const { ecs, setPaused, paused, initial, flipped } = useWorld();
  const level = ecs?.metadata.gameEntity[LEVEL].name;
  const size = ecs?.metadata.gameEntity[LEVEL].size || 0;
  const interactable = ecs?.metadata.interact.active && ecs.metadata.interact;
  const { position, fraction } = useViewpoint();
  const inMenu = !TEST_MODE && level === menuName;
  const hero = useHero();
  const heroRef = useRef<Entity>();
  const pausedRef = useRef(paused);
  const popup =
    ecs &&
    hero &&
    isInPopup(ecs, hero) &&
    ecs.getEntityByIdAndComponents(hero[PLAYER].popup, [POPUP, SEQUENCABLE]);
  const popupTabs =
    ecs && popup && !getSequence(ecs, popup, "popup")?.args.instant
      ? popup[POPUP].tabs.length
      : 0;
  const popupSequence =
    ecs && popup ? getSequence(ecs, popup, "popup") : undefined;
  const popupTab = ecs && popup && getTab(ecs, popup);
  const pressedOrientations = useRef<Orientation[]>([]);
  const pointer = useRef<{
    id: number;
    consumed: boolean;
    scrollbar?: Element;
  }>();
  const touchOrigin = useRef<[number, number]>();
  const [joystickOrientations, setJoystickOrientations] = useState<
    Orientation[]
  >([]);
  const [spell, setSpell] = useState<Action>();
  const [skill, setSkill] = useState<Action>();
  const [highlight, setHighlight] = useState(0);
  const highlightRef = useRef<NodeJS.Timeout>();
  const actionRef = useRef<Action>();
  const spellRef = useRef<Action>();
  const skillRef = useRef<Action>();

  // update ref for listeners to consume
  heroRef.current = hero || undefined;
  pausedRef.current = paused;

  const hidden =
    initial || !ecs || !heroRef.current || isDead(ecs, heroRef.current);

  const spellAction = useAction(
    "spell",
    (world, hero, spellEntity) =>
      !isInteractable(world, hero) ||
      !canCast(world, hero, spellEntity) ||
      !castableSpell(
        world,
        hero as TypedEntity<"INVENTORY">,
        spellEntity as TypedEntity<"ITEM">
      ),
    (_, __, spellEntity) => spellEntity[SPRITE].name.toUpperCase(),
    (world, _, spellEntity) =>
      hero
        ? getActionActivations(world, hero, spellEntity[ITEM], false)
        : repeat(none, 6),
    "silver"
  );

  const skillAction = useAction(
    "skill",
    (world, hero, skillEntity) =>
      !isInteractable(world, hero) ||
      !castableSkill(
        world,
        hero as TypedEntity<"INVENTORY" | "POSITION">,
        skillEntity as TypedEntity<"ITEM">
      ),

    (_, __, skillEntity) => skillEntity[SPRITE].name.toUpperCase(),
    (world, _, skillEntity) =>
      hero
        ? getActionActivations(world, hero, skillEntity[ITEM], true)
        : repeat(none, 6),
    "silver"
  );

  const toolAction = useAction(
    "tool",
    (world, hero, toolEntity) =>
      !isInteractable(world, hero) ||
      !castableSkill(
        world,
        hero as TypedEntity<"INVENTORY" | "POSITION">,
        toolEntity as TypedEntity<"ITEM">
      ),

    (world, hero, toolEntity) => {
      const weaponEntity = world.getEntityByIdAndComponents(
        hero[EQUIPPABLE]?.weapon,
        [SPRITE]
      );
      const hookCondition = (hero[CONDITIONABLE] as Conditionable)?.hook;
      if (hookCondition && hookCondition.amount === hookCondition.modifier) {
        return "CATCH";
      }
      if (
        hero[CONDITIONABLE]?.axe ||
        hero[CONDITIONABLE]?.pickaxe ||
        hero[CONDITIONABLE]?.hammer ||
        hookCondition
      ) {
        return (weaponEntity?.[SPRITE].name || "Stow").toUpperCase();
      }
      if (toolEntity[ITEM].tool === "pickaxe") {
        return "MINE";
      } else if (toolEntity[ITEM].tool === "shovel") {
        return "DIG";
      } else if (toolEntity[ITEM].tool === "hammer") {
        return "BUILD";
      }

      return toolEntity[SPRITE].name.toUpperCase();
    },
    (world, _, toolEntity) =>
      hero
        ? getActionActivations(world, hero, toolEntity[ITEM], true)
        : repeat(none, 6),
    "silver"
  );

  const skillOrToolAction = useMemo(
    () =>
      hero?.[ACTIONABLE]?.toolEquipped || !hero?.[EQUIPPABLE]?.skill
        ? toolAction
        : skillAction,
    [skillAction, toolAction, hero]
  );

  spellRef.current = spellAction;
  skillRef.current = skillOrToolAction;

  // rotate button shadow
  useEffect(() => {
    // clear on fading action
    if (highlightRef.current && !spellAction && !skillOrToolAction) {
      clearInterval(highlightRef.current);
      highlightRef.current = undefined;
    }

    if (
      (!spellAction || spellAction.disabled) &&
      (!skillOrToolAction || skillOrToolAction.disabled)
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
  }, [spellAction, skillOrToolAction]);

  useEffect(
    () => () => {
      clearInterval(highlightRef.current);
      highlightRef.current = undefined;
    },
    []
  );

  const handleAction = useCallback(
    (
      action:
        | "spell"
        | "skill"
        | "interact"
        | "inspect"
        | "use"
        | "equip"
        | "gear"
        | "stats"
        | "map"
        | "chat"
        | "type"
        | "close"
        | "left"
        | "right"
        | "up"
        | "down"
        | "content"
        | "scroll"
        | "tab"
        | "backtab",
      index?: number,
      offset?: number,
      tab?: number
    ) => {
      const heroEntity = heroRef.current;
      const currentAction = actionRef.current;
      const active =
        action === "spell"
          ? spellRef.current
          : action === "skill"
          ? skillRef.current
          : undefined;

      // allow action while moving but not in popup
      if (
        currentAction ||
        !heroEntity ||
        !ecs ||
        pausedRef.current ||
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

      if (
        action === "scroll" &&
        heroEntity[PLAYER].actionTriggered === "scroll"
      ) {
        heroEntity[PLAYER].contentTriggered = index;
        return;
      }

      // skip if already triggered
      if (
        heroEntity[ACTIONABLE].spellTriggered ||
        heroEntity[ACTIONABLE].skillTriggered ||
        heroEntity[ACTIONABLE].interactTriggered ||
        (heroEntity[PLAYER].actionTriggered &&
          heroEntity[PLAYER].actionTriggered !== "scroll")
      )
        return;

      if (action === "spell") {
        heroEntity[ACTIONABLE].spellTriggered = true;
      } else if (action === "skill") {
        heroEntity[ACTIONABLE].skillTriggered = true;
      } else if (action === "interact") {
        heroEntity[ACTIONABLE].interactTriggered = true;
      } else {
        heroEntity[PLAYER].actionTriggered = action;

        if (
          ["type", "chat"].includes(action) ||
          (tab !== undefined && action === "tab")
        ) {
          heroEntity[PLAYER].tabTriggered = tab;
        }
        if (
          ["type", "chat"].includes(action) ||
          (index !== undefined && ["content", "use", "scroll"].includes(action))
        ) {
          heroEntity[PLAYER].contentTriggered = index;
          heroEntity[PLAYER].offsetTriggered = offset;
        }
      }

      reference.suspensionCounter =
        reference.suspensionCounter === -1
          ? -1
          : reference.suspensionCounter + 1;
      reference.suspended = false;

      if (active && !active.disabled) {
        if (action === "spell") {
          setSpell(active);
        } else if (action === "skill") {
          setSkill(active);
        }
        actionRef.current = active;
        setTimeout(() => {
          if (action === "spell") {
            setSpell(undefined);
          } else if (action === "skill") {
            setSkill(undefined);
          }
          actionRef.current = undefined;
        }, reference.tick);
      }
    },
    [ecs]
  );

  const handleSpell = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      if (!ecs || !hero || !isInteractable(ecs, hero)) return;
      handleAction("spell");
    },
    [handleAction, ecs, hero]
  );

  const handleSkill = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      if (!ecs || !hero || !isInteractable(ecs, hero)) return;
      handleAction("skill");
    },
    [handleAction, ecs, hero]
  );

  const handleInteract = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      if (!ecs || !hero || (!isInteractable(ecs, hero) && !isDead(ecs, hero)))
        return;
      handleAction("interact");
    },
    [handleAction, ecs, hero]
  );

  const handleUse = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>,
      keyNumber?: number
    ) => {
      event.preventDefault();
      if (inMenu || !ecs || !hero || !isActionable(ecs, hero)) return;

      handleAction("use", keyNumber);
    },
    [handleAction, inMenu, ecs, hero]
  );

  const handleEquip = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("equip");
    },
    [handleAction]
  );

  const handleGear = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      if (inMenu || !ecs || !hero || !isActionable(ecs, hero)) return;

      handleAction("gear");
    },
    [handleAction, inMenu, ecs, hero]
  );

  const handleStats = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      if (inMenu || !ecs || !hero || !isActionable(ecs, hero)) return;

      handleAction("stats");
    },
    [handleAction, inMenu, ecs, hero]
  );

  const handleChat = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>,
      command = false
    ) => {
      const hero = heroRef.current;
      event.preventDefault();
      if (inMenu || !ecs || !hero || !isActionable(ecs, hero) || !TEST_MODE)
        return;

      if (command) {
        // type slash character for convenience
        const keyMap = getIndexFromKey("/");
        handleAction("chat", keyMap?.content, keyMap?.offset, keyMap?.tab);
      } else {
        handleAction("chat");
      }
    },
    [handleAction, inMenu, ecs]
  );

  const handleType = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>,
      key: string
    ) => {
      const hero = heroRef.current;
      event.preventDefault();
      if (
        inMenu ||
        !ecs ||
        !hero ||
        pausedRef.current ||
        !isActionable(ecs, hero)
      )
        return;

      if (backspaceKeys.includes(key)) {
        typeChat(ecs, hero);
        return;
      }

      const keyMap = getIndexFromKey(key);
      if (!keyMap) return;

      typeChat(
        ecs,
        hero,
        keyMap.tab * keyboardSize +
          keyMap.offset * keyboardColumns +
          keyMap.content
      );
    },
    [inMenu, ecs]
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
      handleAction(
        "tab",
        undefined,
        undefined,
        tab ? parseInt(tab) : undefined
      );
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

      // open links within user gesture for mobile browsers
      if (ecs && popup && getTab(ecs, popup) === "credits") {
        const credit = credits[getVerticalIndex(ecs, popup)];
        if (credit?.link) {
          play("confirm");
          window.open(credit.link, "_blank");
        }
        return;
      }

      handleAction("right");
    },
    [handleAction, ecs, popup]
  );

  const handleContent = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      const div = event.currentTarget as HTMLDivElement | undefined;
      if (!div || ("touches" in event && event.touches.length > 1)) return;

      const rect = div.getBoundingClientRect();

      let offsetX = 0;
      let offsetY = 0;

      if ("clientX" in event && typeof event.clientX === "number") {
        offsetX = event.clientX - rect.left;
      } else if ("touches" in event && event.touches.length > 0) {
        offsetX = event.touches[0].clientX - rect.left;
      }

      if ("clientY" in event && typeof event.clientY === "number") {
        offsetY = event.clientY - rect.top;
      } else if ("touches" in event && event.touches.length > 0) {
        offsetY = event.touches[0].clientY - rect.top;
      }

      if (
        offsetX < 0 ||
        offsetY < 0 ||
        offsetX >= rect.width ||
        offsetY >= rect.height
      )
        return;

      const totalWidth = rect.width;
      const columnWidth = totalWidth / (frameWidth - 2);
      const columnIndex = Math.min(
        frameWidth - 3,
        Math.floor(offsetX / columnWidth)
      );

      const totalHeight = rect.height;
      const rows = Number(div.dataset.rows) || frameHeight - 2;
      const rowHeight = totalHeight / rows;
      const rowIndex = Math.min(rows - 1, Math.floor(offsetY / rowHeight));

      handleAction("content", rowIndex, columnIndex);
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
      // Start a new dialog press immediately, then use the normal repeat clock.
      if (
        attemptedOrientations.length &&
        !heroEntity[MOVABLE].orientations.length &&
        isInPopup(ecs, heroEntity)
      ) {
        reference.delta = reference.tick;
      }
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
          heroEntity[ACTIONABLE].spellTriggered ||
          heroEntity[ACTIONABLE].skillTriggered ||
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

  const handleScroll = useCallback(
    (bar: Element, clientY: number) => {
      const rect = bar.getBoundingClientRect();
      const cellHeight = rect.height / Number(bar.getAttribute("data-rows"));
      // Keep the handle center inside its end caps.
      const percentage = clamp(
        (clientY - rect.top - 2 * cellHeight) / (rect.height - 4 * cellHeight),
        0,
        1
      );
      handleAction("scroll", percentage);
    },
    [handleAction]
  );

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      const hero = heroRef.current;
      const paused = pausedRef.current;
      const popup = ecs && hero && getActivePopup(ecs, hero);
      const popupTab = ecs && popup && getTab(ecs, popup);
      if (event.type === "keydown" && closeKeys.includes(event.key)) {
        if (!(popup && !paused) && !initial) {
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
      // repeat text input, but keep actions single-shot
      if (
        event.type === "keydown" &&
        (event.altKey ||
          event.metaKey ||
          (event.repeat &&
            !(
              TEST_MODE &&
              popupTab === "chat" &&
              (getIndexFromKey(event.key) || backspaceKeys.includes(event.key))
            )))
      )
        return;

      if (
        TEST_MODE &&
        popupTab === "chat" &&
        !interactKeys.includes(event.key) &&
        !closeKeys.includes(event.key) &&
        event.type === "keydown"
      ) {
        if (tabKeys.includes(event.key)) {
          event.preventDefault();
          if (!paused && ecs && hero) completeChat(ecs, hero);
        } else if (historyKeys.includes(event.key)) {
          event.preventDefault();
          if (!paused && ecs && hero)
            navigateChat(ecs, hero, event.key === "ArrowUp" ? -1 : 1);
        } else {
          // allow typing in chat
          handleType(event, event.key);
        }
        return;
      } else if (spellKeys.includes(event.key) && event.type === "keydown") {
        handleSpell(event);
        return;
      } else if (skillKeys.includes(event.key) && event.type === "keydown") {
        handleSkill(event);
        return;
      } else if (mapKeys.includes(event.key) && event.type === "keydown") {
        handleMap(event);
        return;
      } else if (useKeys.includes(event.key) && event.type === "keydown") {
        handleUse(event);
        return;
      } else if (equipKeys.includes(event.key) && event.type === "keydown") {
        handleEquip(event);
        return;
      } else if (gearKeys.includes(event.key) && event.type === "keydown") {
        handleGear(event);
        return;
      } else if (statsKeys.includes(event.key) && event.type === "keydown") {
        handleStats(event);
        return;
      } else if (
        TEST_MODE &&
        (chatKeys.includes(event.key) ||
          commandKeys.includes(event.key) ||
          (!interactable && !popup && interactKeys.includes(event.key))) &&
        event.type === "keydown"
      ) {
        // allow opening chat in test mode
        handleChat(event, commandKeys.includes(event.key));
        return;
      } else if (
        backspaceKeys.includes(event.key) &&
        event.type === "keydown"
      ) {
        if (ecs && popup) {
          handleLeft(event);
        }
        return;
      } else if (interactKeys.includes(event.key) && event.type === "keydown") {
        if (popup) {
          handleRight(event);
        } else {
          handleInteract(event);
        }
        return;
      } else if (inspectKeys.includes(event.key) && event.type === "keydown") {
        handleInspect(event);
        return;
      } else if (hotKeys.includes(event.key) && event.type === "keydown") {
        handleUse(event, parseInt(event.key));
        return;
      } else if (tabKeys.includes(event.key) && event.type === "keydown") {
        if (popup) {
          if (popup[IDENTIFIABLE]?.name === "use") {
            handleClose(event);
          } else {
            handleTab(event, event.shiftKey);
          }
        } else {
          handleUse(event);
        }
        return;
      } else if (closeKeys.includes(event.key) && event.type === "keydown") {
        if (ecs && popup) {
          if (!getSequence(ecs, popup, "popup")?.args.backButton) {
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
      initial,
      interactable,
      setPaused,
      handleMove,
      handleSpell,
      handleSkill,
      handleInteract,
      handleInspect,
      handleTab,
      handleUse,
      handleEquip,
      handleStats,
      handleGear,
      handleMap,
      handleChat,
      handleType,
      handleLeft,
      handleRight,
      handleClose,
    ]
  );

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (document.body.classList.contains("no-cursor")) {
      document.body.classList.remove("no-cursor");
    }
  }, []);

  const releaseTouch = useCallback(() => {
    touchOrigin.current = undefined;
    pressedOrientations.current = [];
    setJoystickOrientations([]);
    handleMove([]);
  }, [handleMove]);

  // A popup can disappear while its scrollbar is held.
  useLayoutEffect(releaseTouch, [
    popup,
    popupSequence?.args.scrollMax,
    releaseTouch,
  ]);

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      const hero = heroRef.current;
      const paused = pausedRef.current;
      const popup = ecs && hero && getActivePopup(ecs, hero);
      const popupTab = ecs && popup && getTab(ecs, popup);
      if (event.type === "touchend" || event.type === "touchcancel") {
        releaseTouch();
        return;
      }
      if (!paused) ensureAudio();
      if (event.touches.length !== 1) {
        releaseTouch();
        return;
      }

      const touch = event.touches[0];
      if (event.type === "touchstart") releaseTouch();
      if ((touch.target as HTMLElement).closest(".PopupScroll")) return;

      const onKeyboard = [...event.changedTouches].some((touch) =>
        (touch.target as HTMLElement).closest("#keyboard")
      );
      if (onKeyboard && !(TEST_MODE && popupTab === "chat")) return;

      const [x, y] = [touch.clientX, touch.clientY];
      if (!touchOrigin.current) touchOrigin.current = [x, y];
      const [deltaX, deltaY] = [
        x - touchOrigin.current[0],
        y - touchOrigin.current[1],
      ];

      if (Math.sqrt(deltaX ** 2 + deltaY ** 2) <= swipeThreshold) {
        // handle button taps
        return false;
      }

      if (pointer.current) pointer.current.consumed = true;
      const degrees = pointToDegree({ x: deltaX, y: deltaY });
      const nextOrientations = degreesToOrientations(degrees);

      if (nextOrientations.length > 0) {
        // handle history in single steps
        const primaryOrientation = nextOrientations[0];
        if (TEST_MODE && popupTab === "chat") {
          if (
            primaryOrientation === "right" &&
            pressedOrientations.current[0] !== "right"
          ) {
            if (!paused && ecs && hero) completeChat(ecs, hero);
          } else if (
            ["up", "down"].includes(primaryOrientation) &&
            pressedOrientations.current[0] !== primaryOrientation
          ) {
            if (!paused && ecs && hero)
              navigateChat(ecs, hero, primaryOrientation === "up" ? -1 : 1);
          }
        } else if (
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
    [handleMove, releaseTouch, setJoystickOrientations, ecs]
  );

  const handleDeactivate = useCallback(() => {
    releaseTouch();
    pointer.current = undefined;
    setPaused(true);
  }, [releaseTouch, setPaused]);

  const handleVisibility = useCallback(() => {
    if (document.hidden) handleDeactivate();
  }, [handleDeactivate]);

  // Keep lifecycle listeners stable and register before preview focus policies.
  useLayoutEffect(() => {
    window.addEventListener("blur", handleDeactivate);
    window.addEventListener("pagehide", handleDeactivate);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("blur", handleDeactivate);
      window.removeEventListener("pagehide", handleDeactivate);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [handleDeactivate, handleVisibility]);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      if (event.type === "pointerdown") {
        if (!event.isPrimary || event.button !== 0) return;
        const scrollbar =
          (event.target as Element).closest(".PopupScroll") ?? undefined;
        pointer.current = {
          id: event.pointerId,
          consumed: !!scrollbar,
          scrollbar,
        };
        scrollbar?.setPointerCapture(event.pointerId);
      } else if (event.type === "pointermove") {
        if (pointer.current?.id !== event.pointerId) return;
      } else {
        // Keep click consumption until click; release only the drag target.
        if (pointer.current && pointer.current.id === event.pointerId) {
          if (event.type === "pointercancel") pointer.current = undefined;
          else pointer.current.scrollbar = undefined;
        }
        // A touch target can disappear before its touchend reaches the window.
        if (event.pointerType === "touch") releaseTouch();
        return;
      }
      const scrollbar = pointer.current?.scrollbar;
      if (scrollbar?.isConnected) handleScroll(scrollbar, event.clientY);
    };
    const handleClick = (event: MouseEvent) => {
      const activePointer = pointer.current;
      if (
        !activePointer ||
        !("pointerId" in event) ||
        event.pointerId !== activePointer.id
      )
        return;
      pointer.current = undefined;
      if (activePointer.consumed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("click", handleClick, true);
    const pointerEvents = [
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
    ] as const;
    for (const type of pointerEvents)
      window.addEventListener(type, handlePointer, {
        capture: true,
        passive: true,
      });
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);

    window.addEventListener("touchstart", handleTouchMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchMove, { passive: true });
    window.addEventListener("touchcancel", handleTouchMove, { passive: true });

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("click", handleClick, true);
      for (const type of pointerEvents)
        window.removeEventListener(type, handlePointer, true);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);

      window.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchMove);
      window.removeEventListener("touchcancel", handleTouchMove);

      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleKey, handleMouseMove, handleTouchMove, handleScroll, releaseTouch]);

  const emptySpell = createButton(
    isTouch ? "SPELL" : "SPACE",
    buttonWidth,
    true,
    false,
    false,
    "white"
  );
  const spellHighlighted = highlight === 0 || highlight === 1;
  const spellButton =
    spellAction &&
    createButton(
      spellAction.name,
      buttonWidth,
      spellAction.disabled,
      false,
      spellHighlighted,
      spellAction.palette
    );
  const rightButton = spellButton || emptySpell;
  const emptySkill = createButton(
    isTouch ? "SKILL" : "SHIFT",
    buttonWidth,
    true,
    false,
    false,
    "white"
  );
  const skillHighlighted = highlight === 4 || highlight === 5;
  const skillButton =
    skillOrToolAction &&
    createButton(
      skillOrToolAction.name,
      buttonWidth,
      !skill && skillOrToolAction.disabled,
      !!skill,
      !skill && skillHighlighted,
      skillOrToolAction.palette
    );
  const leftButton = skillButton || emptySkill;

  const emptyActivation = repeat(none, 6);
  const spellActivation =
    spell?.activation || spellAction?.activation || emptyActivation;
  const skillActivation =
    skill?.activation || skillOrToolAction?.activation || emptyActivation;

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
    <footer
      className={flipped ? "ControlsFlipped" : "Controls"}
      style={
        popupSequence &&
        ({
          "--popup-height": popupSequence.args.windowHeight,
          "--popup-offset":
            ((frameHeight - popupSequence.args.windowHeight) % 2) * -0.5,
        } as React.CSSProperties)
      }
    >
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
        className="ControlsEdge"
        cells={createText("─".repeat(dimensions.renderedColumns), frameColor)}
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
            className="ActionButtons"
            cells={
              compact
                ? skillOrToolAction && spellAction
                  ? [
                      ...leftButton.slice(0, -1),
                      getButtonSeparator(
                        skillOrToolAction.palette,
                        skillOrToolAction.disabled,
                        skillHighlighted,
                        !!skill,
                        spellAction.palette,
                        spellAction.disabled,
                        spellHighlighted,
                        !!spell
                      ),
                      ...rightButton.slice(1),
                    ]
                  : skillOrToolAction
                  ? leftButton
                  : spellAction
                  ? rightButton
                  : []
                : flipped
                ? [
                    ...equipmentRows[0],
                    ...rightButton.slice(0, -1),
                    getButtonSeparator(
                      spellAction?.palette || "white",
                      !spellAction || spellAction.disabled,
                      spellHighlighted,
                      !!spell,
                      skillOrToolAction?.palette || "white",
                      !skillOrToolAction || skillOrToolAction.disabled,
                      skillHighlighted,
                      !!skill
                    ),
                    ...leftButton.slice(1),
                  ]
                : [
                    ...leftButton.slice(0, -1),
                    getButtonSeparator(
                      skillOrToolAction?.palette || "white",
                      !skillOrToolAction || skillOrToolAction.disabled,
                      skillHighlighted,
                      !!skill,
                      spellAction?.palette || "white",
                      !spellAction || spellAction.disabled,
                      spellHighlighted,
                      !!spell
                    ),
                    ...rightButton.slice(1),
                    ...equipmentRows[0],
                  ]
            }
          />
          <Row
            className="ActionActivation"
            cells={
              compact
                ? skillOrToolAction && spellAction
                  ? [...skillActivation, none, ...spellActivation]
                  : skillOrToolAction
                  ? skillActivation
                  : spellAction
                  ? spellActivation
                  : []
                : flipped
                ? [
                    ...equipmentRows[1],
                    ...spellActivation,
                    none,
                    ...skillActivation,
                  ]
                : [
                    ...skillActivation,
                    none,
                    ...spellActivation,
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
      <div className="Skill" id="skill" onClick={handleSkill} />
      <div className="Spell" id="spell" onClick={handleSpell} />
      {/* Keep the touch target attached when moving away hides its prompt. */}
      <div
        className="Interact"
        id="interact"
        hidden={!interactable}
        onClick={handleInteract}
        style={
          interactable
            ? ({
                "--interact-x":
                  signedDistance(position.x, interactable.position.x, size) -
                  fraction.x,
                "--interact-y":
                  signedDistance(position.y, interactable.position.y, size) -
                  fraction.y,
                "--interact-width": interactable.size.x,
                "--interact-height": interactable.size.y,
              } as React.CSSProperties)
            : undefined
        }
      />
      {Array.from({ length: popupTabs }).map((_, index) => (
        <div
          key={index}
          className="PopupTab"
          id={`tab-${index}`}
          onClick={handleTab}
          data-tab={index}
          style={{ "--popup-tab": index } as React.CSSProperties}
        />
      ))}
      {popup && (
        <>
          <div className="PopupClose" id="close" onClick={handleClose} />
          <div className="PopupLeft" id="left" onClick={handleLeft} />
          <div className="PopupRight" id="right" onClick={handleRight} />
          {!!popupSequence?.args.scrollMax && (
            <div
              className="PopupScroll"
              id="scroll"
              data-rows={(popupSequence.args.windowHeight || frameHeight) - 2}
            />
          )}
          <div
            className="PopupContent"
            id="content"
            data-rows={(popupSequence?.args.windowHeight || frameHeight) - 2}
            onClick={handleContent}
          />
          {popupTab === "chat" && <Keyboard />}
        </>
      )}
      {children}
    </footer>
  );
}
