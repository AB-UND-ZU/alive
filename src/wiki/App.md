# Wiki App

Renders Markdown tokens in React and follows browser history. Every page also has a generated HTML shell, so its URL works when loaded directly on static hosting.

| Part | Source |
| --- | --- |
| Menu order and groups | `scripts/wiki/navigation.json` |
| Page content and source notes | Markdown in `wiki/` and adjacent source files |
| Rendering and browser navigation | `App.tsx` |
| Canonical routes, aliases and anchors | Build manifest |

Routes follow `game-design/<group>/<page>.html` and `development/<group>/<source>.html`; Welcome remains `index.html`. Old URLs redirect to the canonical route while retaining their anchor.

Automatic prose links omit the current page and repeat a destination only once in each section. Explicit indexes and source references retain their precise anchor. Development inline code resolves exact local/imported symbols and full source paths; ordinary prose keeps its original words.

The navigation uses dialog arrow, track and handle sprites over a native scroll area. Hover moves the pointer to another row while keeping the active row's solid background. Scrolling remains native.
<!-- source-types -->

## Navigate

```ts src/wiki/App.tsx
type Navigate = (route: string) => void;
```
