import { useFrame } from "@react-three/fiber";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import { useGame, useHero, useViewpoint, useWorld } from "../../bindings/hooks";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";
import { useDimensions } from "../Dimensions";
import { getEntityGeneration } from "../../engine/systems/renderer";
import { getCell } from "../../engine/systems/map";
import { getDistance } from "../../game/math/std";
import { LEVEL } from "../../engine/components/level";
import { PLAYER } from "../../engine/components/player";
import { getEnterable, isOutside } from "../../engine/systems/enter";
import { ENTERABLE } from "../../engine/components/enterable";

export default function Systems() {
  const { ecs, paused } = useWorld();
  const dimensions = useDimensions();
  const { position, radius } = useViewpoint();
  const game = useGame();
  const hero = useHero();

  useFrame((_, delta) => {
    if (!ecs || paused) return;

    ecs.update(delta * 1000);
    ecs.cleanup();
  });

  if (!ecs || !game) return null;

  const size = ecs.metadata.gameEntity[LEVEL].size;

  return (
    <>
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
              const inside = !!getEnterable(ecs, renderedPosition)?.[ENTERABLE]
                .inside;
              const entities = Object.entries(cell);

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
                  inRadius={
                    getDistance(position, entity[POSITION], size) < radius
                  }
                  outside={!!hero?.[PLAYER]?.inside && isOutside(ecs, entity)}
                  inside={inside}
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
