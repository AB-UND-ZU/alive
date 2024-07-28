import { World } from "../../engine";
import { Position, POSITION } from "../../engine/components/position";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import Entity from "../Entity";

export default function System({ world }: { world: World }) {
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
