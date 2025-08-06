import React, { useCallback } from "react";
import { useHero, useWorld } from "../../bindings/hooks";
import {
  createText,
  none,
  map,
  pause,
  resume,
  createProgress,
} from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { Countable, STATS } from "../../engine/components/stats";
import { EQUIPPABLE, Equippable } from "../../engine/components/equippable";
import { repeat } from "../../game/math/std";
import { isGhost } from "../../engine/systems/fate";

function StatsInner({
  padding,
  hidden,
  ...stats
}: {
  padding: number;
  hidden: boolean;
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
              ...repeat(none, 3),
              ...createText("│", colors.grey),
              ...createProgress(stats, "hp", 13, false),
              ...createText("│", colors.grey),
              ...repeat(none, 3),
            ]}
          />
          <Row
            cells={[
              ...repeat(none, 3),
              ...createText("│", colors.grey),
              ...createProgress(stats, "mp", 13),
              ...createText("│", colors.grey),
              ...repeat(none, 3),
            ]}
          />
          <Row
            cells={[
              none,
              paused ? resume : stats.map ? map : pause,
              none,
              ...createText("│", colors.grey),
              ...createProgress(stats, "xp", 13),
              ...createText("│", colors.grey),
              ...repeat(none, 3),
            ]}
          />
        </>
      )}
      <Row
        cells={[
          ...createText("═".repeat(padding + 3), colors.grey),
          ...createText(hidden ? "═" : "╧", colors.grey),
          ...createText("═".repeat(13), colors.grey),
          ...createText(hidden ? "═" : "╧", colors.grey),
          ...createText("═".repeat(padding + 3), colors.grey),
        ]}
      />
      <div className="Menu" id="menu" onClick={handleMenu} />
    </header>
  );
}

const PureState = React.memo(StatsInner);

export default function Stats() {
  const { ecs } = useWorld();
  const dimensions = useDimensions();
  const hero = useHero();

  return (
    <PureState
      padding={dimensions.padding}
      {...hero?.[STATS]}
      {...hero?.[EQUIPPABLE]}
      hidden={!ecs || !hero || isGhost(ecs, hero)}
    />
  );
}
