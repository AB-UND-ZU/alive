import { useFrame } from "@react-three/fiber";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import { Entity as ECSEntity } from "ecs";
import { useRenderable, useWorld } from "../../bindings/hooks";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";

export default function Systems() {
  const { ecs } = useWorld();
  const entities = useRenderable([POSITION, SPRITE, RENDERABLE]);
  
  useFrame((_, delta) => {
    if (!ecs) return null;

    ecs.update(delta * 1000);
    ecs.cleanup();
  });

  if (!ecs) return null;

  return (
    <>
      {entities.map((entity: ECSEntity) => {
        // TODO: fix types of entities
        const typedEntity = entity as {
          [POSITION]: Position;
          [SPRITE]: Sprite;
          [RENDERABLE]: Renderable;
        };
        return (
          <Entity key={ecs.getEntityId(typedEntity)} entity={typedEntity} generation={typedEntity[RENDERABLE].generation} />
        );
      })}
    </>
  );
}
