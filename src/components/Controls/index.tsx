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
  createText,
  getButtonSeparator,
  mana,
  ninePlusAmmo,
  ninePlusMana,
  none,
  Palette,
} from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { ACTIONABLE, actions } from "../../engine/components/actionable";
import { normalize, range, repeat, signedDistance } from "../../game/math/std";
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
import Keyboard, { getIndexFromKey } from "../Keyboard";
import { TEST_MODE } from "../../engine/utils";

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
  } else if (item.tool === "axe" || item.tool === "pickaxe") {
    if (!hero[CONDITIONABLE]?.[harvestConditions[item.tool]]) {
      return centerSprites([itemSprite], 6);
    }
    const swordEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.weapon,
      [SPRITE]
    );
    return centerSprites([swordEntity?.[SPRITE] || none], 6);
  } else if (
    item.tool === "hook" &&
    hookCondition &&
    !hookCondition.orientation
  ) {
    const swordEntity = world.getEntityByIdAndComponents(
      hero[EQUIPPABLE]?.weapon,
      [SPRITE]
    );
    return centerSprites([swordEntity?.[SPRITE] || none], 6);
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
    ecs.getEntityByIdAndComponents(hero[PLAYER].popup, [POPUP, SEQUENCABLE]);
  const popupTabs =
    ecs && popup && !getSequence(ecs, popup, "popup")?.args.instant
      ? popup[POPUP].tabs.length
      : 0;
  const popupSequence = ecs && popup && getSequence(ecs, popup, "popup");
  const popupTab = ecs && popup && getTab(ecs, popup);
  const pressedOrientations = useRef<Orientation[]>([]);
  const touchOrigin = useRef<[number, number] | undefined>(undefined);
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

  const hidden =
    initial || !ecs || !heroRef.current || isDead(ecs, heroRef.current);

  const spellAction = useAction(
    "spell",
    (world, hero, spellEntity) =>
      !isControllable(world, hero) ||
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
      !isControllable(world, hero) ||
      !castableSkill(
        world,
        hero as TypedEntity<"INVENTORY">,
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
      !isControllable(world, hero) ||
      !castableSkill(
        world,
        hero as TypedEntity<"INVENTORY">,
        toolEntity as TypedEntity<"ITEM">
      ),

    (world, hero, toolEntity) => {
      const swordEntity = world.getEntityByIdAndComponents(
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
        hookCondition
      ) {
        return (swordEntity?.[SPRITE].name || "Stow").toUpperCase();
      }
      if (toolEntity[ITEM].tool === "pickaxe") {
        return "MINE";
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
        heroEntity[ACTIONABLE].spellTriggered ||
        heroEntity[ACTIONABLE].skillTriggered ||
        heroEntity[PLAYER].actionTriggered
      )
        return;

      if (action === "spell") {
        heroEntity[ACTIONABLE].spellTriggered = true;
      } else if (action === "skill") {
        heroEntity[ACTIONABLE].skillTriggered = true;
      } else {
        heroEntity[PLAYER].actionTriggered = action;

        if (
          ["type", "chat"].includes(action) ||
          (index !== undefined && action === "tab")
        ) {
          heroEntity[PLAYER].tabTriggered = tab;
        }
        if (
          ["type", "chat"].includes(action) ||
          (index !== undefined && ["content", "use"].includes(action))
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
    [ecs, paused]
  );

  const handleSpell = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("spell");
    },
    [handleAction]
  );

  const handleSkill = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleAction("skill");
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
    [handleAction, inMenu, ecs, hero]
  );

  const handleType = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>,
      key: string
    ) => {
      event.preventDefault();
      if (inMenu || !ecs || !hero || !isActionable(ecs, hero)) return;

      if (backspaceKeys.includes(key)) {
        handleAction("type");
        return;
      }

      const keyMap = getIndexFromKey(key);
      if (!keyMap) return;

      handleAction("type", keyMap.content, keyMap.offset, keyMap.tab);
    },
    [handleAction, inMenu, ecs, hero]
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
      handleAction("right");
    },
    [handleAction]
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

      const totalWidth = div.offsetWidth;
      const columnWidth = totalWidth / (frameWidth - 2);
      const columnIndex = Math.min(
        frameWidth - 3,
        Math.floor(offsetX / columnWidth)
      );

      const totalHeight = div.offsetHeight;
      const rowHeight = totalHeight / (frameHeight - 2);
      const rowIndex = Math.min(
        frameHeight - 3,
        Math.floor(offsetY / rowHeight)
      );

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

  const handleUp = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleMove(["up"]);
    },
    [handleMove]
  );

  const handleDown = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleMove(["down"]);
    },
    [handleMove]
  );

  const handleRelease = useCallback(
    (
      event:
        | KeyboardEvent
        | TouchEvent
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      event.preventDefault();
      handleMove([]);
    },
    [handleMove]
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

      if (
        TEST_MODE &&
        popupTab === "chat" &&
        !interactKeys.includes(event.key) &&
        !closeKeys.includes(event.key) &&
        event.type === "keydown"
      ) {
        // allow typing in chat
        handleType(event, event.key);
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
        if (ecs && popup && getTab(ecs, popup) === "chat") {
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
      paused,
      popup,
      popupTab,
      interactable,
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

      // defer keyboard clicks to own component
      if (
        [...event.changedTouches].some((touch) =>
          (touch.target as HTMLElement).closest("#keyboard")
        )
      )
        return;

      // prevent touches over action bar
      if (
        ![...event.changedTouches].some((touch) =>
          [
            "spell",
            "skill",
            "menu",
            "resume",
            "interact",
            "inspect",
            "quick",
            "close",
            "tab-0",
            "tab-1",
            "tab-2",
            "left",
            "right",
            "up",
            "down",
            "content",
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
            cells={
              flipped
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
          <div
            className="PopupUp"
            id="up"
            onPointerDown={handleUp}
            onPointerUp={handleRelease}
            onPointerCancel={handleRelease}
          />
          <div
            className="PopupDown"
            id="down"
            onPointerDown={handleDown}
            onPointerUp={handleRelease}
            onPointerCancel={handleRelease}
          />
          <div className="PopupContent" id="content" onClick={handleContent} />
          {popupTab === "chat" && <Keyboard />}
        </>
      )}
    </footer>
  );
}
