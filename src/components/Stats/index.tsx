import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHero, useWorld } from "../../bindings/hooks";
import {
  createText,
  none,
  createProgress,
  createButton,
  pauseInvert,
  createSpriteButton,
  pauseInvertPressed,
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
import { recolorLine } from "../../game/assets/pixels";
import { getIdentifier } from "../../engine/utils";
import { isDead } from "../../engine/systems/damage";

const pressDuration = 200;
const progressWidth = 13;
const menuWidth = 3;
const bagWidth = 5;
const highlightDuration = 1 * 2 * 3 * 4 * 5;

function StatsInner({
  padding,
  hidden,
  handleInspect,
  handleSurvey,
  width,
  inspecting,
  surveying,
  map,
  ...stats
}: {
  padding: number;
  hidden: boolean;
  inspecting: boolean;
  surveying: boolean;
  width: number;
  handleInspect: (
    event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
  handleSurvey: (
    event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
} & Partial<Countable> &
  Equippable) {
  const { ecs, paused, setPaused, flipped, initial } = useWorld();
  const dimensions = useDimensions();
  const [pressed, setPressed] = useState("");
  const level = ecs?.metadata.gameEntity[LEVEL].name;
  const menuOnly = level === menuName || hidden;

  const handleMenu = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      if (initial) return;

      setPaused((prevPaused) => !prevPaused);
      setPressed("pause");
      setTimeout(setPressed, pressDuration, "");
    },
    [setPaused, initial]
  );

  const handleBag = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (paused || hidden) return;

      event.preventDefault();

      handleInspect(event);

      setPressed("inspect");
      setTimeout(setPressed, pressDuration, "");
    },
    [handleInspect, paused, hidden]
  );

  const handleMap = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (paused) return;

      event.preventDefault();

      handleSurvey(event);

      setPressed("map");
      setTimeout(setPressed, pressDuration, "");
    },
    [handleSurvey, paused]
  );

  const highlightRef = useRef<NodeJS.Timeout>();
  const [highlight, setHighlight] = useState(0);
  const hpPercentage = ((stats.hp || 0) / (stats.maxHp || 1)) * 100;
  const hpBlink =
    !paused &&
    hpPercentage > 0 &&
    hpPercentage < 30 &&
    highlight % (highlightDuration / (5 - Math.floor(hpPercentage / 6))) <= 1;
  const normalProgress = createProgress(stats, "hp", progressWidth, false);
  const hpProgress = hpBlink
    ? recolorLine(normalProgress, { [colors.maroon]: colors.red })
    : normalProgress;

  // rotate button shadow
  useEffect(() => {
    if (highlightRef.current) return;

    setHighlight(0);

    highlightRef.current = setInterval(() => {
      setHighlight((prevHighlight) =>
        normalize(prevHighlight + 1, highlightDuration)
      );
    }, 100);
  }, []);

  const pauseButton = createSpriteButton(
    [paused ? pauseInvertPressed : pauseInvert],
    menuWidth,
    false,
    paused,
    highlight === 3 || highlight === 4,
    "white"
  );
  const bagButton = createButton(
    "BAG",
    bagWidth,
    paused,
    pressed === "inspect" || inspecting,
    highlight === 9 || highlight === 10,
    "white"
  );
  const mapButton = map
    ? createButton(
        "MAP",
        bagWidth,
        paused,
        pressed === "map" || surveying,
        highlight === 15 || highlight === 16,
        "yellow"
      )
    : repeat(none, bagWidth);

  return (
    <header className={flipped ? "StatsFlipped" : "Stats"}>
      {menuOnly ? (
        <>
          <Row />
          <Row />
          <Row
            cells={
              flipped
                ? [...repeat(none, progressWidth + bagWidth), ...pauseButton]
                : [...pauseButton, ...repeat(none, progressWidth + bagWidth)]
            }
          />
        </>
      ) : hidden || initial ? (
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
                ? [...mapButton, ...hpProgress, none, ...repeat(none, 2)]
                : [...repeat(none, 2), none, ...hpProgress, ...mapButton]
            }
          />
          <Row
            cells={
              flipped
                ? [
                    ...repeat(none, 4),
                    none,
                    ...createProgress(stats, "mp", progressWidth),
                    none,
                    ...repeat(none, 2),
                  ]
                : [
                    ...repeat(none, 2),
                    none,
                    ...createProgress(stats, "mp", progressWidth),
                    none,
                    ...repeat(none, 4),
                  ]
            }
          />
          <Row
            cells={
              flipped
                ? [
                    ...bagButton,
                    ...createProgress(stats, "xp", progressWidth),
                    ...pauseButton,
                  ]
                : [
                    ...pauseButton,
                    ...createProgress(stats, "xp", progressWidth),
                    ...bagButton,
                  ]
            }
          />
        </>
      )}
      {Array.from({ length: dimensions.hudRows - 4 }).map((_, index) => (
        <Row key={index} />
      ))}
      <Row
        cells={createText("─".repeat(width + padding * 2 + 1), colors.grey)}
      />
      {!initial && <div className="Menu" id="menu" onClick={handleMenu} />}
      {!initial && !hidden && !menuOnly && (
        <>
          <div
            className={map ? "InspectSurvey" : "Inspect"}
            id="inspect"
            onClick={handleBag}
          />
          {map && <div className="Survey" id="survey" onClick={handleMap} />}
        </>
      )}
    </header>
  );
}

const PureState = React.memo(StatsInner);

export default function Stats() {
  const { ecs, paused } = useWorld();
  const dimensions = useDimensions();
  const hero = useHero();
  const mapItem = hero && ecs && ecs.getEntityById(hero[EQUIPPABLE]?.map);
  const mapViewpoint = hero && ecs && getIdentifier(ecs, "map");

  const handleInspect = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      if (!hero || !ecs || paused) return;

      const reference = ecs.assertByIdAndComponents(hero[MOVABLE]?.reference, [
        REFERENCE,
      ])[REFERENCE];

      if (!reference) return;

      hero[PLAYER].actionTriggered = "inspect";
      reference.suspensionCounter =
        reference.suspensionCounter === -1
          ? -1
          : reference.suspensionCounter + 1;
      reference.suspended = false;
    },
    [hero, ecs, paused]
  );

  const handleSurvey = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      if (!hero || !ecs || paused || !mapItem) return;

      const reference = ecs.assertByIdAndComponents(hero[MOVABLE]?.reference, [
        REFERENCE,
      ])[REFERENCE];

      if (!reference) return;

      hero[PLAYER].actionTriggered = "map";

      reference.suspensionCounter =
        reference.suspensionCounter === -1
          ? -1
          : reference.suspensionCounter + 1;
      reference.suspended = false;
    },
    [hero, ecs, paused, mapItem]
  );

  return (
    <PureState
      padding={dimensions.padding}
      width={dimensions.visibleColumns}
      {...hero?.[STATS]}
      {...hero?.[EQUIPPABLE]}
      hidden={!ecs || !hero || isDead(ecs, hero)}
      handleInspect={handleInspect}
      handleSurvey={handleSurvey}
      inspecting={
        !!hero && !!ecs && hero[PLAYER].popup === ecs.getEntityId(hero)
      }
      surveying={
        !!hero &&
        !!ecs &&
        !!mapItem &&
        !!mapViewpoint &&
        hero[PLAYER].popup === ecs.getEntityId(mapViewpoint)
      }
    />
  );
}
