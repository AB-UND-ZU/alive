# Controls

Move with the arrow keys or **W A S D**. On a touch screen, drag to move and tap the action buttons. Read the button labels: the available action changes with your equipment and surroundings.

## Keyboard

| Key                  | Action                                                          |
| -------------------- | --------------------------------------------------------------- |
| Arrow keys / W A S D | Move; navigate a menu when one is open                          |
| Enter                | Interact or confirm                                             |
| Space                | Cast the equipped spell; activate the current spell-side action |
| Shift                | Use the equipped skill or tool                                  |
| Q                    | Switch between the skill and tool                               |
| B                    | Inspect / open the bag view                                     |
| E                    | Use the selected item                                           |
| G                    | Open gear                                                       |
| T                    | Open stats                                                      |
| M                    | Open the map                                                    |
| Tab                  | Change menu tab                                                 |
| Escape               | Close a menu or pause / resume                                  |
| 0–9                  | Select a quick slot where available                             |

## Walking

Movement happens one cell at a time. Holding a direction repeats the action. Releasing it stops walking. Haste and the ground under you affect the interval between actions.

```scene
movement
```

Try walking right until the mountain stops you. Move up or down to walk around it. The world wraps at its edges.

## Interacting

Walk close to a sign, door, character, or workstation. A prompt shows what you can do. Press Enter or tap the prompt to interact. Context actions can take priority over an equipped ability.

In menus, use up and down to select a row and left and right where the menu offers choices. Enter confirms the selection. Tab changes tabs. Escape closes the window. Disabled actions usually mean a missing item, a condition, or a target that cannot be used yet.

## Pause and touch

Press Escape or the pause button to pause. Escape or the pause button resumes. Switching away from the browser tab pauses play. On touch screens, the two main buttons use their action names rather than keyboard shortcuts. Dragging outside the buttons controls direction.

For tools, activate the tool first and then give a direction. Q lets you return to your combat skill without discarding the tool. See [gathering](gathering.md) for each tool's job.

## Save and continue

Pausing the game saves it. The pause screen lists **RESUME**, **MENU** and **SAVE**. **MENU** saves and returns to the main menu, and **SAVE** saves again. The name of the game's save appears below **SAVE**. Nothing is saved in the main menu or while stepping through a portal, and the main menu's pause screen only offers **RESUME**.

Saves stay in this browser on this device. Clearing the site data of your browser deletes them. Each game keeps one save that is updated whenever you save it, and every new game gets its own save. Its name is the time of the last save, for example `20261011-151323` for 11 October 2026 at 15:13:23.

The **Continue** row of the main menu and its portal only open once there is a save. Walk to the portal and interact with it. The list shows the latest save first. Below it are the hero's class and equipped items, level and world, deaths, enemies killed and time played. Choose a save and confirm **LOAD**. The hero steps into the portal and appears where the game was saved, with all stats and items.

To delete a save, choose it and press **ERASE**, then confirm with **YES** or go **BACK**. Erased saves can't be restored.

Saves from a newer version of the game are shown in dark red and can't be loaded. Saves from older versions are upgraded when loaded.
