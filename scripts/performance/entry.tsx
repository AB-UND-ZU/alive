import React, { useLayoutEffect } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  Canvas,
  useThree,
  useFrame,
  flushSync as flushThree,
} from "@react-three/fiber";
import { raf } from "@react-spring/rafz";
import { Globals } from "@react-spring/three";
import * as THREE from "three";
import Dimensions from "../../src/components/Dimensions";

import { useWorld } from "../../src/bindings/hooks";
import World from "../../src/components/World";
import Stats from "../../src/components/Stats";
import Paused from "../../src/components/Paused";
import Controls from "../../src/components/Controls";
import Camera from "../../src/components/Camera";
import Systems from "../../src/components/Systems";
import { InstanceRoot } from "../../src/components/Entity/Instances";
import ShadowCache from "../../src/components/Entity/ShadowCache";
import {
  createAreaWorld,
  createTestWorld,
  trigger,
} from "../../src/testing/harness";

import { findPath, findPathSimple } from "../../src/game/math/path";
import { seedRandom } from "../../src/testing/env";
import {
  createArea,
  createSpellWorld,
} from "../../src/features/spells/helpers";
import { assignBuilding } from "../../src/bindings/creation";
import { createSnapshot, restoreSnapshot } from "../../src/engine/snapshot";
import { createSystems, preloadLevel } from "../../src/engine/ecs";
import { hold, interactAsPlayer } from "../../src/features/world/helpers";
import { moveEntity } from "../../src/engine/systems/map";
import { rerenderEntity } from "../../src/engine/systems/renderer";
import { createRng } from "../../src/game/math/rng";
import "../../src/index.css";
import "../../src/components/App/index.css";
import "../../src/components/Terminal/index.css";

const params = new URLSearchParams(location.search);
let clock = 0;
Globals.assign({
  skipAnimation: !params.has("animate"),
  frameLoop: "demand",
  now: () => clock,
});
const level =
  params.get("level") === "menu"
    ? "LEVEL_MENU"
    : params.get("level") === "island"
    ? "LEVEL_ISLAND"
    : "LEVEL_TUTORIAL";
seedRandom(42);
const samples: Record<string, number[]> = {};
const record = (key: string, duration: number) =>
  (samples[key] ||= []).push(duration);
let collecting = false;
let stepWorld: (frames: number) => void;
let mountEpoch = 0;
let nextSnapshot: ReturnType<typeof createSnapshot> | undefined;
let world: ReturnType<typeof createTestWorld>;
const makeWorld = () => {
  seedRandom(42);
  const scene = params.get("scene");
  if (nextSnapshot) {
    world = restoreSnapshot(nextSnapshot);
    nextSnapshot = undefined;
    createSystems(world);
    preloadLevel(world);
  } else if (scene === "water" || scene === "seam") {
    const rows = Array.from({ length: 15 }, () => Array(30).fill(" "));
    if (scene === "water")
      for (let x = 10; x <= 15; x++)
        for (let y = 3; y <= 11; y++) rows[y][x] = "~";
    rows[7][scene === "water" ? 16 : 1] = "♀";
    rows[4][20] = "#";
    rows[5][20] = "█";
    world = createAreaWorld(
      rows.map((row) => "|" + row.join("") + "|").join("\n"),
      { size: 64 }
    );
  } else if (scene === "house") {
    const rows = [
      "          ",
      " ╒╦╦╕     ",
      " ╠╬╬╣     ",
      " ╞╪╪╡     ",
      " └D┴┘     ",
      "  ♀       ",
      "          ",
    ];
    world = createAreaWorld(rows.map((row) => "|" + row + "|").join("\n"), {
      size: 64,
      legend: { D: "wood_door" },
    });
    assignBuilding(world, { x: 3, y: 2 });
  } else if (scene === "spells") {
    world = createSpellWorld(
      createArea(30, 15, {
        "♀": { x: 5, y: 7 },
        D: { x: 8, y: 7 },
        "#": { x: 16, y: 7 },
      }),
      { spell: "wave", material: "wood" },
      { size: 64, mp: 99 }
    ).world;
  } else world = createTestWorld({ level });
  const update = world.update;
  let manualFrame = 0;
  stepWorld = (frames) => {
    for (let i = 0; i < frames; i++) {
      seedRandom(1000 + manualFrame++);
      update(1000 / 30);
    }
  };
  world.update = (delta) => {
    const start = performance.now();
    if (params.has("static"))
      Object.values(world.metadata.listeners).forEach((listener) => listener());
    else update(delta);
    if (collecting) record("ecs", performance.now() - start);
  };
  world.metadata.ecs.systems.forEach((system, i) => {
    const update = system.onUpdate;
    system.onUpdate = (delta) => {
      const start = performance.now();
      update(delta);
      if (collecting) record(`system${i}`, performance.now() - start);
    };
  });
  return world;
};
function Start() {
  const { setPaused } = useWorld();
  useLayoutEffect(() => {
    setPaused(false);
  }, [setPaused]);
  return null;
}
function Probe() {
  const { paused } = useWorld();
  const state = useThree();
  useLayoutEffect(() => {
    const gl = state.gl;
    const context = gl.getContext();
    const originalUpload = context.bufferSubData;
    context.bufferSubData = function (...args: any[]) {
      if (collecting) {
        const data = args[2];
        const bytes =
          args[4] === undefined
            ? data.byteLength - (args[3] || 0) * (data.BYTES_PER_ELEMENT || 1)
            : args[4] * (data.BYTES_PER_ELEMENT || 1);
        record("uploadBytes", bytes);
      }
      return originalUpload.apply(this, args as any);
    } as any;
    const render = gl.render.bind(gl);
    const originalRender = gl.render;
    gl.render = (...args) => {
      const start = performance.now();
      render(...args);
      if (collecting) record("render", performance.now() - start);
    };
    (window as any).bench = {
      state,
      paused,
      epoch: mountEpoch,
      step: (frames: number) => flushThree(() => stepWorld(frames)),
      world,
      samples,
      begin: () => {
        Object.keys(samples).forEach((key) => delete samples[key]);
        state.internal.subscribers.forEach((subscriber, index) => {
          const original = subscriber.ref.current;
          if ((original as any).measured) return;
          const measured = (...args: any[]) => {
            const start = performance.now();
            original(...(args as [any, number, any]));
            if (collecting)
              record("callback" + index, performance.now() - start);
          };
          (measured as any).measured = true;
          subscriber.ref.current = measured;
        });
        collecting = true;
      },
      end: () => {
        collecting = false;
        return {
          samples,
          info: gl.info,
          objects: count(),
          entities: world.metadata.ecs.entities.length,
          renderer: gl.getContext().getParameter(gl.getContext().RENDERER),
        };
      },
      timerBenchmark: () => {
        const node = document.createElement("div");
        node.style.display = "none";
        document.body.appendChild(node);
        const root = createRoot(node);
        for (let i = 0; i < 20; i++)
          flushSync(() => root.render(<Stats key={i} />));
        flushSync(() => root.unmount());
        node.remove();
      },
      advance: async (frames = 120) => {
        for (let i = 0; i < frames; i++) {
          clock += 1000 / 60;
          raf.advance();
          flushThree(() => {});
          if (i % 10 === 0)
            await new Promise((resolve) => setTimeout(resolve, 0));
          else await Promise.resolve();
        }
      },
      capture: () => {
        for (const subscriber of state.internal.subscribers)
          subscriber.ref.current(state, 0, undefined);
        gl.render(state.scene, state.camera);
        return gl.domElement.toDataURL("image/png").split(",")[1];
      },
      renderState: () => {
        const objects: any[] = [];
        state.scene.traverse((object: any) => {
          if (!object.isMesh || object.isInstancedMesh) return;
          objects.push({
            char: object.userData.char,
            position: object.matrixWorld.elements.slice(12, 15),
            opacity: object.material.opacity,
            visible: object.visible,
            color: object.material.color?.getHex(),
          });
        });
        return objects;
      },
      observe: () =>
        Object.fromEntries(
          ["CASTABLE", "PARTICLE", "REVIVABLE", "SOUL", "SWIMMABLE"].map(
            (key) => [key, world.getEntities([key as any]).length]
          )
        ),
      trigger: (action: any) => trigger(world, action),
      remount: (restore = false) => {
        if (restore) nextSnapshot = createSnapshot(world);
        mountEpoch++;
        flushSync(renderApp);
      },
      hero: () => {
        const hero = world.getEntities(["PLAYER", "POSITION"])[0];
        return {
          position: hero?.POSITION,
          swimming: hero?.SWIMMABLE?.swimming,
          layer: hero?.LAYER,
          hp: hero?.STATS?.hp,
          spell: hero?.EQUIPPABLE?.spell,
        };
      },
      action: (name: string) => {
        const hero = world.getEntities(["PLAYER", "POSITION"])[0];
        if (name === "die") hero.STATS.hp = 0;
        if (name === "damage") {
          hero.STATS.maxHp = 20;
          hero.STATS.hp = 5;
          rerenderEntity(world, hero);
        }
        if (name === "zoom") {
          world.metadata.dimensions = { ...world.metadata.dimensions };
        }
        if (name === "open" || name === "revive") interactAsPlayer(world);
        if (name === "light") {
          hero.LIGHT.brightness = 2;
          rerenderEntity(world, hero);
        }
        if (name === "spell") {
          hero.STATS.mp = 99;
          hero.STATS.maxMp = 99;
          hero.ORIENTABLE.facing = "right";
          trigger(world, "spell");
        }
        if (name === "fog") {
          moveEntity(world, hero, {
            x: hero.POSITION.x + 10,
            y: hero.POSITION.y,
          });
          rerenderEntity(world, hero);
        }
      },
      stateSnapshot: () =>
        world
          .getEntities(["POSITION"])
          .map((entity) => [
            world.getEntityId(entity),
            entity.POSITION,
            entity.FOG,
            entity.SPRITE?.name,
            entity.STATS,
            entity.LAYER,
            entity.SWIMMABLE,
            entity.ORIENTABLE,
            entity.LOCKABLE,
          ])
          .sort((a, b) => a[0] - b[0]),
      paths: (size: number, kind: string) => {
        const random = createRng(73);
        const matrix = Array.from({ length: size }, () =>
          Array.from({ length: size }, () =>
            kind === "blocked" ? 1 : random() < 0.12 ? 0 : 1
          )
        );
        if (kind === "blocked") {
          matrix[size - 3][size - 2] = 0;
          matrix[size - 2][size - 3] = 0;
          matrix[size - 1][size - 2] = 0;
          matrix[size - 2][size - 1] = 0;
        }
        const times = [],
          routes = [];
        for (let i = 0; i < 80; i++) {
          const start = { x: 5 + (i % 9), y: 6 + (i % 7) };
          const target =
            kind === "short" || kind === "wrapped"
              ? { x: start.x + 8, y: start.y + 5 }
              : { x: size - 2, y: size - 2 };
          if (kind !== "blocked") {
            matrix[start.x][start.y] = 1;
            matrix[target.x][target.y] = 1;
          }
          const t = performance.now();
          let route;
          for (let repeat = 0; repeat < 10; repeat++)
            route =
              kind === "wrapped"
                ? findPath(matrix, start, target)
                : findPathSimple(matrix, start, target);
          if (i >= 20) {
            times.push((performance.now() - t) / 10);
            routes.push(route);
          }
        }
        return { times, routes };
      },
      cpu: (mode: string, repetitions = 1000, rounds = 15) => {
        const scene = state.scene;
        const sync = state.internal.subscribers.find((s) => s.priority === 0)!
          .ref.current;
        const samples = [];
        for (let round = 0; round < rounds; round++) {
          const start = performance.now();
          for (let i = 0; i < repetitions; i++) {
            if (mode === "moving")
              (
                scene.children.find(
                  (object) =>
                    object.type === "Group" && object.name !== "instances"
                ) || scene
              ).position.x = (i % 7) / 10;
            if (mode === "matrix") scene.updateMatrixWorld();
            else sync(state, 0, undefined);
          }
          samples.push((performance.now() - start) / repetitions);
        }
        return samples;
      },
      move: (direction: any) => hold(world, direction ? [direction] : []),
    };
    function count() {
      let count = 0;
      state.scene.traverse(() => count++);
      return count;
    }
    return () => {
      gl.render = originalRender;
      context.bufferSubData = originalUpload;
      if ((window as any).bench?.state === state) delete (window as any).bench;
    };
  }, [state, paused]);
  useFrame((_, delta) => {
    if (collecting) record("frame", delta * 1000);
  }, -100);
  return null;
}
const appRoot = createRoot(document.getElementById("root")!);
const renderApp = () =>
  appRoot.render(
    <Dimensions className="App">
      <World key={mountEpoch} createInitialWorld={makeWorld} persistent={false}>
        <Start />
        <Stats />
        <main className="Terminal">
          <Canvas shadows="basic" flat>
            <Probe />

            <InstanceRoot />
            <ShadowCache />
            <ambientLight intensity={Math.PI / 8} />
            <Camera />
            <Systems />
          </Canvas>
          <Paused />
        </main>
        <Controls />
      </World>
    </Dimensions>
  );
renderApp();
