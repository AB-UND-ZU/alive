import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHero, useWorld } from "../../bindings/hooks";
import {
  createText,
  none,
  createProgress,
  createButton,
  resumeInvert,
  pauseInvert,
} from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
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
  const { paused, setPaused } = useWorld();
  const handleMenu = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      setPaused((prevPaused) => !prevPaused);
    },
    [setPaused]
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

  const pauseButton = createButton(" ", 2, false, false, highlight, "silver");
  const bagButton = createButton(
    "Bag",
    4,
    paused,
    inspecting,
    (highlight + 3) % 8,
    "silver"
  );

  return (
    <header className="Stats">
      {hidden ? (
        <>
          <Row />
          <Row />
          <Row />
        </>
      ) : (
        <>
          <Row
            cells={[
              ...repeat(none, 2),
              none,
              ...createProgress(stats, "hp", 13, false),
              none,
              ...repeat(none, 4),
            ]}
          />
          <Row
            cells={[
              paused ? resumeInvert : pauseInvert,
              pauseButton[0][1],
              none,
              ...createProgress(stats, "mp", 13),
              none,
              ...bagButton[0],
            ]}
          />
          <Row
            cells={[
              ...pauseButton[1],
              none,
              ...createProgress(stats, "xp", 13),
              none,
              ...bagButton[1],
            ]}
          />
        </>
      )}
      <Row cells={createText("─".repeat(padding * 2 + width), colors.grey)} />
      <div className="Menu" id="menu" onClick={handleMenu} />
      <div className="Inspect" id="inspect" onClick={handleInspect} />
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
