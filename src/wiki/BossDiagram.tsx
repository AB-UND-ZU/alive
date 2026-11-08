import { useState } from "react";
import { UnitKey } from "../game/balancing/units";
import { createAreaWorld, assertHero, advanceUntil } from "../testing/harness";
import { initializeArea } from "../engine/systems/initialize";
import { preloadLevel } from "../engine/ecs";
import { disposeEntity } from "../engine/systems/map";
import { createCell } from "../bindings/creation";
import { ilexArea, oakArea } from "../game/levels/island/areas";
import { up4Area, tutorialRooms } from "../game/levels/tutorial/areas";
import { WorldDiagram, worldRows } from "./WorldDiagram";
import { Pixels } from "./visuals";
import { createText } from "../game/assets/ui";
import { getLimbs } from "../engine/systems/damage";
import { colors } from "../game/assets/colors";

export const createBossWorld = (key: UnitKey, activated = false) => {
  const area =
    key === "ilexElite"
      ? ilexArea
      : key === "oakBoss"
      ? oakArea
      : key === "tutorialBoss"
      ? up4Area
      : undefined;
  const rows = area?.split("\n");
  const width = Math.max(11, ...(rows || []).map((row) => row.length));
  const height = rows?.length || 9;
  const room = rows
    ? "♀".padEnd(width, "?") + "\n" + area
    : "♀" + " ".repeat(width - 1);
  const world = createAreaWorld(
    room
      .split("\n")
      .map((row) => "|" + row.padEnd(width, "?") + "|")
      .join("\n"),
    { size: 64 }
  );
  initializeArea(world, { x: 0, y: 0 }, { x: width - 1, y: height });
  if (!area || key === "tutorialBoss") {
    const room = tutorialRooms.find((room) => room.name === "north4")!;
    const wave = room.waves![0].position;
    const created = createCell(
      world,
      key === "tutorialBoss"
        ? {
            x: (width - 1) / 2 + wave.x - room.offsetX,
            y: (height - 1) / 2 + 1 + wave.y - room.offsetY,
          }
        : { x: Math.floor(width / 2), y: Math.floor(height / 2) },
      key === "wormBoss" ? "worm_boss" : key,
      "visible"
    );
    if (key === "wormBoss" && created.cell?.ORIENTABLE)
      created.cell.ORIENTABLE.facing = "right";
  }
  for (const entity of world.getEntities(["BEHAVIOUR"]))
    if (key !== "golem" || entity.NPC?.type !== "golem")
      entity.BEHAVIOUR.patterns = [];
  if (key === "golem") {
    const golem = world
      .getEntities(["NPC", "STATS", "BEHAVIOUR"])
      .find((entity) => entity.NPC.type === "golem")!;
    advanceUntil(world, () =>
      getLimbs(world, golem).every(
        (limb) => limb.BELONGABLE?.faction === "unit"
      )
    );
    if (activated) {
      golem.STATS.hp -= 1;
      advanceUntil(world, () =>
        golem.BEHAVIOUR.patterns.some(
          (pattern) =>
            pattern.name === "golem" && (pattern.memory.phase || 0) >= 6
        )
      );
    }
    for (const entity of world.getEntities(["BEHAVIOUR"]))
      entity.BEHAVIOUR.patterns = [];
  }
  preloadLevel(world);
  disposeEntity(world, assertHero(world), false);
  return {
    world,
    bounds: { x: 0, y: area ? 1 : 0, width, height },
    hasRoom: !!area,
  };
};

export const bossDiagrams = (key: UnitKey, activated = false) => {
  const { world, bounds, hasRoom } = createBossWorld(key, activated);
  const diagram = worldRows(world, bounds);
  if (hasRoom) return diagram;
  const occupied = diagram.flatMap((row, y) =>
    row.flatMap((sprite, x) =>
      sprite.layers.some(
        (layer) => layer.color !== "#000000" && layer.char.trim()
      )
        ? [{ x, y }]
        : []
    )
  );
  if (!occupied.length) return [];
  const left = Math.min(...occupied.map(({ x }) => x));
  const right = Math.max(...occupied.map(({ x }) => x));
  const top = Math.min(...occupied.map(({ y }) => y));
  const bottom = Math.max(...occupied.map(({ y }) => y));
  return diagram
    .slice(top, bottom + 1)
    .map((row) => row.slice(left, right + 1));
};
export function BossDiagram({ unit }: { unit: UnitKey }) {
  const [diagrams] = useState(() =>
    unit === "golem"
      ? [bossDiagrams(unit), bossDiagrams(unit, true)]
      : [bossDiagrams(unit)]
  );
  return (
    <div className="BossDiagram">
      {unit === "golem" ? (
        <div>
          <Pixels rows={[createText("Idle Awake", colors.white)]} />
          <div style={{ display: "flex", gap: "var(--cell-width)" }}>
            {diagrams.map((rows, index) => (
              <div
                key={index}
                style={{ width: `calc(var(--cell-width) * ${index ? 5 : 4})` }}
              >
                <WorldDiagram
                  rows={rows}
                  label={
                    index
                      ? "Awake Golem body and limbs"
                      : "Dormant Golem stones"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <WorldDiagram rows={diagrams[0]} label={unit + " room and fragments"} />
      )}
    </div>
  );
}
