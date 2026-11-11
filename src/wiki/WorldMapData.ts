import { orientationPoints } from "../engine/components/orientable";
import { createPresetWorld, islandPreviewSeed } from "./presets";
import { assertHero } from "../testing/harness";
import { initializeArea } from "../engine/systems/initialize";
import { moveEntity } from "../engine/systems/map";
import { createPopup, openPopup } from "../engine/systems/popup";
import { getSequence } from "../engine/systems/sequence";
import { getIdentifierAndComponents } from "../engine/utils";
import { normalize, signedDistance } from "../game/math/std";
import { Sprite } from "../engine/components/sprite";
import { worldRows } from "./WorldDiagram";
import { popupParticles } from "./DialogSnapshot";

export function prepareIslandMaps() {
  const world = createPresetWorld("island");
  const level = world.metadata.gameEntity.LEVEL;
  const sprites: Sprite[] = [];
  const palette = new Map<string, number>();
  const packSprite = (sprite: Sprite) => {
    const key = JSON.stringify(sprite.layers);
    let index = palette.get(key);
    if (index === undefined) {
      index = sprites.length;
      palette.set(key, index);
      sprites.push({ name: sprite.name, layers: sprite.layers });
    }
    return index;
  };
  const pack = (rows: Sprite[][]) => rows.map((row) => row.map(packSprite));
  const town = (identifier: string) => {
    const owner = getIdentifierAndComponents(world, identifier, [
      "POSITION",
      "SEQUENCABLE",
    ]);
    if (!owner) throw Error(`Missing settlement ${identifier}`);
    const memory = getSequence(world, owner, "npc")!.args.memory;
    const bounds = memory.topLeft
      ? {
          x: memory.topLeft.x - 1,
          y: memory.topLeft.y - 1,
          width:
            normalize(memory.bottomRight.x - memory.topLeft.x, level.size) + 3,
          height:
            normalize(memory.bottomRight.y - memory.topLeft.y, level.size) + 3,
        }
      : {
          x: memory.center.x - Math.ceil(memory.radius / memory.ratio) - 2,
          y: memory.center.y - Math.ceil(memory.radius) - 2,
          width: Math.ceil(memory.radius / memory.ratio) * 2 + 5,
          height: Math.ceil(memory.radius) * 2 + 5,
        };
    if (identifier === "fire_haven") {
      const perimeter = [] as { x: number; y: number }[];
      for (let x = 0; x < level.size; x++)
        for (let y = 0; y < level.size; y++)
          if (level.objects[x][y]?.includes("palisade"))
            perimeter.push({ x, y });
      const guard = world
        .getEntities(["NPC", "POSITION"])
        .find((entity) => entity.NPC.type === "fireJettyGuard");
      const pending = guard ? [guard.POSITION] : [];
      const seen = new Set<string>();
      while (pending.length) {
        const point = pending.pop()!;
        const key = `${point.x},${point.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        perimeter.push(point);
        for (const delta of Object.values(orientationPoints)) {
          const next = {
            x: normalize(point.x + delta.x, level.size),
            y: normalize(point.y + delta.y, level.size),
          };
          if (
            ["jetty_horizontal", "jetty_vertical"].includes(
              level.cells[next.x][next.y]
            )
          )
            pending.push(next);
        }
      }
      const xs = perimeter.map(
        (point) => bounds.x + signedDistance(bounds.x, point.x, level.size)
      );
      const ys = perimeter.map(
        (point) => bounds.y + signedDistance(bounds.y, point.y, level.size)
      );
      const left = Math.min(bounds.x, ...xs.map((x) => x - 2));
      const top = Math.min(bounds.y, ...ys.map((y) => y - 2));
      bounds.width =
        Math.max(bounds.x + bounds.width - 1, ...xs.map((x) => x + 2)) -
        left +
        1;
      bounds.height =
        Math.max(bounds.y + bounds.height - 1, ...ys.map((y) => y + 2)) -
        top +
        1;
      bounds.x = left;
      bounds.y = top;
    }
    initializeArea(
      world,
      {
        x: normalize(bounds.x, level.size),
        y: normalize(bounds.y, level.size),
      },
      {
        x: normalize(bounds.x + bounds.width - 1, level.size),
        y: normalize(bounds.y + bounds.height - 1, level.size),
      }
    );
    const entries = new Map<
      string,
      {
        name: string;
        unit?: string;
        sprite: number;
        tabs: string[];
        count: number;
        lock: boolean;
      }
    >();
    for (const entity of world.getEntities(["POSITION", "SPRITE"])) {
      if (
        normalize(entity.POSITION.x - bounds.x, level.size) >= bounds.width ||
        normalize(entity.POSITION.y - bounds.y, level.size) >= bounds.height ||
        (!entity.NPC &&
          !entity.POPUP &&
          !entity.LOCKABLE &&
          !["Bench", "Anvil", "Kettle"].includes(entity.SPRITE.name))
      )
        continue;
      const name = entity.LOCKABLE
        ? [
            entity.LOCKABLE.material,
            entity.LOCKABLE.element,
            entity.LOCKABLE.type,
          ]
            .flatMap((part) =>
              part ? [part[0].toUpperCase() + part.slice(1)] : []
            )
            .join(" ")
        : entity.SPRITE.name;
      const key = entity.NPC?.type || name;
      const previous = entries.get(key);
      if (previous) {
        previous.count++;
        continue;
      }
      entries.set(key, {
        name: name || key,
        lock: Boolean(entity.LOCKABLE),
        unit: entity.NPC?.type,
        sprite: packSprite(entity.SPRITE),
        tabs: entity.POPUP?.tabs || [],
        count: 1,
      });
    }
    return {
      bounds,
      rows: pack(worldRows(world, { ...bounds, inside: true })),
      legend: [...entries.values()],
    };
  };
  const earth = town("earth_town");
  const fire = town("fire_haven");
  // The native minimap reads terrain without needing to instantiate every cell.
  for (const column of level.initialized) column.fill(true);
  for (const entity of world.getEntities(["FOG"]))
    entity.FOG.visibility = "visible";
  const hero = world.assertComponents(assertHero(world), [
    "POSITION",
    "EQUIPPABLE",
  ]);
  createPopup(world, hero, { tabs: ["map"] });
  openPopup(world, hero, hero);
  hero.POPUP!.verticalIndezes[0] = 3;
  const overview: Sprite[][] = [];
  // Native zoom four spans sixteen world cells per character. Two adjacent
  // popup views cover this 240-cell Island without a second map algorithm.
  for (const y of [-56, 88]) {
    moveEntity(world, hero, { x: 8, y: normalize(y, level.size) });
    world.metadata.gameEntity.RENDERABLE.generation = 2 + overview.length * 4;
    hero.RENDERABLE!.generation++;
    popupParticles(world, hero);
    const state = getSequence(world, hero, "popup")!;
    const remaining = Math.min(9, 15 - overview.length);
    for (let row = 0; row < remaining; row++) {
      overview.push(
        Array.from(
          { length: 15 },
          (_, column) =>
            world.assertByIdAndComponents(
              state.particles[`popup-content-${row}-${column}`],
              ["SPRITE"]
            ).SPRITE
        )
      );
    }
  }
  if (level.size !== 240)
    throw Error("Update the full-Island native map view for this level size");
  return {
    seed: islandPreviewSeed,
    size: level.size,
    sprites,
    overview: pack(overview),
    earth,
    fire,
  };
}
