import { useHero, useWorld } from "../../bindings/hooks";
import { createText, none, createStat } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { COUNTABLE, Countable } from "../../engine/components/countable";
import React from "react";
import { Equippable, EQUIPPABLE } from "../../engine/components/equippable";
import { createSprite } from "../Entity/utils";
import { World } from "../../engine";
import { ORIENTABLE } from "../../engine/components/orientable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";

function StatsInner({
  world,
  padding,
  inventory,
  ...stats
}: {
  world: World;
  padding: number;
  inventory: Inventory;
} & Countable &
  Equippable) {
  const { ecs } = useWorld();

  const itemSprites =
    ecs && inventory
      ? inventory.items.map((itemId) => createSprite(ecs, itemId))
      : [];
  const itemRows = [0, 1].map((row) =>
    Array.from({ length: 5 }).map(
      (_, column) => itemSprites[row * 5 + column] || none
    )
  );

  return (
    <header className="Stats">
      {Object.keys(stats).length > 0 ? (
        <>
          <Row
            cells={[
              ...createStat(stats.hp, "hp", true),
              none,
              ...createStat(stats.gold, "gold", true),
              none,
              ...createStat(stats.wood, "wood", true),
              none,
              ...createStat(stats.herb, "herb", true),
              ...createText("│", colors.grey),
              ...itemRows[0],
            ]}
          />
          <Row
            cells={[
              ...createStat(stats.mp, "mp", true),
              none,
              ...createStat(stats.xp, "xp", true),
              none,
              ...createStat(stats.iron, "iron", true),
              none,
              ...createStat(stats.seed, "seed", true),
              ...createText("│", colors.grey),
              ...itemRows[1],
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
        cells={[
          ...createText("═".repeat(padding + 15), colors.grey),
          ...createText("╧", colors.grey),
          ...createText("═".repeat(5 + padding), colors.grey),
        ]}
      />
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
      {...(hero?.[COUNTABLE] || {})}
      inventory={hero?.[INVENTORY]}
      _={[
        ecs &&
          hero?.[EQUIPPABLE] &&
          ecs.getEntityById(hero[EQUIPPABLE].compass)?.[ORIENTABLE]?.facing,
        ...(hero?.[INVENTORY]?.items || []),
      ].join()}
    />
  );
}
