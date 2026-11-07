# entities.ts
<!-- source-types -->

## Entity

```ts src/engine/entities.ts
export type Entity = Record<LevelName, {}> & {
  [ACTIONABLE]: Actionable;
  [AFFECTABLE]: Affectable;
  [ATTACKABLE]: Attackable;
  [BAITABLE]: Baitable;
  [BEHAVIOUR]: Behaviour;
  [BELONGABLE]: Belongable;
  [BLOCKABLE]: Blockable;
  [BREWABLE]: Brewable;
  [BUILDABLE]: Buildable;
  [BUMPABLE]: Bumpable;
  [BURNABLE]: Burnable;
  [CASTABLE]: Castable;
  [CLICKABLE]: Clickable;
  [COLLECTABLE]: Collectable;
  [COLLIDABLE]: Collidable;
  [CONDITIONABLE]: Conditionable;
  [COVERABLE]: Coverable;
  [DISPLACABLE]: Displacable;
  [DROPPABLE]: Droppable;
  [ENTERABLE]: Enterable;
  [EQUIPPABLE]: Equippable;
  [EXERTABLE]: Exertable;
  [FARMABLE]: Farmable;
  [FISHABLE]: Fishable;
  [FOCUSABLE]: Focusable;
  [FOG]: Fog;
  [FORGABLE]: Forgable;
  [FRAGMENT]: Fragment;
  [FREEZABLE]: Freezable;
  [HARVESTABLE]: Harvestable;
  [HOMING]: Homing;
  [HOOKABLE]: Hookable;
  [IDENTIFIABLE]: Identifiable;
  [IMMERSIBLE]: Immersible;
  [INVENTORY]: Inventory;
  [ITEM]: Item;
  [LAYER]: Layer;
  [LEVEL]: Level;
  [LIQUID]: Liquid;
  [LIGHT]: Light;
  [LOCKABLE]: Lockable;
  [LOOTABLE]: Lootable;
  [MELEE]: Melee;
  [MOUNTABLE]: Mountable;
  [MOVABLE]: Movable;
  [NPC]: Npc;
  [ORIENTABLE]: Orientable;
  [PARTICLE]: Particle;
  [PLAYER]: Player;
  [POI]: Poi;
  [POPUP]: Popup;
  [POSITION]: Position;
  [PROJECTILE]: Projectile;
  [PUSHABLE]: Pushable;
  [RECHARGABLE]: Rechargable;
  [REFERENCE]: Reference;
  [REFILLABLE]: Refillable;
  [REMAINABLE]: Remainable;
  [RENDERABLE]: Renderable;
  [REVIVABLE]: Revivable;
  [SEQUENCABLE]: Sequencable;
  [SHOOTABLE]: Shootable;
  [SOUL]: Soul;
  [SPAWNABLE]: Spawnable;
  [SPIKABLE]: Spikable;
  [SPRITE]: Sprite;
  [STATS]: Stats;
  [STICKY]: Sticky;
  [STRUCTURABLE]: Structurable;
  [SWIMMABLE]: Swimmable;
  [TEMPO]: Tempo;
  [TOOLTIP]: Tooltip;
  [TRACKABLE]: Trackable;
  [VANISHABLE]: Vanishable;
  [VIEWABLE]: Viewable;
  [WARPABLE]: Warpable;
};
```

## TypedEntity

```ts src/engine/entities.ts
export type TypedEntity<C extends keyof Entity = never> = Pick<Entity, C> &
  Partial<Omit<Entity, C>>;
```
