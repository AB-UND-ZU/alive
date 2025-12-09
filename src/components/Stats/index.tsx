import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHero, useWorld } from "../../bindings/hooks";
import {
  createText,
  none,
  createProgress,
  createButton,
  resumeInvert,
  pauseInvert,
  createSpriteButton,
} from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { Countable, STATS } from "../../engine/components/stats";
import { EQUIPPABLE, Equippable } from "../../engine/components/equippable";
import { normalize, repeat } from "../../game/math/std";
import { isGhost } from "../../engine/systems/fate";
import { PLAYER } from "../../engine/components/player";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import { LEVEL } from "../../engine/components/level";
import { menuName } from "../../game/levels/menu";

const pressDuration = 200;
const progressWidth = 13;
const bagWidth = 4;

function StatsInner({
  padding,
  hidden,
  handleInspect,
  width,
  inspecting,
  ...stats
}: {
  padding: number;
  hidden: boolean;
  inspecting: boolean;
  width: number;
  handleInspect: (
    event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
} & Partial<Countable> &
  Equippable) {
  const { ecs, paused, setPaused, flipped } = useWorld();
  const [pressed, setPressed] = useState("");
  const level = ecs?.metadata.gameEntity[LEVEL].name;
  const inMenu = level === menuName;

  const handleMenu = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      setPaused((prevPaused) => !prevPaused);
      setPressed("pause");
      setTimeout(setPressed, pressDuration, "");
    },
    [setPaused]
  );
  const handleBag = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (paused) return;

      event.preventDefault();

      handleInspect(event);

      setPressed("inspect");
      setTimeout(setPressed, pressDuration, "");
    },
    [handleInspect, paused]
  );

  const highlightRef = useRef<NodeJS.Timeout>();
  const [highlight, setHighlight] = useState(8);

  // rotate button shadow
  useEffect(() => {
    if (highlightRef.current) return;

    setHighlight(8);

    highlightRef.current = setInterval(() => {
      setHighlight((prevHighlight) => normalize(prevHighlight - 1, 8));
    }, 100);
  }, []);

  const pauseButton = createSpriteButton(
    [paused ? resumeInvert : pauseInvert],
    2,
    false,
    pressed === "pause",
    highlight,
    paused ? "lime" : "silver"
  );
  const bagButton = createButton(
    inspecting ? " X " : "BAG",
    bagWidth,
    paused,
    pressed === "inspect",
    (highlight + 3) % 8,
    inspecting ? "red" : "silver"
  );

  return (
    <header className={flipped ? "StatsFlipped" : "Stats"}>
      {hidden || inMenu ? (
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
                    ...repeat(none, 4),
                    none,
                    ...createProgress(stats, "hp", progressWidth, false),
                    none,
                    ...repeat(none, 2),
                  ]
                : [
                    ...repeat(none, 2),
                    none,
                    ...createProgress(stats, "hp", progressWidth, false),
                    none,
                    ...repeat(none, 4),
                  ]
            }
          />
          <Row
            cells={
              flipped
                ? [
                    ...bagButton[0],
                    none,
                    ...createProgress(stats, "mp", progressWidth),
                    none,
                    ...pauseButton[0],
                  ]
                : [
                    ...pauseButton[0],
                    none,
                    ...createProgress(stats, "mp", progressWidth),
                    none,
                    ...bagButton[0],
                  ]
            }
          />
          <Row
            cells={
              flipped
                ? [
                    ...bagButton[1],
                    none,
                    ...createProgress(stats, "xp", progressWidth),
                    none,
                    ...pauseButton[1],
                  ]
                : [
                    ...pauseButton[1],
                    none,
                    ...createProgress(stats, "xp", progressWidth),
                    none,
                    ...bagButton[1],
                  ]
            }
          />
        </>
      )}
      <Row
        cells={createText("─".repeat(width + padding * 2 + 1), colors.grey)}
      />
      <div className="Menu" id="menu" onClick={handleMenu} />
      <div className="Inspect" id="inspect" onClick={handleBag} />
    </header>
  );
}

const PureState = React.memo(StatsInner);

export default function Stats() {
  const { ecs, paused } = useWorld();
  const dimensions = useDimensions();
  const hero = useHero();

  const handleInspect = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      if (!hero || !ecs || paused) return;

      const reference = ecs.assertByIdAndComponents(hero[MOVABLE]?.reference, [
        REFERENCE,
      ])[REFERENCE];

      if (!reference) return;

      hero[PLAYER].inspectTriggered = true;
      reference.suspensionCounter = reference.suspensionCounter === -1 ? -1 : 1;
      reference.suspended = false;
    },
    [hero, ecs, paused]
  );

  return (
    <PureState
      padding={dimensions.padding}
      width={dimensions.visibleColumns}
      {...hero?.[STATS]}
      {...hero?.[EQUIPPABLE]}
      hidden={!ecs || !hero || isGhost(ecs, hero)}
      handleInspect={handleInspect}
      inspecting={
        !!hero && !!ecs && hero[PLAYER].popup === ecs.getEntityId(hero)
      }
    />
  );
}
