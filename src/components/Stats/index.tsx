import { useHero } from "../../bindings/hooks";
import {
  createText,
  coin,
  heart,
  herb,
  mana,
  none,
  seed,
  wood,
  xp,
  ironDisplay,
} from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { COUNTABLE, Countable } from "../../engine/components/countable";
import React from "react";
import { Sprite } from "../../engine/components/sprite";

const stat = (count: number, color: string) =>
  createText(
    Math.min(count || 0, 99)
      .toString()
      .padStart(2, " "),
    color
  );
const nonCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.layers,
});

function StatsInner({
  columns,
  ...countable
}: { columns: number } & Countable) {
  return (
    <header className="Stats">
      <Row
        cells={[
          ...stat(countable.hp, colors.red),
          heart,
          none,
          ...stat(countable.gold, colors.yellow),
          nonCountable(coin),
          none,
          ...stat(countable.wood, colors.maroon),
          wood,
          none,
          ...stat(countable.herb, colors.teal),
          herb,
          none,
          none,
        ]}
      />
      <Row
        cells={[
          ...stat(countable.mp, colors.blue),
          mana,
          none,
          ...stat(countable.xp, colors.lime),
          nonCountable(xp),
          none,
          ...stat(countable.iron, colors.grey),
          ironDisplay,
          none,
          ...stat(countable.seed, colors.purple),
          seed,
          none,
          none,
        ]}
      />
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
