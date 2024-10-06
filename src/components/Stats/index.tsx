import { useHero } from "../../bindings/hooks";
import { createText, none, createStat, map } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { COUNTABLE, Countable } from "../../engine/components/countable";
import React from "react";
import { EQUIPPABLE, Equippable } from "../../engine/components/equippable";
import { World } from "../../engine";
import { repeat } from "../../game/math/std";

function StatsInner({
  world,
  padding,
  ...stats
}: {
  world: World;
  padding: number;
} & Countable &
  Equippable) {
  return (
    <header className="Stats">
      {Object.keys(stats).length > 0 ? (
        <>
          <Row
            cells={[
              none,
              ...createStat(stats.hp, "hp", true),
              none,
              ...createStat(stats.gold, "gold", true),
              none,
              ...createStat(stats.iron, "iron", true),
              none,
              ...createStat(stats.seed, "seed", true),
              none,
              ...createText('│', colors.grey),
              ...repeat(none, 3),
            ]}
          />
          <Row
            cells={[
              none,
              ...createStat(stats.mp, "mp", true),
              none,
              ...createStat(stats.xp, "xp", true),
              none,
              ...createStat(stats.wood, "wood", true),
              none,
              ...createStat(stats.herb, "herb", true),
              none,
              ...createText('│', colors.grey),
              none,
              stats.map ? map : none,
              none,
            ]}
          />
        </>
      ) : (
        <>
          <Row cells={[]} />
          <Row cells={[]} />
        </>
      )}
      <Row cells={[
        ...createText("═".repeat(padding + 17), colors.grey),
        ...createText("╧", colors.grey),
        ...createText("═".repeat(padding + 3), colors.grey),
      ]} />
    </header>
  );
}

const PureState = React.memo(StatsInner);

export default function Stats() {
  const dimensions = useDimensions();
  const hero = useHero();

  return (
    <PureState padding={dimensions.padding} {...hero?.[COUNTABLE]} {...hero?.[EQUIPPABLE]} />
  );
}
