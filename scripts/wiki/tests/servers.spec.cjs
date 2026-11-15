const { test, expect } = require("./fixtures.cjs");
const { mkdtemp, rm, realpath } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { buildServer } = require("../../server/build.cjs");
const { createGameServer } = require("../../server/transport.cjs");
let directory, server, engine;
test.beforeAll(async () => {
  directory = await realpath(
    await mkdtemp(path.join(os.tmpdir(), "alive-wiki-servers-"))
  );
  const outfile = path.join(directory, "engine.cjs");
  await buildServer({
    stdin: {
      contents:
        'export {createHost} from "./src/engine/network/host"; export {encodeState, decodeState} from "./src/engine/network/codec"; export {getKeyFromIndex} from "./src/components/Keyboard"; export {moveEntity} from "./src/engine/systems/map"; export {createPopup,openPopup} from "./src/engine/systems/popup"; export {createText} from "./src/game/assets/ui"; export {giveItems} from "./src/testing/harness";',
      resolveDir: path.resolve(__dirname, "../../.."),
      loader: "ts",
    },
    outfile,
    // Keep jsfxr in its native CommonJS module, outside Playwright's strict transform.
    external: [require.resolve("jsfxr")],
  });
  engine = require(outfile);
  server = await createGameServer({
    engine,
    file: path.join(directory, "server.save"),
  });
});
test.afterAll(async () => {
  await server?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("Multiplayer connects two independently playable clients and preserves their identities on retry", async ({
  page,
}, testInfo) => {
  const connections = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("websocket", (socket) => {
    const connection = { states: 0 };
    connections.push(connection);
    socket.on("framereceived", ({ payload }) => {
      const message = JSON.parse(payload.toString());
      if (message.type === "welcome") connection.id = message.id;
      if (message.type === "state") {
        connection.states++;
        connection.frame = engine.decodeState(message.state);
      }
    });
  });
  await page.goto("/game-design/clients/multiplayer.html");
  await expect(
    page.getByRole("heading", { name: "Multiplayer", exact: true })
  ).toBeVisible();
  await expect(
    page
      .locator(".NavGroup")
      .filter({ hasText: "[CLIENTS]" })
      .getByRole("link", { name: "Multiplayer", exact: true })
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Server URL" })
    .fill(`127.0.0.1:${server.address.port}`);
  await page.getByRole("textbox", { name: "Player 1 username" }).fill("Alice");
  await page.getByRole("textbox", { name: "Player 2 username" }).fill("Bob");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "connected" })
  ).toHaveCount(2, { timeout: 15000 });
  expect(connections).toHaveLength(2);
  expect(connections[0].id).not.toBe(connections[1].id);
  const ids = connections.map((connection) => connection.id).sort();
  for (let index = 0; index < 2; index++) {
    const frame = page.frameLocator(`iframe[title="Player ${index + 1} game"]`);
    const playerId = await frame.locator("body").evaluate(
      (_, slot) =>
        Object.keys(localStorage)
          .filter((key) =>
            key.startsWith(`alive.wiki.client.${slot}:alive.server:`)
          )
          .map((key) => JSON.parse(localStorage.getItem(key)))
          .find((claim) => claim.id)?.id,
      index + 1
    );
    const world = server.simulation.worldFor(playerId);
    const actor = world.getEntityById(server.simulation.actorId(playerId));
    const before = { ...actor.POSITION };
    await frame.locator("canvas").click({ position: { x: 30, y: 30 } });
    const scrollY = await page.evaluate(() => window.scrollY);
    await frame.locator("body").press("ArrowRight");
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    await expect.poll(() => actor.POSITION).not.toEqual(before);
  }
  const firstFrame = page.frameLocator('iframe[title="Player 1 game"]');
  await firstFrame.locator("canvas").click({ position: { x: 30, y: 30 } });
  await firstFrame.locator("body").press("Escape");
  await expect(firstFrame.locator("#pause-resume")).toBeVisible();
  await expect(firstFrame.locator("#pause-menu")).toBeVisible();
  await expect(firstFrame.locator("#pause-save")).toBeVisible();
  const buttons = await firstFrame
    .locator(".PauseButton")
    .evaluateAll((buttons) => buttons.map((button) => button.id));
  expect(buttons).toEqual(["pause-resume", "pause-menu", "pause-save"]);
  await page.screenshot({
    path: testInfo.outputPath("pause-desktop.png"),
    fullPage: true,
  });
  await firstFrame.locator("#pause-save").click();
  await expect(firstFrame.locator("#pause-resume")).toBeVisible();
  await firstFrame.locator("#pause-resume").click();
  await expect(firstFrame.locator("#pause-resume")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("servers-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    )
    .toBe(false);
  await page.screenshot({
    path: testInfo.outputPath("servers-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const counts = connections.map((connection) => connection.states);
  await expect
    .poll(() =>
      connections.every(
        (connection, index) => connection.states > counts[index] + 1
      )
    )
    .toBe(true);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "connected" })
  ).toHaveCount(2, { timeout: 15000 });
  await expect.poll(() => connections.length).toBe(4);
  await expect
    .poll(() =>
      connections
        .slice(2)
        .map((connection) => connection.id)
        .filter(Boolean)
        .sort()
    )
    .toEqual(ids);
  expect(errors).toEqual([]);
});

test("Multiplayer reports an unreachable host and accepts another address", async ({
  page,
}, testInfo) => {
  await page.goto("/game-design/clients/multiplayer.html");
  await page.getByRole("textbox", { name: "Server URL" }).fill("127.0.0.1:1");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Connection failed");
  await expect(page.locator(".ServerGames iframe")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Server URL" })
    .fill(`127.0.0.1:${server.address.port}`);
  await page.getByRole("textbox", { name: "Server URL" }).press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "connected" })
  ).toHaveCount(2, { timeout: 15000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  const players = [];
  for (let index = 0; index < 2; index++) {
    const frame = page.frameLocator(`iframe[title="Player ${index + 1} game"]`);
    const id = await frame.locator("body").evaluate(
      (_, slot) =>
        Object.keys(localStorage)
          .filter((key) =>
            key.startsWith(`alive.wiki.client.${slot}:alive.server:`)
          )
          .map((key) => JSON.parse(localStorage.getItem(key)))
          .find((claim) => claim.id)?.id,
      index + 1
    );
    const world = server.simulation.worldFor(id);
    const actor = world.getEntityById(server.simulation.actorId(id));
    players.push(actor);
    expect(actor.PLAYER.naming).toBe(true);
    if (index === 0) {
      await page.screenshot({
        path: testInfo.outputPath("username-desktop.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: testInfo.outputPath("username-mobile.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await frame.locator("canvas").click({ position: { x: 30, y: 30 } });
    await frame
      .locator("body")
      .pressSequentially(index ? "Evan" : "Dora", { delay: 40 });
    await frame.locator("body").press("Enter");
    await expect.poll(() => actor.PLAYER.naming).toBe(false);
  }
  const frame = page.frameLocator('iframe[title="Player 1 game"]');
  await frame.locator("canvas").click({ position: { x: 30, y: 30 } });
  await frame.locator("body").press("c");
  await expect.poll(() => !!players[0].PLAYER.popup).toBe(true);
  await expect(frame.locator("#keyboard")).toBeVisible();
  await frame.locator("body").pressSequentially("hello", { delay: 40 });
  await frame.locator("body").press("Enter");
  await expect
    .poll(() =>
      players[0].TOOLTIP.dialogs[0]
        ?.slice(1, -1)
        .map((sprite) => sprite.layers[sprite.layers.length - 1]?.char || "")
        .join("")
    )
    .toBe("Dora: hello");
  await expect(frame.locator("#keyboard")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("chat-desktop.png"),
    fullPage: true,
  });
  await expect
    .poll(() => players[0].TOOLTIP.dialogs.length, { timeout: 5000 })
    .toBe(0);
});

test("Server documents native startup, shared rules and server-owned saves", async ({
  page,
}, testInfo) => {
  await page.goto("/game-design/clients/server.html");
  await expect(
    page.getByRole("heading", { name: "Server", exact: true })
  ).toBeVisible();
  const content = page.locator("main");
  await expect(content).toContainText("npm run server");
  await expect(content).toContainText("~/.alive/server.save");
  await expect(content).toContainText("ALIVE_SERVER_SAVE");
  await expect(
    content.getByRole("link", { name: "Multiplayer", exact: true })
  ).toHaveAttribute("href", /clients\/multiplayer.html$/);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      )
      .toBe(false);
    await page.screenshot({
      path: testInfo.outputPath(`server-${width}.png`),
      fullPage: true,
    });
  }
});

test("server admins receive private player lists and complete usernames before granting commands", async ({
  page,
}, testInfo) => {
  const {
    createCredential,
    createPersistence,
  } = require("../../server/persistence.cjs");
  const credential = createCredential();
  const host = engine.createHost();
  host.join(credential.id);
  const file = path.join(directory, "admin.save");
  await createPersistence(file).save({
    accounts: [{ id: credential.id, hash: credential.hash, username: "Admin" }],
    world: host.save(),
  });
  const managed = await createGameServer({
    engine,
    file,
    adminIds: [credential.id],
  });
  try {
    const address = `ws://127.0.0.1:${managed.address.port}/`;
    await page.goto("/game-design/clients/multiplayer.html");
    await page.evaluate(
      ({ address, id, token }) =>
        localStorage.setItem(
          `alive.wiki.client.1:alive.server:${address}`,
          JSON.stringify({ id, token })
        ),
      { address, id: credential.id, token: credential.token }
    );
    await page.getByRole("textbox", { name: "Server URL" }).fill(address);
    await page
      .getByRole("textbox", { name: "Player 2 username" })
      .fill("Friend");
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "connected" })
    ).toHaveCount(2, { timeout: 15000 });
    const world = managed.simulation.worldFor(credential.id);
    const hero = world.getEntityById(managed.simulation.actorId(credential.id));
    const friend = () =>
      world
        .getEntities(["PLAYER"])
        .find((actor) => actor.PLAYER.username === "Friend");
    const frame = page.frameLocator('iframe[title="Player 1 game"]');
    const prompt = () => {
      const popup = world.getEntityById(hero.PLAYER.popup)?.POPUP;
      return popup?.selections[popup.horizontalIndex]
        ?.map(engine.getKeyFromIndex)
        .join("");
    };
    await frame.locator("canvas").click({ position: { x: 30, y: 30 } });
    await frame.locator("body").press("/");
    await expect.poll(prompt).toBe("/");
    await expect(frame.locator("#keyboard")).toBeVisible();
    await frame
      .locator("body")
      .pressSequentially("server players", { delay: 40 });
    await expect
      .poll(() => ({ prompt: prompt(), admin: hero.PLAYER.admin }))
      .toEqual({ prompt: "/server players", admin: true });
    await frame.locator("body").press("Enter");
    await expect
      .poll(() => ({
        output: hero.PLAYER.popup === hero.PLAYER.interface.server,
        prompt: prompt(),
      }))
      .toEqual({ output: true, prompt: "" });
    expect(friend().PLAYER.popup).toBeUndefined();
    await expect(frame.locator("#keyboard")).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("admin-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: testInfo.outputPath("admin-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await frame.locator("body").press("Escape");
    await expect.poll(() => hero.PLAYER.popup).toBeUndefined();
    await frame.locator("body").press("/");
    await expect.poll(prompt).toBe("/");
    await expect(frame.locator("#keyboard")).toBeVisible();
    await frame
      .locator("body")
      .pressSequentially("server admin Fr", { delay: 40 });
    await expect.poll(prompt).toBe("/server admin Fr");
    await frame.locator("body").press("Tab");
    await expect.poll(prompt).toBe("/server admin Friend ");
    await frame.locator("body").pressSequentially("on", { delay: 40 });
    await frame.locator("body").press("Enter");
    await expect.poll(() => friend().PLAYER.admin).toBe(true);
  } finally {
    await managed.close();
  }
});

test("the native menu portal connects, leaves and reuses the saved identity", async ({
  page,
}, testInfo) => {
  const errors = [];
  const identities = [];
  const frames = [];
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const paste = async (text) => {
    await page.evaluate(async (value) => {
      await navigator.clipboard.writeText(value);
      window.pasteComplete = new Promise((resolve) =>
        document.addEventListener("paste", () => queueMicrotask(resolve), {
          once: true,
        })
      );
    }, text);
    await page.keyboard.press("ControlOrMeta+V");
    await page.evaluate(() => window.pasteComplete);
  };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("websocket", (socket) =>
    socket.on("framereceived", ({ payload }) => {
      const message = JSON.parse(payload.toString());
      if (message.type === "welcome") identities.push(message.id);
      if (message.type === "state")
        frames.push(engine.decodeState(message.state));
    })
  );
  await page.goto("/preview.html?test#game/menu");
  await expect
    .poll(() => page.evaluate(() => typeof window.aliveChat))
    .toBe("function");
  await page.locator("#resume").click();
  await page.evaluate(() => window.aliveChat("/tp 7,20"));
  // Allow the native interaction system to discover the adjacent portal.
  await page.waitForTimeout(150);
  await page.locator("body").press("Enter");
  await expect(page.locator("#keyboard")).toHaveCount(0);
  await page.locator("#right").click();
  await expect(page.locator("#keyboard")).toBeVisible();
  await paste(`127.0.0.1:${server.address.port}`);
  await page.locator("body").press("Enter");
  await page.waitForTimeout(150);
  await page.screenshot({ path: testInfo.outputPath("native-username.png") });
  await paste("Clara");
  await page.locator("body").press("Enter");
  await page.screenshot({ path: testInfo.outputPath("native-connecting.png") });
  await expect.poll(() => identities.length).toBe(1);
  await expect(page.locator("#keyboard")).toHaveCount(0, { timeout: 15000 });
  expect(
    server.simulation
      .worldFor(identities[0])
      .getEntityById(server.simulation.actorId(identities[0])).PLAYER.username
  ).toBe("Clara");
  await page.locator("body").press("Escape");
  await expect(page.locator("#pause-menu")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("native-server-pause.png"),
  });
  await page.locator("#pause-resume").click();
  const world = server.simulation.worldFor(identities[0]);
  const hero = world.getEntityById(server.simulation.actorId(identities[0]));
  const portal = world
    .getEntities(["IDENTIFIABLE", "POPUP"])
    .find((entity) => entity.IDENTIFIABLE.name === "server_portal");
  engine.moveEntity(world, hero, { x: 7, y: 20 });
  await expect
    .poll(() => hero.ACTIONABLE.popup)
    .toBe(world.getEntityId(portal));
  await expect
    .poll(() =>
      frames.some((frame) =>
        frame.snapshot.entities.some(
          ([id, components]) =>
            id === world.getEntityId(hero) &&
            components.ACTIONABLE?.popup === world.getEntityId(portal)
        )
      )
    )
    .toBe(true);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
  await page.locator("body").press("Enter");
  await expect
    .poll(() => world.getEntityById(hero.PLAYER.popup)?.POPUP.tabs)
    .toEqual(["server"]);
  await expect(page.locator("#left")).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: testInfo.outputPath("native-connected.png") });
  await page.locator("#left").click();
  await expect.poll(() => hero.PLAYER.connected).toBe(false);
  await expect(page.locator(".Paused")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => typeof window.aliveChat))
    .toBe("function");
  await page.evaluate(() => window.aliveChat("/tp 7,20"));
  await page.waitForTimeout(150);
  await page.locator("body").press("Enter");
  await expect(page.locator("#keyboard")).toHaveCount(0);
  await page.locator("#left").click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("alive.servers") || "[]").length
      )
    )
    .toBe(0);
  await page.locator("#right").click();
  await expect(page.locator("#keyboard")).toBeVisible();
  await paste(`127.0.0.1:${server.address.port}`);
  await page.locator("body").press("Enter");
  await page.screenshot({ path: testInfo.outputPath("native-return.png") });
  await expect.poll(() => identities.length).toBe(2);
  expect(identities[1]).toBe(identities[0]);
  expect(errors).toEqual([]);
});

test("multiplayer popup hit areas follow rendered content, dragging and dialog buttons", async ({
  page,
}, testInfo) => {
  await page.goto("/game-design/clients/multiplayer.html");
  await page
    .getByRole("textbox", { name: "Server URL" })
    .fill(`127.0.0.1:${server.address.port}`);
  await page
    .getByRole("textbox", { name: "Player 1 username" })
    .fill("Clicker");
  await page
    .getByRole("textbox", { name: "Player 2 username" })
    .fill("Watcher");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "connected" })
  ).toHaveCount(2, { timeout: 15000 });
  const frame = page.frameLocator('iframe[title="Player 1 game"]');
  await frame.locator("canvas").click({ position: { x: 100, y: 100 } });
  const world = server.simulation.world;
  const hero = world
    .getEntities(["PLAYER"])
    .find((actor) => actor.PLAYER.username === "Clicker");
  const other = world
    .getEntities(["PLAYER"])
    .find((actor) => actor.PLAYER.username === "Watcher");
  engine.giveItems(world, hero, [{ stackable: "coin", amount: 100 }]);
  const source = world
    .getEntities(["IDENTIFIABLE", "POPUP"])
    .find((entity) => entity.IDENTIFIABLE.name === "server_portal");
  engine.moveEntity(world, source, {
    x: hero.POSITION.x + 1,
    y: hero.POSITION.y,
  });
  engine.createPopup(world, source, {
    tabs: ["buy", "info"],
    deals: Array.from({ length: 40 }, () => ({
      item: { consume: "potion", material: "wood", stat: "hp", amount: 1 },
      stock: 1,
      prices: [{ stackable: "coin", amount: 1 }],
    })),
    lines: [[], [engine.createText("Shared stock")]],
  });
  engine.openPopup(world, hero, source);
  const popup = () => world.getEntityById(hero.PLAYER.popup);
  const row = () => popup()?.POPUP.verticalIndezes[0];
  await expect(frame.locator("#scroll")).toBeVisible();
  await expect
    .poll(() =>
      frame
        .locator(".Controls")
        .evaluate((element) => element.style.getPropertyValue("--popup-height"))
    )
    .toBe("11");
  await expect
    .poll(() => popup()?.SEQUENCABLE.states.popup.args.contentClickable)
    .toBe(true);
  const bar = await frame.locator("#scroll").boundingBox();
  const cell = bar.height / 9;
  await page.mouse.move(bar.x + bar.width / 2, bar.y + 2 * cell);
  await page.mouse.down();
  await page.mouse.move(
    bar.x + bar.width / 2,
    bar.y + bar.height - 1.5 * cell,
    {
      steps: 12,
    }
  );
  await page.mouse.up();
  await expect.poll(row).toBe(39);
  const top = popup().SEQUENCABLE.states.popup.args.scrollIndex;
  await frame.locator("#content").click({ position: { x: 50, y: cell / 2 } });
  await expect.poll(row).toBe(top);
  await expect
    .poll(() => hero.ACTIONABLE.trade)
    .toBe(world.getEntityId(popup()));
  await frame.locator("#right").click();
  await expect.poll(() => source.POPUP.deals[top].stock).toBe(0);
  expect(other.PLAYER.popup).toBeUndefined();
  await page.screenshot({
    path: testInfo.outputPath("popup-hitareas-desktop.png"),
    fullPage: true,
  });
  await frame.locator("#tab-1").click();
  await expect.poll(() => popup()?.POPUP.horizontalIndex).toBe(1);
  await frame.locator("#close").click();
  await expect.poll(() => hero.PLAYER.popup).toBeUndefined();
  const gameUrl = await page
    .locator('iframe[title="Player 1 game"]')
    .getAttribute("src");
  await page.addInitScript(() => {
    window.addEventListener("message", (event) => {
      if (
        event.data?.type === "server-status" &&
        event.data.status === "connected"
      )
        window.serverReady = true;
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(gameUrl);
  await page.waitForFunction(() => window.serverReady);
  await page.locator("canvas").click({ position: { x: 100, y: 100 } });
  engine.openPopup(world, hero, source);
  await page.locator("#tab-0").click();
  await expect.poll(() => popup()?.POPUP.horizontalIndex).toBe(0);
  await expect(page.locator("#scroll")).toBeVisible();
  const mobileBar = await page.locator("#scroll").boundingBox();
  await page.locator("#scroll").click({
    position: {
      x: mobileBar.width / 2,
      y: mobileBar.height - (1.5 * mobileBar.height) / 9,
    },
  });
  await expect.poll(row).toBe(39);
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: testInfo.outputPath("popup-hitareas-mobile.png"),
    fullPage: true,
  });
  await page.locator("#close").click();
  await expect.poll(() => hero.PLAYER.popup).toBeUndefined();
});

test("isolated renderers share one server with owned controls, dialogs and reconnects", async ({
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(120000);
  const contexts = [];
  const clients = [];
  const errors = [];
  const read = (page) =>
    page.evaluate(() => {
      const element = document.querySelector(
        ".TerminalBrowserPreview, .Terminal"
      );
      if (!element) return null;
      let fiber =
        element[
          Object.keys(element).find((key) => key.startsWith("__reactFiber"))
        ];
      while (fiber && !fiber.memoizedProps?.value?.ecs) fiber = fiber.return;
      const context = fiber?.memoizedProps.value;
      const world = context?.ecs;
      const hero = world?.getEntityById(world.metadata.localPlayerId);
      const popup = world?.getEntityById(hero?.PLAYER.popup);
      return {
        network: !!world?.metadata.network,
        level: world?.metadata.gameEntity.LEVEL.name,
        position: hero?.POSITION,
        paused: context?.paused,
        dialog: popup?.POPUP.active
          ? popup.POPUP.tabs[popup.POPUP.horizontalIndex]
          : null,
      };
    });
  try {
    for (const renderer of ["three-js", "html", "terminal"]) {
      const context = await browser.newContext({
        viewport: { width: 900, height: 800 },
      });
      contexts.push(context);
      const page = await context.newPage();
      page.on("pageerror", (error) =>
        errors.push(`${renderer}: ${error.message}`)
      );
      const client = { page, renderer };
      clients.push(client);
      page.on("websocket", (socket) =>
        socket.on("framereceived", ({ payload }) => {
          const message = JSON.parse(payload.toString());
          if (message.type === "welcome") client.id = message.id;
        })
      );
      const folder = renderer === "three-js" ? "/" : `/${renderer}/`;
      await page.goto(
        new URL(
          `${folder}preview.html?server=127.0.0.1:${server.address.port}&username=Renderer${clients.length}#servers`,
          baseURL
        ).href
      );
      await expect
        .poll(async () => (await read(page))?.network, { timeout: 20000 })
        .toBe(true);
      await expect.poll(() => client.id).toBeTruthy();
      await expect.poll(async () => (await read(page))?.paused).toBe(false);
      await page.screenshot({
        path: testInfo.outputPath(`${renderer}-menu.png`),
      });
    }
    expect(new Set(clients.map((client) => client.id)).size).toBe(3);
    for (const client of clients) {
      const world = server.simulation.worldFor(client.id);
      const actor = world.getEntityById(server.simulation.actorId(client.id));
      world.metadata.warpPlayer(
        world.getEntityId(actor),
        "LEVEL_TUTORIAL",
        "rogue",
        actor.SPAWNABLE.hairColor,
        true
      );
    }
    for (const { page } of clients)
      await expect
        .poll(async () => (await read(page))?.level, { timeout: 20000 })
        .toBe("LEVEL_TUTORIAL");
    for (const [index, { page, id, renderer }] of clients.entries()) {
      await page.bringToFront();
      if ((await read(page)).paused) await page.keyboard.press(" ");
      await page.keyboard.press("g");
      await expect.poll(async () => (await read(page))?.dialog).toBe("gear");
      const actor = server.simulation
        .worldFor(id)
        .getEntityById(server.simulation.actorId(id));
      expect(actor.PLAYER.popup).toBeTruthy();
      for (const other of clients.filter((client) => client.id !== id)) {
        const otherActor = server.simulation
          .worldFor(other.id)
          .getEntityById(server.simulation.actorId(other.id));
        expect(otherActor.PLAYER.popup).toBeFalsy();
      }
      await page.screenshot({
        path: testInfo.outputPath(`${renderer}-gear.png`),
      });
      await page.keyboard.press("Escape");
      await expect.poll(async () => (await read(page))?.dialog).toBeNull();
      const before = { ...actor.POSITION };
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => actor.POSITION).not.toEqual(before);
      await expect
        .poll(async () => (await read(page))?.position)
        .toEqual(actor.POSITION);
      await page.keyboard.press("c");
      await expect.poll(async () => (await read(page))?.dialog).toBe("chat");
      await page.keyboard.type(`hello ${index}`);
      await page.keyboard.press("Enter");
      await expect.poll(async () => (await read(page))?.dialog).toBeNull();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: testInfo.outputPath(`${renderer}-small.png`),
      });
    }
    const returning = clients[2];
    await returning.page.reload();
    await expect
      .poll(async () => (await read(returning.page))?.network, {
        timeout: 20000,
      })
      .toBe(true);
    expect(
      server.simulation
        .worldFor(returning.id)
        .getEntities(["PLAYER"])
        .filter((actor) => actor.PLAYER.accountId === returning.id)
    ).toHaveLength(1);
    expect(errors).toEqual([]);
  } finally {
    for (const context of contexts) await context.close();
  }
});
