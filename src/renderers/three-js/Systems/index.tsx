import { useFrame } from "@react-three/fiber";
import { animated, useSpring } from "@react-spring/three";
import { Position, POSITION } from "../../../engine/components/position";
import { Sprite, SPRITE } from "../../../engine/components/sprite";
import Entity from "../Entity";
import {
  useGame,
  useHero,
  useOverscan,
  useRenderable,
  useViewpoint,
  useWorld,
} from "../../interface/hooks";
import { Renderable, RENDERABLE } from "../../../engine/components/renderable";
import { useDimensions } from "../../../components/Dimensions";
import { getEntityGeneration } from "../../../engine/systems/renderer";
import { getCell } from "../../../engine/systems/map";
import { traceCircularVisiblity } from "../../../game/math/tracing";
import { getDistance, random } from "../../../game/math/std";
import { LEVEL } from "../../../engine/components/level";
import { PLAYER } from "../../../engine/components/player";
import { isOutside } from "../../../engine/systems/enter";
import { useEffect, useMemo, useRef } from "react";
import { createFrameClock } from "../../interface/clock";
import { collectScene } from "../../interface/scene";
import { LAYER } from "../../../engine/components/layer";
import { LIGHT } from "../../../engine/components/light";
import { VIEWABLE } from "../../../engine/components/viewable";
import { orientationPoints } from "../../../engine/components/orientable";

const shakeFactor = 0.1;
const shakeSpring = { duration: 50 };


export default function Systems() {
  const { ecs, paused, suspended } = useWorld();
  const dimensions = useDimensions();
  const { position, fraction, viewable, jump } = useViewpoint();
  const overscan = useOverscan(position.x, position.y, suspended || jump);
  const game = useGame();
  const hero = useHero() || ecs?.getEntities([RENDERABLE, PLAYER, POSITION])[0];
  const heroX = hero?.[POSITION].x || 0;
  const heroY = hero?.[POSITION].y || 0;
  const brightness = hero?.[LIGHT]?.brightness || 0;
  const occlusionGeneration = ecs?.metadata.occlusionGeneration || 0;
  const shadowCasters = useMemo(() => {
    const casters = new Set<number>();
    if (!ecs || !hero || brightness <= 0) return casters;

    // Prepare blockers before the light moves into a neighboring cell.
    for (const offset of [{ x: 0, y: 0 }, ...Object.values(orientationPoints)]) {
      const origin = { x: heroX + offset.x, y: heroY + offset.y };
      for (const point of traceCircularVisiblity(ecs, origin, brightness)) {
        const cell = getCell(ecs, point);
        for (const id in cell) {
          if (cell[id][LIGHT]?.darkness > 0) casters.add(Number(id));
        }
      }
    }
    return casters;
    // Walls can change without changing the light coordinates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ecs,
    hero,
    heroX,
    heroY,
    brightness,
    occlusionGeneration,
  ]);
  const structure = hero?.[LAYER]?.structure;
  const damageReceived =
    (hero?.[PLAYER].receivedStats.melee || 0) +
    (hero?.[PLAYER].receivedStats.magic || 0) +
    (hero?.[PLAYER].receivedStats.true || 0);
  const damageRef = useRef<number>();
  const [values, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: shakeSpring,
    pause: paused,
  }));
  const clock = useMemo(() => (ecs ? createFrameClock(ecs) : undefined), [ecs]);
  const stickyCastables = useRef<Record<number, Position>>({});

  // rerender on explicit systems updates
  useRenderable([RENDERABLE], "renderer");

  useFrame((_, delta) => {
    if (!ecs || paused || suspended || !clock) return;

    clock.advance(delta * 1000);

    const quake = viewable?.[VIEWABLE].quake;
    if (quake !== undefined && game && quake > game[RENDERABLE].generation) {
      api.start({
        to: async (next) => {
          await next({
            x: random(-3, 3) * shakeFactor,
            y: random(-3, 3) * shakeFactor,
          });
          await next({ x: 0, y: 0 });
        },
      });
    }
  }, -2);

  // sync paused status
  useEffect(() => {
    if (paused || suspended) {
      clock?.reset();
      api.pause();
    } else {
      api.resume();
    }
  }, [api, paused, suspended, clock]);

  useEffect(() => {
    // don't shake for damage received before loading a saved game
    if (hero && damageRef.current === undefined) {
      damageRef.current = damageReceived;
      return;
    }

    // shake screen on damage
    const shakeIntensity = damageReceived - (damageRef.current || 0);

    if (hero && shakeIntensity > 0) {
      damageRef.current =
        hero[PLAYER].receivedStats.melee +
        hero[PLAYER].receivedStats.magic +
        hero[PLAYER].receivedStats.true;
      const shakeDistance = (Math.sqrt(shakeIntensity) + 1) * shakeFactor;
      const shakeAngle = random(0, 359);
      const shakeX = Math.sin((shakeAngle / 360) * Math.PI * 2) * shakeDistance;
      const shakeY = Math.cos((shakeAngle / 360) * Math.PI * 2) * shakeDistance;

      api.start({
        to: async (next) => {
          await next({
            delay: 50,
            x: shakeX,
            y: shakeY,
          });
          await next({
            x: 0,
            y: 0,
          });
        },
      });
    } else if (shakeIntensity < 0) {
      // reset damage counter if hero dies
      damageRef.current = 0;
    }
  }, [hero, damageReceived, api, dimensions.aspectRatio]);

  if (!ecs || !game || suspended) return null;

  const size = ecs.metadata.gameEntity[LEVEL].size;
  const renderableEntities = collectScene(
    ecs,
    {
      position,
      fraction,
      overscan,
      columns: dimensions.renderedColumns,
      rows: dimensions.renderedRows,
      viewable,
      structure,
    },
    stickyCastables.current
  );

  return (
    <animated.group position-x={values.x} position-y={values.y}>
      {renderableEntities.map(
        ([renderedX, renderedY, inside, entityId, entity]) => (
          <Entity
            key={entityId}
            entity={
              entity as {
                [POSITION]: Position;
                [SPRITE]: Sprite;
                [RENDERABLE]: Renderable;
              }
            }
            x={renderedX}
            y={renderedY}
            inRadius={
              getDistance(
                hero?.[POSITION] || position,
                entity[POSITION],
                size
              ) < (hero?.[LIGHT]?.brightness || Infinity)
            }
            castShadow={shadowCasters.has(Number(entityId))}
            outside={!inside && isOutside(ecs, entity, structure)}
            inside={inside}
            generation={getEntityGeneration(ecs, entity)}
          />
        )
      )}
    </animated.group>
  );
}
