# Preview scenes

`createPreviewWorld` composes a small level with `createAreaWorld`, `createCell`, and `populateInventory`. Each scene has a Rogue, its required equipment and resources, and a target or workstation. The static Interface diagram imports the Island spawn area; it does not run an interactive scene. Feature scenes have a stationary viewpoint that yields to dialogs and collision walls aligned with the visible frame.

Dialog previews open their menu and leave it available for inspection. Movement previews follow one direction rather than pacing back and forth. Reset restores the initial scene and demonstration.

The preview mounts the game's `Dimensions`, `World`, `Stats`, `Terminal`, and `Controls`. `Terminal` mounts the normal camera and renderer. An iframe isolates window-level controls and game CSS from the surrounding page.

| State                     | Behavior                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| Focus                     | Unpause; route normal keyboard and touch input to the game                                              |
| Auto                      | Send ordinary keydown/keyup events from the scene's short input sequence, then leave the result visible |
| Blur / hidden / offscreen | Release held input; resume autoplay on blur, pause while hidden                                         |
| Reset                     | Reload the isolated world                                                                               |

```ts
createCell(world, { x: 3, y: 4 }, "bench", "visible");
populateInventory(world, hero, ingredients, equipment);
preloadLevel(world);
```
<!-- source-types -->

## SceneName

```ts src/documentation/scenes.ts
export type SceneName = keyof typeof sceneDefinitions;
```
