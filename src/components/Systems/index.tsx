import { useFrame } from "@react-three/fiber";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import { useGame, useHero, useWorld } from "../../bindings/hooks";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";
import { useDimensions } from "../Dimensions";
import { Level, LEVEL } from "../../engine/components/level";

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

  const map = game[LEVEL].map as Level['map'];
  const position = hero[POSITION];

  return (
    <>
      {Array.from({ length: dimensions.renderedColumns })
        .map((_, x) =>
          Array.from({ length: dimensions.renderedRows })
            .map((_, y) =>
              Object.entries(
                map[
                  (x -
                    (dimensions.renderedColumns - 1) / 2 +
                    position.x +
                    dimensions.mapSize) %
                    dimensions.mapSize
                ]?.[
                  (y -
                    (dimensions.renderedRows - 1) / 2 +
                    position.y +
                    dimensions.mapSize) %
                    dimensions.mapSize
                ] || {}
              ).map(([entityId, entity]) => (
                <Entity
                  key={entityId}
                  entity={
                    entity as {
                      [POSITION]: Position;
                      [SPRITE]: Sprite;
                      [RENDERABLE]: Renderable;
                    }
                  }
                  generation={entity[RENDERABLE].generation}
                />
              ))
            )
            .flat()
        )
        .flat()}
    </>
  );
}
