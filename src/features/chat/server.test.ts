import { createHost } from "../../engine/network/host";
import { act } from "../../testing/harness";
import { createAreaWorld } from "../../testing/harness";
import {
  createPopup,
  closePopup,
  openPopup,
  submitChat,
  getPopupTitle,
  getPopupAction,
  popupActions,
  getTabSelections,
  hasPopupBackButton,
} from "../../engine/systems/popup";
import { getMenu, setupHero, type } from "./helpers";

it("asks for an address then a username before connecting a new single-player session", () => {
  const world = createAreaWorld("|  ♀  |");
  const hero = setupHero(world),
    popup = getMenu(world);
  const connect = jest.fn();
  world.metadata.connectServer = connect;
  createPopup(world, popup, {
    tabs: ["server"],
    server: {},
    owner: world.getEntityId(hero),
  });
  openPopup(world, hero, popup, true);
  submitChat(world, hero);
  expect(popup.POPUP.server?.adding).toBe(true);
  submitChat(world, hero, "ftp://invalid");
  expect(connect).not.toHaveBeenCalled();
  expect(world.metadata.serverError).toBe("Invalid server URL!");
  submitChat(world, hero, "localhost:3001");
  expect(connect).not.toHaveBeenCalled();
  expect(popup.POPUP.server?.address).toBe("ws://localhost:3001/");
  submitChat(world, hero, "Alice");
  expect(connect).toHaveBeenCalledWith("ws://localhost:3001/", "Alice");
});

it("reuses a saved server identity without asking for a new username", () => {
  const world = createAreaWorld("|  ♀  |");
  const hero = setupHero(world),
    popup = getMenu(world),
    connect = jest.fn();
  world.metadata.connectServer = connect;
  world.metadata.hasServerPlayer = () => true;
  createPopup(world, popup, {
    tabs: ["server"],
    server: {},
    owner: world.getEntityId(hero),
  });
  openPopup(world, hero, popup, true);
  submitChat(world, hero);
  submitChat(world, hero, "localhost:3001");
  expect(connect).toHaveBeenCalledWith("ws://localhost:3001/");
});

it("creates a Servers portal in the normal shared menu", () => {
  const host = createHost();
  const portal = host.world
    .getEntities(["IDENTIFIABLE", "POPUP"])
    .find((entity) => entity.IDENTIFIABLE.name === "server_portal");
  expect(portal?.POPUP.tabs).toEqual(["server"]);
  expect(portal?.POSITION).toEqual({ x: 8, y: 20 });
});

it("uses short discovery words and the chat-style URL, NAME and INFO titles", () => {
  const world = createAreaWorld("|  ♀  |");
  const hero = setupHero(world),
    popup = getMenu(world);
  createPopup(world, popup, {
    tabs: ["server"],
    server: {},
    owner: world.getEntityId(hero),
  });
  expect(Object.values(popupActions).every((label) => label.length <= 5)).toBe(
    true
  );
  expect(getPopupAction(world, popup)).toBe("LIST");
  expect(getPopupTitle(world, popup)).toBe("LIST");
  openPopup(world, hero, popup, true);
  submitChat(world, hero);
  expect(getPopupTitle(world, popup)).toBe("URL");
  popup.POPUP.server!.address = "ws://localhost:3001/";
  expect(getPopupTitle(world, popup)).toBe("NAME");
  world.metadata.warpPlayer = () => {};
  expect(getPopupTitle(world, popup)).toBe("INFO");
  expect(getPopupAction(world, popup)).toBe("INFO");
});

it("lists saved servers, erases only a selected link and returns through URL and NAME", () => {
  const world = createAreaWorld("|  ♀  |");
  const hero = setupHero(world),
    popup = getMenu(world);
  let addresses = ["ws://localhost:3001/"];
  world.metadata.listServers = () => addresses;
  const erase = jest.fn((address: string) => {
    addresses = addresses.filter((url) => url !== address);
  });
  world.metadata.eraseServer = erase;
  world.metadata.connectServer = jest.fn();
  createPopup(world, popup, {
    tabs: ["server"],
    owner: world.getEntityId(hero),
  });
  openPopup(world, hero, popup, true);
  submitChat(world, hero);
  expect(world.metadata.connectServer).toHaveBeenCalledWith(addresses[0]);
  act(world, "left");
  expect(erase).toHaveBeenCalledWith("ws://localhost:3001/");
  expect(addresses).toEqual([]);
  submitChat(world, hero);
  expect(getPopupTitle(world, popup)).toBe("URL");
  submitChat(world, hero, "localhost:3001");
  expect(getPopupTitle(world, popup)).toBe("NAME");
  type(world, "Alice");
  expect(hasPopupBackButton(world, popup)).toBe(false);
  act(world, "left");
  expect(hasPopupBackButton(world, popup)).toBe(true);
  expect(getTabSelections(world, popup)).toEqual([]);
  expect(getPopupTitle(world, popup)).toBe("NAME");
  act(world, "left");
  expect(getPopupTitle(world, popup)).toBe("URL");
  act(world, "left");
  expect(getPopupTitle(world, popup)).toBe("LIST");
  submitChat(world, hero);
  submitChat(world, hero, "localhost:3001");
  closePopup(world, hero, popup);
  openPopup(world, hero, popup, true);
  expect(getPopupTitle(world, popup)).toBe("LIST");
});
