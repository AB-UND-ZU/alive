import { World } from ".";
import { Actionable, ACTIONABLE } from "./components/actionable";
import { Attackable, ATTACKABLE } from "./components/attackable";
import { Behaviour, BEHAVIOUR } from "./components/behaviour";
import { Belongable, BELONGABLE } from "./components/belongable";
import { Burnable, BURNABLE } from "./components/burnable";
import { Collectable, COLLECTABLE } from "./components/collectable";
import { COLLIDABLE, Collidable } from "./components/collidable";
import { Displacable, DISPLACABLE } from "./components/displacable";
import { Droppable, DROPPABLE } from "./components/droppable";
import { Enterable, ENTERABLE } from "./components/enterable";
import { Equippable, EQUIPPABLE } from "./components/equippable";
import { Focusable, FOCUSABLE } from "./components/focusable";
import { Fog, FOG } from "./components/fog";
import { Identifiable, IDENTIFIABLE } from "./components/identifiable";
import { Immersible, IMMERSIBLE } from "./components/immersible";
import { Inventory, INVENTORY } from "./components/inventory";
import { Item, ITEM } from "./components/item";
import { Level, LEVEL } from "./components/level";
import { Liquid, LIQUID } from "./components/liquid";
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
import { Projectile, PROJECTILE } from "./components/projectile";
import { Pushable, PUSHABLE } from "./components/pushable";
import { Quest, QUEST } from "./components/quest";
import { Reference, REFERENCE } from "./components/reference";
import { Renderable, RENDERABLE } from "./components/renderable";
import { Revivable, REVIVABLE } from "./components/revivable";
import { Sequencable, SEQUENCABLE } from "./components/sequencable";
import { Shootable, SHOOTABLE } from "./components/shootable";
import { Soul, SOUL } from "./components/soul";
import { Spawnable, SPAWNABLE } from "./components/spawnable";
import { Spikable, SPIKABLE } from "./components/spikable";
import { Sprite, SPRITE } from "./components/sprite";
import { Stats, STATS } from "./components/stats";
import { Swimmable, SWIMMABLE } from "./components/swimmable";
import { Tooltip, TOOLTIP } from "./components/tooltip";
import { Trackable, TRACKABLE } from "./components/trackable";
import { Tradable, TRADABLE } from "./components/tradable";
import { Viewable, VIEWABLE } from "./components/viewable";
import { Castable, CASTABLE } from "./components/castable";
import { Affectable, AFFECTABLE } from "./components/affectable";
import { Exertable, EXERTABLE } from "./components/exertable";
import { Fragment, FRAGMENT } from "./components/fragment";
import { Structurable, STRUCTURABLE } from "./components/structurable";

export type Entity = {
  [ACTIONABLE]: Actionable;
  [AFFECTABLE]: Affectable;
  [ATTACKABLE]: Attackable;
  [BEHAVIOUR]: Behaviour;
  [BELONGABLE]: Belongable;
  [BURNABLE]: Burnable;
  [CASTABLE]: Castable;
  [COLLECTABLE]: Collectable;
  [COLLIDABLE]: Collidable;
  [DISPLACABLE]: Displacable;
  [DROPPABLE]: Droppable;
  [ENTERABLE]: Enterable;
  [EQUIPPABLE]: Equippable;
  [EXERTABLE]: Exertable;
  [FOCUSABLE]: Focusable;
  [FOG]: Fog;
  [FRAGMENT]: Fragment;
  [IDENTIFIABLE]: Identifiable;
  [IMMERSIBLE]: Immersible;
  [INVENTORY]: Inventory;
  [ITEM]: Item;
  [LEVEL]: Level;
  [LIQUID]: Liquid;
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
  [PROJECTILE]: Projectile;
  [PUSHABLE]: Pushable;
  [QUEST]: Quest;
  [RENDERABLE]: Renderable;
  [REFERENCE]: Reference;
  [REVIVABLE]: Revivable;
  [SEQUENCABLE]: Sequencable;
  [SHOOTABLE]: Shootable;
  [SOUL]: Soul;
  [SPAWNABLE]: Spawnable;
  [SPIKABLE]: Spikable;
  [SPRITE]: Sprite;
  [STATS]: Stats;
  [STRUCTURABLE]: Structurable;
  [SWIMMABLE]: Swimmable;
  [TOOLTIP]: Tooltip;
  [TRACKABLE]: Trackable;
  [TRADABLE]: Tradable;
  [VIEWABLE]: Viewable;
};

// create a typed entity from component names
export type TypedEntity<C extends keyof Entity = never> = Pick<Entity, C> &
  Partial<Omit<Entity, C>>;

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

export const createAoe = entityFactory([EXERTABLE, POSITION]);

export const createBox = entityFactory([
  AFFECTABLE,
  BELONGABLE,
  COLLIDABLE,
  DISPLACABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  MOVABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SHOOTABLE,
  SPRITE,
  SWIMMABLE,
  TOOLTIP,
  STATS,
]);

export const createBuilding = entityFactory([
  FOG,
  POSITION,
  RENDERABLE,
  SPRITE,
  STRUCTURABLE,
  VIEWABLE,
]);

export const createCactus = entityFactory([
  ATTACKABLE,
  BELONGABLE,
  COLLIDABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  SPIKABLE,
  STATS,
]);

export const createChest = entityFactory([
  ATTACKABLE,
  BELONGABLE,
  COLLIDABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
  TOOLTIP,
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
  ENTERABLE,
  FOG,
  LIGHT,
  LOCKABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createFibre = entityFactory([
  ORIENTABLE,
  PARTICLE,
  RENDERABLE,
  SPRITE,
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

export const createFloat = entityFactory([
  ENTERABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createFrame = entityFactory([RENDERABLE, REFERENCE]);

export const createFruit = entityFactory([
  COLLIDABLE,
  FOG,
  INVENTORY,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createGame = entityFactory([LEVEL, RENDERABLE, REFERENCE]);

export const createGate = entityFactory([
  FOG,
  LIGHT,
  LOCKABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createGround = entityFactory([FOG, POSITION, RENDERABLE, SPRITE]);

export const createHalo = entityFactory([
  ACTIONABLE,
  BELONGABLE,
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
  AFFECTABLE,
  ATTACKABLE,
  BELONGABLE,
  COLLECTABLE,
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
  PUSHABLE,
  RENDERABLE,
  SEQUENCABLE,
  SHOOTABLE,
  SPAWNABLE,
  SPRITE,
  STATS,
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

export const createMine = entityFactory([
  COLLIDABLE,
  FOG,
  LIGHT,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createMob = entityFactory([
  ACTIONABLE,
  AFFECTABLE,
  ATTACKABLE,
  BEHAVIOUR,
  BELONGABLE,
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
  SHOOTABLE,
  SPRITE,
  STATS,
  SWIMMABLE,
  TOOLTIP,
]);

export const createMountain = entityFactory([
  COLLIDABLE,
  FOG,
  LIGHT,
  POSITION,
  RENDERABLE,
  SPRITE,
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

export const createPlant = entityFactory([
  COLLIDABLE,
  FOG,
  FRAGMENT,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createPlate = entityFactory([
  COLLIDABLE,
  ENTERABLE,
  FOG,
  LIGHT,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createResource = entityFactory([
  ATTACKABLE,
  BELONGABLE,
  COLLIDABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
]);

export const createRoot = entityFactory([
  COLLIDABLE,
  FOG,
  FRAGMENT,
  POSITION,
  RENDERABLE,
  SPRITE,
  STRUCTURABLE,
]);

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

export const createShot = entityFactory([
  BELONGABLE,
  MOVABLE,
  ORIENTABLE,
  POSITION,
  PROJECTILE,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
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

export const createSpell = entityFactory([
  BELONGABLE,
  CASTABLE,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createSplash = entityFactory([
  FOG,
  LIQUID,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createStructure = entityFactory([
  FOG,
  POSITION,
  RENDERABLE,
  STRUCTURABLE,
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
  AFFECTABLE,
  ATTACKABLE,
  BEHAVIOUR,
  BELONGABLE,
  COLLECTABLE,
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
  SHOOTABLE,
  SPRITE,
  STATS,
  SWIMMABLE,
  TOOLTIP,
]);

export const createWall = entityFactory([
  COLLIDABLE,
  ENTERABLE,
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
