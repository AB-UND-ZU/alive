import { useFrame } from "@react-three/fiber";
import { animated, useSpring } from "@react-spring/three";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import {
  useGame,
  useHero,
  useOverscan,
  useViewpoint,
  useWorld,
} from "../../bindings/hooks";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";
import { useDimensions } from "../Dimensions";
import { getEntityGeneration } from "../../engine/systems/renderer";
import { getCell } from "../../engine/systems/map";
import { getDistance, random } from "../../game/math/std";
import { LEVEL } from "../../engine/components/level";
import { PLAYER } from "../../engine/components/player";
import { getEnterable, isOutside } from "../../engine/systems/enter";
import { useEffect, useRef } from "react";
import { LAYER } from "../../engine/components/layer";
import { LIGHT } from "../../engine/components/light";
import { FRAGMENT } from "../../engine/components/fragment";
import { MOVABLE } from "../../engine/components/movable";

const shakeFactor = 0.1;
const shakeSpring = { duration: 50 };
const systemsFrame = 1000 / 30;
const catchupFrames = 15;

export default function Systems() {
  const { ecs, paused, suspended } = useWorld();
  const dimensions = useDimensions();
  const { position, fraction, viewable } = useViewpoint();
  const overscan = useOverscan(position.x, position.y);
  const game = useGame();
  const hero = useHero();
  const structure = hero?.[LAYER]?.structure;
  const damageRef = useRef(0);
  const damageReceived =
    (hero?.[PLAYER].receivedStats.melee || 0) +
    (hero?.[PLAYER].receivedStats.magic || 0);
  const [values, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: shakeSpring,
    pause: paused,
  }));
  const elapsedRef = useRef(systemsFrame);

  useFrame((_, delta) => {
    if (!ecs || paused || suspended) return;

    elapsedRef.current += Math.min(delta * 1000, systemsFrame * catchupFrames);

    while (elapsedRef.current >= systemsFrame) {
      ecs.update(systemsFrame);
      ecs.cleanup();
      elapsedRef.current -= systemsFrame;
    }
  });

  // sync paused status
  useEffect(() => {
    if (paused || suspended) {
      elapsedRef.current = 0;
      api.pause();
    } else {
      api.resume();
    }
  }, [api, paused, suspended]);

  useEffect(() => {
    // shake screen on damage
    const shakeIntensity = damageReceived - damageRef.current;

    if (hero && shakeIntensity > 0) {
      damageRef.current =
        hero[PLAYER].receivedStats.melee + hero[PLAYER].receivedStats.magic;
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

  if (!ecs || !game) return null;

  const size = ecs.metadata.gameEntity[LEVEL].size;
  const flyingPadding = viewable?.[MOVABLE]?.flying ? 4 : 0;
  const fractionX = Math.sign(fraction.x);
  const fractionY = Math.sign(fraction.y);

  return (
    <animated.group position-x={values.x} position-y={values.y}>
      {Array.from({
        length:
          dimensions.renderedColumns +
          Math.abs(overscan.x) +
          Math.abs(fractionX) +
          flyingPadding,
      })
        .map((_, x) =>
          Array.from({
            length:
              dimensions.renderedRows +
              Math.abs(overscan.y) +
              Math.abs(fractionX) +
              flyingPadding,
          })
            .map((_, y) => {
              const offsetX = dimensions.renderedColumns % 2;
              const renderedX =
                x -
                (dimensions.renderedColumns - offsetX) / 2 +
                position.x -
                Math.max(0, overscan.x) -
                Math.max(0, fractionX) -
                flyingPadding / 2;

              const offsetY = dimensions.renderedRows % 2;
              const renderedY =
                y -
                (dimensions.renderedRows - offsetY) / 2 +
                position.y -
                Math.max(0, overscan.y) -
                Math.max(0, fractionY) -
                flyingPadding / 2;

              const renderedPosition = { x: renderedX, y: renderedY };
              const cell = getCell(ecs, renderedPosition);
              const inside =
                !!structure &&
                getEnterable(ecs, renderedPosition)?.[FRAGMENT]?.structure ===
                  structure;
              const entities = Object.entries(cell);

              const renderableEntities = entities.filter(
                ([_, entity]) => RENDERABLE in entity && SPRITE in entity
              );
              return renderableEntities.map(([entityId, entity]) => (
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
                  outside={!inside && isOutside(ecs, entity, structure)}
                  inside={inside}
                  generation={getEntityGeneration(ecs, entity)}
                />
              ));
            })
            .flat()
        )
        .flat()}
    </animated.group>
  );
}
