import { useFrame } from "@react-three/fiber";
import { animated, useSpring } from "@react-spring/three";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import { useGame, useHero, useViewpoint, useWorld } from "../../bindings/hooks";
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

const shakeFactor = 0.1;
const shakeSpring = { duration: 50 };

export default function Systems() {
  const { ecs, paused } = useWorld();
  const dimensions = useDimensions();
  const { position } = useViewpoint();
  const game = useGame();
  const hero = useHero();
  const structure = hero?.[LAYER]?.structure;
  const damageRef = useRef(0);
  const damageReceived = hero?.[PLAYER].damageReceived || 0;
  const [values, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: shakeSpring,
    pause: paused,
  }));

  useFrame((_, delta) => {
    if (!ecs || paused) return;

    ecs.update(delta * 1000);
    ecs.cleanup();
  });

  useEffect(() => {
    // shake screen on damage
    const shakeIntensity = damageReceived - damageRef.current;
    if (hero && shakeIntensity > 0) {
      damageRef.current = hero[PLAYER].damageReceived;
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

  return (
    <animated.group position-x={values.x} position-y={values.y}>
      {Array.from({ length: dimensions.renderedColumns })
        .map((_, x) =>
          Array.from({ length: dimensions.renderedRows })
            .map((_, y) => {
              const offsetX = dimensions.renderedColumns % 2;
              const renderedX =
                x - (dimensions.renderedColumns - offsetX) / 2 + position.x;

              const offsetY = dimensions.renderedRows % 2;
              const renderedY =
                y - (dimensions.renderedRows - offsetY) / 2 + position.y;

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
                    getDistance(position, entity[POSITION], size) <
                    (hero?.[LIGHT]?.brightness || Infinity)
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
