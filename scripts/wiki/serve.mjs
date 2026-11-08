import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { root } from "./build.mjs";
async function buildWiki() {
  const builder = await import(`./build.mjs?revision=${Date.now()}`);
  await builder.buildWiki(".wiki-dev");
}
await buildWiki();
const directory = path.join(root, ".wiki-dev"),
  clients = new Set();
async function snapshotFiles(folder, prefix = "") {
  const snapshot = new Map();
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name),
      route = prefix + "/" + entry.name;
    if (entry.isDirectory())
      for (const [key, data] of await snapshotFiles(file, route))
        snapshot.set(key, data);
    else snapshot.set(route, await readFile(file));
  }
  return snapshot;
}
let snapshot = await snapshotFiles(directory);
let building = false,
  dirty = false,
  timer;
async function rebuild() {
  if (building) {
    dirty = true;
    return;
  }
  building = true;
  try {
    await buildWiki();
    snapshot = await snapshotFiles(directory);
    for (const client of clients) client.write("data: reload\n\n");
  } catch (error) {
    console.error(error.message);
  } finally {
    building = false;
    if (dirty) {
      dirty = false;
      schedule();
    }
  }
}
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 180);
}
for (const folder of ["wiki", "src", "scripts/wiki", "public/fonts"])
  watch(path.join(root, folder), { recursive: true }, schedule);
for (const file of ["package.json", "tsconfig.json"])
  watch(path.join(root, file), schedule);
const reloadClient = `const changes=new EventSource('/__wiki_events');changes.onmessage=event=>{if(event.data==='reload')window.location.reload();};`;
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json",
};
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/__wiki_health") {
      response.writeHead(200);
      response.end("Ready");
      return;
    }
    if (url.pathname === "/__wiki_events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      response.write(": connected\n\n");
      clients.add(response);
      request.on("close", () => clients.delete(response));
      return;
    }
    if (url.pathname === "/__wiki_reload.js") {
      response.writeHead(200, {
        "Content-Type": "text/javascript",
        "Cache-Control": "no-store",
      });
      response.end(reloadClient);
      return;
    }
    const route = url.pathname.endsWith("/")
      ? url.pathname + "index.html"
      : url.pathname;
    let data = snapshot.get(decodeURIComponent(route));
    if (!data) throw Error("Not found");
    if (route.endsWith(".html") && path.basename(route) !== "preview.html")
      data = data
        .toString()
        .replace(
          "</head>",
          '<script defer src="/__wiki_reload.js"></script></head>'
        );
    response.writeHead(200, {
      "Content-Type": types[path.extname(route)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(Number(process.env.WIKI_PORT || 4173), "127.0.0.1", () =>
  console.log(
    `Wiki: http://127.0.0.1:${
      process.env.WIKI_PORT || 4173
    } (watching Markdown, React and CSS)`
  )
);
