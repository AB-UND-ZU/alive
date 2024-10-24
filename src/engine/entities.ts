import { World } from ".";
import { Actionable, ACTIONABLE } from "./components/actionable";
import { Attackable, ATTACKABLE } from "./components/attackable";
import { Behaviour, BEHAVIOUR } from "./components/behaviour";
import { Burnable, BURNABLE } from "./components/burnable";
import { Collectable, COLLECTABLE } from "./components/collectable";
import { COLLIDABLE, Collidable } from "./components/collidable";
import { Countable, COUNTABLE } from "./components/countable";
import { Droppable, DROPPABLE } from "./components/droppable";
import { Equippable, EQUIPPABLE } from "./components/equippable";
import { Focusable, FOCUSABLE } from "./components/focusable";
import { Fog, FOG } from "./components/fog";
import { Identifiable, IDENTIFIABLE } from "./components/identifiable";
import { Immersible, IMMERSIBLE } from "./components/immersible";
import { Inventory, INVENTORY } from "./components/inventory";
import { Item, ITEM } from "./components/item";
import { Level, LEVEL } from "./components/level";
import { Light, LIGHT } from "./components/light";
import { Lockable, LOCKABLE } from "./components/lockable";
import { Lootable, LOOTABLE } from "./components/lootable";
import { Melee, MELEE } from "./components/melee";
import { Movable, MOVABLE } from "./components/movable";
import { Npc, NPC } from "./components/npc";
import { Orientable, ORIENTABLE } from "./components/orientable";
import { Particle, PARTICLE } from "./components/particle";
import { Player, PLAYER } from "./components/player";
import { Position, POSITION } from "./components/position";
import { Quest, QUEST } from "./components/quest";
import { Reference, REFERENCE } from "./components/reference";
import { Renderable, RENDERABLE } from "./components/renderable";
import { Revivable, REVIVABLE } from "./components/revivable";
import { Sequencable, SEQUENCABLE } from "./components/sequencable";
import { Soul, SOUL } from "./components/soul";
import { Spawnable, SPAWNABLE } from "./components/spawnable";
import { Sprite, SPRITE } from "./components/sprite";
import { Swimmable, SWIMMABLE } from "./components/swimmable";
import { Tooltip, TOOLTIP } from "./components/tooltip";
import { Trackable, TRACKABLE } from "./components/trackable";
import { Tradable, TRADABLE } from "./components/tradable";
import { Viewable, VIEWABLE } from "./components/viewable";

export type Entity = {
  [ACTIONABLE]: Actionable;
  [ATTACKABLE]: Attackable;
  [BEHAVIOUR]: Behaviour;
  [BURNABLE]: Burnable;
  [COLLECTABLE]: Collectable;
  [COLLIDABLE]: Collidable;
  [COUNTABLE]: Countable;
  [DROPPABLE]: Droppable;
  [EQUIPPABLE]: Equippable;
  [FOCUSABLE]: Focusable;
  [FOG]: Fog;
  [IDENTIFIABLE]: Identifiable;
  [IMMERSIBLE]: Immersible;
  [INVENTORY]: Inventory;
  [ITEM]: Item;
  [LEVEL]: Level;
  [LIGHT]: Light;
  [LOCKABLE]: Lockable;
  [LOOTABLE]: Lootable;
  [MELEE]: Melee;
  [MOVABLE]: Movable;
  [NPC]: Npc;
  [ORIENTABLE]: Orientable;
  [PARTICLE]: Particle;
  [PLAYER]: Player;
  [POSITION]: Position;
  [QUEST]: Quest;
  [RENDERABLE]: Renderable;
  [REFERENCE]: Reference;
  [REVIVABLE]: Revivable;
  [SEQUENCABLE]: Sequencable;
  [SOUL]: Soul;
  [SPAWNABLE]: Spawnable;
  [SPRITE]: Sprite;
  [SWIMMABLE]: Swimmable;
  [TOOLTIP]: Tooltip;
  [TRACKABLE]: Trackable;
  [TRADABLE]: Tradable;
  [VIEWABLE]: Viewable;
};

// create a typed entity from component names
export type TypedEntity<C extends keyof Entity = never> = Pick<Entity, C> & Partial<Omit<Entity, C>>

// allow creating entity factories for a given subset of components
const entityFactory = <T extends keyof Entity>(components: T[]) => {
  type EntityData = { [K in T]: Entity[K] };

  return (world: World, data: EntityData): EntityData => {
    const entity = world.createEntity();

    components.forEach((component) => {
      const componentData = data[component];
      world.addComponentToEntity(entity, component, componentData);
    });

    return entity as EntityData;
  };
};

export const createChest = entityFactory([
  ATTACKABLE,
  COLLIDABLE,
  COUNTABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createCollecting = entityFactory([
  ORIENTABLE,
  PARTICLE,
  RENDERABLE,
  SPRITE,
]);

export const createCompass = entityFactory([
  ITEM,
  ORIENTABLE,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TRACKABLE,
]);

export const createContainer = entityFactory([
  FOG,
  INVENTORY,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  SWIMMABLE,
  TOOLTIP,
]);

export const createDoor = entityFactory([
  FOG,
  LIGHT,
  LOCKABLE,
  NPC,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createFire = entityFactory([
  BURNABLE,
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createFloat = entityFactory([FOG, POSITION, RENDERABLE, SPRITE]);

export const createFrame = entityFactory([RENDERABLE, REFERENCE]);

export const createFruit = entityFactory([
  COLLIDABLE,
  FOG,
  INVENTORY,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createGame = entityFactory([LEVEL, RENDERABLE, REFERENCE]);

export const createGround = entityFactory([FOG, POSITION, RENDERABLE, SPRITE]);

export const createHalo = entityFactory([
  ACTIONABLE,
  EQUIPPABLE,
  INVENTORY,
  LIGHT,
  MOVABLE,
  PLAYER,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SOUL,
  SPAWNABLE,
  SPRITE,
  VIEWABLE,
]);

export const createHero = entityFactory([
  ACTIONABLE,
  ATTACKABLE,
  COLLECTABLE,
  COUNTABLE,
  DROPPABLE,
  EQUIPPABLE,
  FOG,
  INVENTORY,
  LIGHT,
  MELEE,
  MOVABLE,
  ORIENTABLE,
  PLAYER,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPAWNABLE,
  SPRITE,
  SWIMMABLE,
  VIEWABLE,
]);

export const createHighlight = entityFactory([
  FOCUSABLE,
  MOVABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createItem = entityFactory([ITEM, RENDERABLE, SPRITE]);

export const createMob = entityFactory([
  ATTACKABLE,
  BEHAVIOUR,
  COUNTABLE,
  DROPPABLE,
  EQUIPPABLE,
  FOG,
  INVENTORY,
  MELEE,
  MOVABLE,
  NPC,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  SWIMMABLE,
  TOOLTIP,
]);

export const createOre = entityFactory([
  COLLIDABLE,
  FOG,
  INVENTORY,
  LIGHT,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createParticle = entityFactory([PARTICLE, RENDERABLE, SPRITE]);

export const createShop = entityFactory([
  COLLIDABLE,
  FOG,
  INVENTORY,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
  TRADABLE,
]);

export const createSign = entityFactory([
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createSword = entityFactory([
  ITEM,
  ORIENTABLE,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createTerrain = entityFactory([
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createTombstone = entityFactory([
  FOG,
  POSITION,
  RENDERABLE,
  REVIVABLE,
  SEQUENCABLE,
  SPRITE,
  SWIMMABLE,
  TOOLTIP,
]);

export const createViewpoint = entityFactory([
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  VIEWABLE,
]);

export const createVillager = entityFactory([
  ACTIONABLE,
  ATTACKABLE,
  BEHAVIOUR,
  COLLECTABLE,
  COUNTABLE,
  DROPPABLE,
  EQUIPPABLE,
  FOG,
  INVENTORY,
  MELEE,
  MOVABLE,
  NPC,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  SWIMMABLE,
  TOOLTIP,
]);

export const createWall = entityFactory([
  COLLIDABLE,
  FOG,
  LIGHT,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createWater = entityFactory([
  FOG,
  IMMERSIBLE,
  POSITION,
  RENDERABLE,
  SPRITE,
]);
