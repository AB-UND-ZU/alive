import { useHero } from "../../bindings/hooks";
import { createText, none, createStat } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { COUNTABLE, Countable } from "../../engine/components/countable";
import React from "react";

function StatsInner({
  columns,
  ...countable
}: {
  columns: number; } & Countable
) {
  return (
    <header className="Stats">
      {Object.keys(countable).length > 0 ? (
        <>
          <Row
            cells={[
              ...createStat(countable.hp, "hp", true),
              none,
              ...createStat(countable.gold, "gold", true),
              none,
              ...createStat(countable.wood, "wood", true),
              none,
              ...createStat(countable.herb, "herb", true),
              none,
              none,
            ]}
          />
          <Row
            cells={[
              ...createStat(countable.mp, "mp", true),
              none,
              ...createStat(countable.xp, "xp", true),
              none,
              ...createStat(countable.iron, "iron", true),
              none,
              ...createStat(countable.seed, "seed", true),
              none,
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
      <Row
        cells={createText("═".repeat(columns + 1 - (columns % 2)), colors.grey)}
      />
    </header>
  );
}

const PureState = React.memo(StatsInner);

export default function Stats() {
  const dimensions = useDimensions();
  const hero = useHero();

  return (
    <PureState columns={dimensions.columns} {...(hero?.[COUNTABLE] || {})} />
  );
}
