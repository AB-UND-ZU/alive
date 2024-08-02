import { useFrame } from "@react-three/fiber";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import { useWorld } from "../World";
import { useRenderable } from "../World/hooks";
import { Entity as ECSEntity } from "ecs";

export default function Systems() {
  const { world } = useWorld();
  const entities = useRenderable([POSITION, SPRITE]);
  
  useFrame((_, delta) => {
    if (!world) return null;

    world.update(delta * 1000);
    world.cleanup();
  });

  if (!world) return null;

  return (
    <>
      {entities.map((entity: ECSEntity) => {
        // TODO: fix types of entities
        const typedEntity = entity as {
          [POSITION]: Position;
          [SPRITE]: Sprite;
        };
        return (
          <Entity key={world.getEntityId(typedEntity)} entity={typedEntity} />
        );
      })}
    </>
  );
}
