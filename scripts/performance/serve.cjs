const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const stage = url.searchParams.get("stage") || "baseline";
    let name;
    if (url.pathname === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/${stage}/entry.css"></head><body><div id="root"></div><script src="/${stage}/entry.js"></script></body></html>`
      );
      return;
    }
    name = path.join(
      url.pathname.startsWith("/fonts/") ? "public" : "results/performance",
      url.pathname
    );
    try {
      res.setHeader(
        "Content-Type",
        name.endsWith(".js")
          ? "text/javascript"
          : name.endsWith(".css")
          ? "text/css"
          : name.endsWith(".json")
          ? "application/json"
          : "application/octet-stream"
      );
      res.end(fs.readFileSync(name));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  })
  .listen(4186, "127.0.0.1", () => console.log("http://127.0.0.1:4186"));
