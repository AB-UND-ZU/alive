# Docs App

Comma-separated code values in Markdown table cells render one value per line.

Internal links use browser history. Fragment changes also notify catalog selectors, so linking to another variant on the current page updates the selected portrait. Every route has a static HTML shell for direct loading. Navigation comes from `scripts/docs/navigation.json` and the source file groups.

The fixed header shows maroon ALIVE, the grey game version and Documentation below an empty row. Its full-width separator is clipped at the bottom pixel of the line. Intro contains Welcome (`index.html`) and Play (`intro/play.html`), before the Game Design tab. Navigation titles use at most sixteen cells. The current route uses the active selection icon; hovering another row temporarily shows the plain selection icon there. Both highlights fill the menu width. The active background remains while another row is hovered. Scrolling uses the browser without snapping or translation. Only the page heading uses the three-row alphabet.

Routes follow the menu: `game-design/<group>/<page>.html` and `development/<group>/<source>.html`. Welcome stays at `index.html`. The builder resolves Markdown links from source paths, and item, unit and feature references use the generated routes. Old URLs load the same page and switch to its canonical route while preserving the anchor.
Automatic links omit the current page and repeat each destination only once per Markdown section. Explicit links can still point to another anchor on the same page. Sprite mentions keep their game colors when a repeated link is omitted.

The navigation uses the game dialog's arrow, track and handle sprites over a native vertical scroll area. The browser scrollbar and horizontal overflow are hidden. The buttons move one row; the track and keyboard arrows change the same scroll position.
<!-- source-types -->

## Navigate

```ts src/documentation/App.tsx
type Navigate = (route: string) => void;
```
