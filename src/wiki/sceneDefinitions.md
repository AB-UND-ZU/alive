# Preview Definitions

Scene titles, instructions, autoplay keys and viewport sizes. The iframe manager imports this data without loading scene factories or the game engine. `scenes.ts` builds the worlds used by feature previews.
<!-- source-types -->

## SceneName

```ts src/wiki/sceneDefinitions.ts
export type SceneName = keyof typeof sceneDefinitions;
```
