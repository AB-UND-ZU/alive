import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useWorld } from "../../src/bindings/hooks";
import {
  createAreaWorld,
  createTestWorld,
  giveItems,
} from "../../src/testing/harness";
import { getIdentifier } from "../../src/engine/utils";
import { moveEntity } from "../../src/engine/systems/map";
import { initializeArea } from "../../src/engine/systems/initialize";
import { seedRandom } from "../../src/testing/env";
import { addCell, hold } from "../../src/features/world/helpers";

const records: Record<string, number[]> = {};
let active = false;
(window as any).liveRecord = (key: string, value: number) => {
  if (active) (records[key] ||= []).push(value);
};
const scenario = new URLSearchParams(location.search).get("scene");
export const scenarioFactory =
  !scenario || scenario === "menu"
    ? undefined
    : () => {
        seedRandom(42);
        if (scenario === "door-first" || scenario === "sign-first") {
          return createAreaWorld(
            scenario === "door-first"
              ? "|        |\n|  D♀S   |\n|        |"
              : "|        |\n|  S♀D   |\n|        |",
            { size: 64, legend: { D: "wood_door", S: "guide_sign" } }
          );
        }
        if (scenario === "boat") {
          const world = createAreaWorld(
            "|                |\n|   ≈≈≈≈≈≈≈≈     |\n|  ♀≈≈≈≈≈≈≈≈     |\n|   ≈≈≈≈≈≈≈≈     |\n|                |",
            { size: 64 }
          );
          addCell(world, { x: 3, y: 2 }, "boat");
          return world;
        }
        const world = createTestWorld({
          level:
            scenario === "tutorial"
              ? "LEVEL_TUTORIAL"
              : scenario === "kernel-menu"
              ? "LEVEL_MENU"
              : "LEVEL_ISLAND",
        });
        if (scenario === "kernel" || scenario === "long") {
          for (let i = 0; i < 24; i++) {
            const x = 20 + (i % 6) * 35,
              y = 20 + Math.floor(i / 6) * 50;
            initializeArea(
              world,
              { x: x - 12, y: y - 12 },
              { x: x + 12, y: y + 12 }
            );
          }
          const hero: any = getIdentifier(world, "hero"),
            room: any = getIdentifier(world, "wormRoom"),
            bait: any = getIdentifier(world, "worm_bait");
          hero.STATS.maxHpCap = hero.STATS.maxHp = hero.STATS.hp = 10000;
          moveEntity(world, hero, {
            x: room.POSITION.x,
            y: room.POSITION.y + 5,
          });
          if (scenario === "kernel") bait.STATS.hp = 0;
        }
        if (new URLSearchParams(location.search).has("equipped")) {
          const hero: any = getIdentifier(world, "hero");
          hero.STATS.maxMpCap = hero.STATS.maxMp = hero.STATS.mp = 99;
          giveItems(world, hero, [
            { weapon: "sword", material: "iron", amount: 1 },
            { spell: "beam", material: "wood", element: "fire", amount: 1 },
          ]);
        }
        return world;
      };
export function Live() {
  const context = useWorld();
  const { ecs: world } = context;
  useEffect(() => {
    if (!world) return;
    const original = world.update;
    world.update = (delta) => {
      const t = performance.now();
      try {
        return original(delta);
      } finally {
        (window as any).liveRecord("ecs", performance.now() - t);
      }
    };
    const observer = new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        (window as any).liveRecord("longtask", e.duration);
    });
    observer.observe({ entryTypes: ["longtask"] });
    return () => {
      world.update = original;
      observer.disconnect();
    };
  }, [world]);
  (window as any).live = {
    ...context,
    begin: () => {
      for (const k in records) delete records[k];
      active = true;
    },
    end: () => {
      active = false;
      return {
        records,
        entities: world?.metadata.ecs.entities.length,
        hero: getIdentifier(world!, "hero")?.POSITION,
        heroStats: getIdentifier(world!, "hero")?.STATS,
        equipment: getIdentifier(world!, "hero")?.EQUIPPABLE,
        level: world?.metadata.gameEntity.LEVEL.name,
      };
    },
    kernel: (frames = 600) => {
      for (let i = 0; i < 60; i++) {
        seedRandom(1000 + i);
        world!.update(1000 / 30);
      }
      for (const k in records) delete records[k];
      active = true;
      for (let i = 0; i < frames; i++) {
        seedRandom(2000 + i);
        hold(world!, [
          (["right", "up", "left", "down"] as const)[Math.floor(i / 30) % 4],
        ]);
        world!.update(1000 / 30);
      }
      active = false;
      const value = JSON.stringify(world!.metadata.ecs.entities);
      let hash = 2166136261;
      for (let i = 0; i < value.length; i++)
        hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
      return {
        records,
        hash: hash >>> 0,
        entities: world!.metadata.ecs.entities.length,
      };
    },
    hold: (direction: any) => hold(world!, direction ? [direction] : []),
    boss: () => {
      const hero: any = getIdentifier(world!, "hero");
      const room: any = getIdentifier(world!, "wormRoom");
      if (!hero || !room) throw Error("No worm room");
      hero.STATS.maxHpCap = hero.STATS.maxHp = hero.STATS.hp = 10000;
      const p = { x: room.POSITION.x, y: room.POSITION.y + 5 };
      initializeArea(
        world!,
        { x: p.x - 20, y: p.y - 20 },
        { x: p.x + 20, y: p.y + 20 }
      );
      moveEntity(world!, hero, p);
      return {
        hero: hero.POSITION,
        room: room.POSITION,
        bait: getIdentifier(world!, "worm_bait")?.POSITION,
      };
    },
    startBoss: () => {
      const bait: any = getIdentifier(world!, "worm_bait");
      bait.STATS.hp = 0;
    },
    explore: (x: number, y: number) => {
      const hero: any = getIdentifier(world!, "hero");
      hero.STATS.maxHpCap = hero.STATS.maxHp = hero.STATS.hp = 10000;
      initializeArea(
        world!,
        { x: x - 12, y: y - 12 },
        { x: x + 12, y: y + 12 }
      );
      moveEntity(world!, hero, { x, y });
    },
  };
  return null;
}
export function RenderProbe() {
  const state = useThree();
  useEffect(() => {
    (window as any).liveThree = state;
    const render = state.gl.render;
    state.gl.render = (...args) => {
      (window as any).liveRecord(
        "shadowUpdate",
        Number(state.gl.shadowMap.needsUpdate)
      );
      const t = performance.now();
      const result = render.apply(state.gl, args);
      (window as any).liveRecord("render", performance.now() - t);
      (window as any).liveRecord("draws", state.gl.info.render.calls);
      (window as any).liveRecord("triangles", state.gl.info.render.triangles);
      return result;
    };
    return () => {
      state.gl.render = render;
    };
  }, [state]);
  useFrame(
    (_, delta) => (window as any).liveRecord("frame", delta * 1000),
    -100
  );
  return null;
}
