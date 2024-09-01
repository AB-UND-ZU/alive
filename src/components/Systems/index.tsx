import { useFrame } from "@react-three/fiber";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import { useGame, useViewable, useWorld } from "../../bindings/hooks";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";
import { useDimensions } from "../Dimensions";
import { getEntityGeneration } from "../../engine/systems/renderer";
import { getCell } from "../../engine/systems/map";

export default function Systems() {
  const { ecs } = useWorld();
  const dimensions = useDimensions();
  const viewable = useViewable();
  const game = useGame();

  useFrame((_, delta) => {
    if (!ecs) return null;

    ecs.update(delta * 1000);
    ecs.cleanup();
  });

  if (!ecs || !viewable || !game) return null;

  const position = viewable[POSITION];

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

              const cell = getCell(ecs, { x: renderedX, y: renderedY });
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
