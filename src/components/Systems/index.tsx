import { useFrame } from "@react-three/fiber";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";
import { useWorld } from "../World";

export default function Systems() {
  const { world } = useWorld();

  useFrame((_, delta) => {
    if (!world) return null;
    world.update(delta);
    world.cleanup();
  });

  if (!world) return null;

  return (
    <>
      {world.getEntities([POSITION, SPRITE]).map((entity: any) => {
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
