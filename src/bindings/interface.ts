import { entities, World } from "../engine";
import { FOG } from "../engine/components/fog";
import { POSITION } from "../engine/components/position";
import { RENDERABLE } from "../engine/components/renderable";
import { VIEWABLE } from "../engine/components/viewable";
import { POPUP } from "../engine/components/popup";
import { SEQUENCABLE } from "../engine/components/sequencable";
import { SPRITE } from "../engine/components/sprite";
import { PLAYER } from "../engine/components/player";
import { setIdentifier } from "../engine/utils";
import { none } from "../game/assets/sprites";
import { registerEntity } from "../engine/systems/map";
import { TypedEntity } from "../engine/entities";

export const createPlayerInterface = (world: World, owner?: number) => {
  // create viewpoint for inspecting
  const inspectEntity = entities.createViewpoint(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [VIEWABLE]: { active: false, priority: 90, owner },
  });

  setIdentifier(world, inspectEntity, "inspect");

  // create viewpoint for use
  const useEntity = entities.createUse(world, {
    [FOG]: { type: "terrain", visibility: "visible", fixed: true },
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [VIEWABLE]: { active: false, priority: 90, owner },
    [POPUP]: {
      active: false,
      owner,
      verticalIndezes: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      horizontalIndex: 0,
      selections: [[], [], [], [], [], [], [], [], []],
      viewpoint: world.getEntityId(inspectEntity),
      deals: [],
      ingredients: [],
      recipes: [],
      lines: [],
      targets: [],
      focuses: [],
      choices: [],
      tabs: [
        "use",
        "inspect",
        "gear",
        "equip",
        "stats",
        "map",
        "chat",
        "plant",
        "build",
      ],
    },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });

  setIdentifier(world, useEntity, "use");

  return { inspectEntity, useEntity };
};

export const ensurePlayerInterface = (
  world: World,
  player: TypedEntity<"PLAYER">
) => {
  const owner = world.getEntityId(player);
  let ids = player[PLAYER].interface;
  if (
    !ids ||
    !world.getEntityById(ids.use) ||
    !world.getEntityById(ids.inspect)
  ) {
    const { inspectEntity, useEntity } = createPlayerInterface(world, owner);
    registerEntity(world, inspectEntity);
    registerEntity(world, useEntity);
    ids = {
      use: world.getEntityId(useEntity),
      inspect: world.getEntityId(inspectEntity),
    };
    player[PLAYER].interface = ids;
  }
  world.assertByIdAndComponents(ids.use, [POPUP])[POPUP].owner = owner;
  world.assertByIdAndComponents(ids.inspect, [VIEWABLE])[VIEWABLE].owner =
    owner;
  for (const id of Object.values(ids.prompts || {})) {
    const prompt = world.getEntityByIdAndComponents(id, [
      SEQUENCABLE,
      VIEWABLE,
    ]);
    if (prompt) {
      prompt[VIEWABLE].owner = owner;
      const state = prompt[SEQUENCABLE].states.interact;
      if (state) state.args.owner = owner;
    }
  }
  return ids;
};
