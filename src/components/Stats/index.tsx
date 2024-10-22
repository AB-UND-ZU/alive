import React, { useCallback } from "react";
import { useHero, useWorld } from "../../bindings/hooks";
import {
  createText,
  none,
  createStat,
  map,
  pause,
  resume,
} from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { COUNTABLE, Countable } from "../../engine/components/countable";
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
        </>
      ) : (
        <>
          <Row
            cells={[
              ...repeat(none, 3),
              ...createText("│", colors.grey),
              ...createStat(stats, "hp", "countable"),
              ...createStat(stats, "maxHp", "max"),
              none,
              ...createStat(stats, "xp", "countable"),
              none,
              ...createStat(stats, "iron", "countable"),
              none,
              ...createStat(stats, "seed", "countable"),
            ]}
          />
          <Row
            cells={[
              none,
              paused ? resume : stats.map ? map : pause,
              none,
              ...createText("│", colors.grey),
              ...createStat(stats, "mp", "countable"),
              ...createStat(stats, "maxMp", "max"),
              none,
              ...createStat(stats, "gold", "countable"),
              none,
              ...createStat(stats, "wood", "countable"),
              none,
              ...createStat(stats, "herb", "countable"),
            ]}
          />
        </>
      )}
      <Row
        cells={[
          ...createText("═".repeat(padding + 3), colors.grey),
          ...createText(hidden ? "═" : "╧", colors.grey),
          ...createText("═".repeat(padding + 17), colors.grey),
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
      {...hero?.[COUNTABLE]}
      {...hero?.[EQUIPPABLE]}
      hidden={!ecs || !hero || isGhost(ecs, hero)}
    />
  );
}
