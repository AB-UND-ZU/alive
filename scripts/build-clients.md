# Client Builds

`npm run build` builds three independent clients:

| Renderer | Output            | Pages URL          |
| -------- | ----------------- | ------------------ |
| ThreeJS  | `build/`          | `/alive/`          |
| HTML     | `build/html/`     | `/alive/html/`     |
| Terminal | `build/terminal/` | `/alive/terminal/` |

`REACT_APP_RENDERER` selects the renderer at compile time. Each build has its own entry files, lazy chunks and asset paths. The build checks emitted source maps for other renderer implementations, and rejects ThreeJS dependencies in HTML or Terminal. Source maps remain enabled for these checks.

`npm run build -- --renderer html` builds only that client. `BUILD_PATH` changes the output root; `PUBLIC_URL` changes the public root. `build:client` runs the underlying CRA build for a single renderer.

Each client gets a `preview.html` shell for the same renderer. The wiki is built separately into `build/wiki/`. Browser tests serve this combined layout so client links and preview assets use the same folder structure as Pages.
