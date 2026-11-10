const http = require("http"),
  fs = require("fs"),
  path = require("path");
http
  .createServer((req, res) => {
    const u = new URL(req.url, "http://localhost");
    const stage = u.searchParams.get("stage") || "baseline";
    if (u.pathname === "/") {
      res.setHeader("Content-Type", "text/html");
      return res.end(
        `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/${stage}/entry.css"></head><body><div id="root"></div><script src="/${stage}/entry.js"></script></body></html>`
      );
    }
    const name = path.join(
      u.pathname.startsWith("/fonts/") ? "public" : "results/performance/live",
      u.pathname
    );
    try {
      res.setHeader(
        "Content-Type",
        name.endsWith(".js")
          ? "text/javascript"
          : name.endsWith(".css")
          ? "text/css"
          : "application/octet-stream"
      );
      res.end(fs.readFileSync(name));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  })
  .listen(4196, "127.0.0.1", () => console.log("http://127.0.0.1:4196"));
