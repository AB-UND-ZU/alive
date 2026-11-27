import { populateItems } from "../../bindings/creation";
import addBurnable from "../../engine/components/burnable";
import { Position } from "../../engine/components/position";
import { World } from "../../engine/ecs";
import {
  disposeEntity,
  getCellEntities,
  moveEntity,
} from "../../engine/systems/map";
import { removeFromInventory } from "../../engine/systems/trigger";
import { getIdentifier, getIdentifierAndComponents } from "../../engine/utils";
import { spriteRef } from "../assets/spriteIds";
import { mapSpawn } from "../assets/sprites";
import { signedDistance } from "../math/std";
import { createText } from "../assets/ui";
import { createUnitName, getItemSprite } from "../assets/utils";
import { unitDefinitions } from "../balancing/units";

function openSpawnExit(world: World) {
  const level = world.metadata.gameEntity.LEVEL;
  const legacyCell: string = "path_hedge";
  const exits = level.cellPositions[legacyCell];
  if (!exits?.length) return;

  const spawn = world
    .getEntities(["POI", "POSITION"])
    .find(({ POI }) => POI.sprite.id === mapSpawn.id);
  if (!spawn) return;
  const exit = exits.find(
    ({ x, y }) =>
      x === spawn.POSITION.x &&
      Math.abs(signedDistance(spawn.POSITION.y, y, level.size)) === 2 &&
      level.cells[x][y] === legacyCell
  );
  if (!exit) return;
  const cell = getCellEntities(world, exit);
  // The spawn marker was created after the original hedge and paving. A
  // replacement planted by the player has a newer ID.
  const markerId = world.getEntityId(spawn);
  const hedge = cell.find(
    (entity) =>
      entity.HARVESTABLE?.resource === "hedge" &&
      world.getEntityId(entity) < markerId
  );
  if (
    !hedge ||
    hedge.STATS?.hp !== hedge.STATS?.maxHp ||
    hedge.HARVESTABLE?.amount !== hedge.HARVESTABLE?.maximum ||
    hedge.BURNABLE?.burning ||
    hedge.BURNABLE?.combusted ||
    !cell.some(
      (entity) =>
        entity.HARVESTABLE?.resource === "path" &&
        world.getEntityId(entity) < markerId
    )
  )
    return;

  disposeEntity(world, hedge, false);
  level.cells[exit.x][exit.y] = "path";
  level.cellPositions[legacyCell] = exits.filter(
    ({ x, y }) => x !== exit.x || y !== exit.y
  );
  if (!level.cellPositions[legacyCell].length)
    delete level.cellPositions[legacyCell];
  (level.cellPositions.path ||= []).push(exit);
}

export function upgradeIsland(world: World) {
  for (const entity of world.metadata.ecs.entities) {
    // Awakened plant creatures have already lost their harvestable component.
    if (
      !entity.BURNABLE &&
      (entity.HARVESTABLE?.resource === "rotten" ||
        (entity.NPC &&
          unitDefinitions[entity.NPC.type]?.harvestable === "plant"))
    ) {
      addBurnable(world, entity);
    }

    const weather = entity.SEQUENCABLE?.states.weather;
    if (weather?.name === "weatherStorm") {
      const args = weather.args as typeof weather.args & {
        viewable?: Position;
      };
      if (
        entity.POSITION &&
        args.viewable &&
        (entity.POSITION.x !== args.viewable.x ||
          entity.POSITION.y !== args.viewable.y)
      ) {
        moveEntity(world, entity, args.viewable, false);
      }
      delete args.viewable;
      Reflect.deleteProperty(entity, "STICKY");
    }
  }

  if (world.metadata.gameEntity.LEVEL.name !== "LEVEL_ISLAND") return;

  openSpawnExit(world);

  // Released islands had a single guard at the glacier landing.
  const guard = getIdentifierAndComponents(world, "waterGuard", [
    "IDENTIFIABLE",
    "NPC",
    "SPRITE",
  ]);
  if (guard?.NPC.type !== "waterGuard" || getIdentifier(world, "waterChief"))
    return;
  guard.IDENTIFIABLE.name = "waterChief";
  guard.NPC.type = "waterChief";
  const definition = unitDefinitions.waterChief;
  guard.SPRITE = spriteRef(definition.sprite);
  if (guard.REMAINABLE) guard.REMAINABLE.cell = definition.remains;

  const carrier = world.getEntityComponents(guard, [
    "INVENTORY",
    "EQUIPPABLE",
    "POSITION",
  ]);
  if (carrier) {
    const carrierId = world.getEntityId(carrier);
    const items = carrier.INVENTORY.items.flatMap((id) => {
      const item = world.getEntityByIdAndComponents(id, ["ITEM", "SPRITE"]);
      return item?.ITEM.bound && item.ITEM.carrier === carrierId ? [item] : [];
    });
    const sword = items.find(({ ITEM }) => ITEM.weapon === "sword");
    if (sword) {
      const weapon = definition.equipments.find(
        (item) => item.weapon === "sword"
      )!;
      sword.ITEM = { ...weapon, carrier: carrierId, amount: sword.ITEM.amount };
      sword.SPRITE = spriteRef(getItemSprite(sword.ITEM));
    }

    const shield = items.find(({ ITEM }) => ITEM.offhand === "shield");
    const healing = definition.equipments.find(
      (item) => item.consume === "potion"
    )!;
    const potion = items.find(
      ({ ITEM }) => ITEM.consume === "potion" && ITEM.stat === "hp"
    );
    if (shield) {
      removeFromInventory(world, carrier, shield);
      disposeEntity(world, shield);
    }
    if (potion) {
      potion.ITEM.material = healing.material;
      potion.SPRITE = spriteRef(getItemSprite(potion.ITEM, "resource"));
    } else if (carrier.STATS && carrier.STATS.hp > 0) {
      populateItems(world, carrier, [healing]);
    }
  }

  const popup = getIdentifierAndComponents(world, "fireChief", [
    "POPUP",
  ])?.POPUP;
  const target = popup?.targets.find(
    (entry) => entry.identifier === "waterGuard"
  );
  if (popup && target) {
    target.unit = "waterChief";
    target.identifier = "waterChief";
    for (const focus of popup.focuses) {
      if (focus.identifier === "waterGuard") focus.identifier = "waterChief";
    }
    const directions = popup.lines[0];
    if (directions?.length) {
      directions[directions.length - 1] = [
        ...createUnitName("waterChief"),
        ...createText("."),
      ];
    }
  }

  const quest = world.getEntity(["PLAYER", "SEQUENCABLE"])?.SEQUENCABLE.states
    .quest;
  if (
    quest?.name === "waypointQuest" &&
    quest.args.memory.identifier === "waterGuard"
  ) {
    quest.args.memory.identifier = "waterChief";
  }
}
