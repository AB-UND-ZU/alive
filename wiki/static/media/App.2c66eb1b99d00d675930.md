# Wiki App

Renders Markdown tokens in React and follows browser history. Every page also has a generated HTML shell, so its URL works when loaded directly on static hosting.

| Part | Source |
| --- | --- |
| Menu order and groups | `pages.json` |
| Page content and source notes | Markdown in `wiki/` and adjacent source files |
| Rendering and browser navigation | `App.tsx` |
| Canonical routes, aliases and anchors | Route registry and source-reference index |

Routes follow `game-design/<group>/<page>.html` and `development/<group>/<source>.html`; Welcome remains `index.html`. Old URLs redirect to the canonical route while retaining their anchor. Navigation keeps the current page and controls visible while the next Markdown file loads. Content, active navigation, title and scroll position switch together once it is ready; failed requests report an alert without discarding the current page.

Automatic prose links omit the current page and repeat a destination only once in each section. Explicit indexes and source references retain their precise anchor. Development inline code resolves exact local/imported symbols and full source paths; ordinary prose keeps its original words.

The navigation uses dialog arrow, track and handle sprites over a native scroll area. Hover moves the pointer to another row while keeping the active row's solid background. Scrolling remains native.
Entity mentions keep their sprite/name destination even for repeated or same-page references. Gameplay tables also resolve entity names from the native reference index; source prose keeps its code-only linking policy.

Simple linked entity labels and authored links use the same native decoration data as automatic mentions. Links that already contain a sprite keep their authored composition. Keyboard instructions use short key-first paragraphs so native key cells do not split prose into flex rows.
<!-- source-types -->

## Navigate

```ts src/wiki/App.tsx
type Navigate = (route: string) => void;
```
