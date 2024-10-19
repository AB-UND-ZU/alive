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
import { World } from "../../engine";
import { repeat } from "../../game/math/std";
import { isDead } from "../../engine/systems/damage";

function StatsInner({
  world,
  padding,
  hidden,
  ...stats
}: {
  world: World;
  padding: number;
  hidden: boolean;
} & Countable &
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
              none,
              ...createStat(stats, "hp", true),
              none,
              ...createStat(stats, "xp", true),
              none,
              ...createStat(stats, "iron", true),
              none,
              ...createStat(stats, "seed", true),
              none,
              ...createText("│", colors.grey),
              ...repeat(none, 3),
            ]}
          />
          <Row
            cells={[
              none,
              ...createStat(stats, "mp", true),
              none,
              ...createStat(stats, "gold", true),
              none,
              ...createStat(stats, "wood", true),
              none,
              ...createStat(stats, "herb", true),
              none,
              ...createText("│", colors.grey),
              none,
              paused ? resume : stats.map ? map : pause,
              none,
            ]}
          />
        </>
      )}
      <Row
        cells={[
          ...createText("═".repeat(padding + 17), colors.grey),
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
      {...hero?.[COUNTABLE]}
      {...hero?.[EQUIPPABLE]}
      hidden={!ecs || !hero || isDead(ecs, hero)}
    />
  );
}
