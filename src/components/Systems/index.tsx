import { useFrame } from "@react-three/fiber";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import { useGame, useHero, useWorld } from "../../bindings/hooks";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";
import { useDimensions } from "../Dimensions";
import { Level, LEVEL } from "../../engine/components/level";
import { normalize } from "../../game/math/std";
import { getEntityGeneration } from "../../engine/systems/renderer";

export default function Systems() {
  const { ecs } = useWorld();
  const dimensions = useDimensions();
  const hero = useHero();
  const game = useGame();

  useFrame((_, delta) => {
    if (!ecs) return null;

    ecs.update(delta * 1000);
    ecs.cleanup();
  });

  if (!ecs || !hero || !game) return null;

  const map = game[LEVEL].map as Level["map"];
  const position = hero[POSITION];

  return (
    <>
      {Array.from({ length: dimensions.renderedColumns })
        .map((_, x) =>
          Array.from({ length: dimensions.renderedRows })
            .map((_, y) => {
              const offsetX = dimensions.renderedColumns % 2;
              const renderedX =
                x - (dimensions.renderedColumns - offsetX) / 2 + position.x;
              const normalizedX = normalize(renderedX, dimensions.mapSize);

              const offsetY = dimensions.renderedRows % 2;
              const renderedY =
                y - (dimensions.renderedRows - offsetY) / 2 + position.y;
              const normalizedY = normalize(renderedY, dimensions.mapSize);

              const entities = Object.entries(
                map[normalizedX]?.[normalizedY] || {}
              );

              const renderableEntities = entities.filter(
                ([_, entity]) => RENDERABLE in entity
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
                  generation={getEntityGeneration(ecs, entity)}
                />
              ));
            })
            .flat()
        )
        .flat()}
    </>
  );
}
