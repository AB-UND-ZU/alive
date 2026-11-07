# Chat

Chat is available in test mode: append `?test` to the game URL. Messages appear above the hero; they are not sent to other players.

| Key                   | Action                            |
| --------------------- | --------------------------------- |
| [[key:C]]             | Open chat                         |
| [[key:/]]             | Open chat with `/`                |
| [[key:Enter]]         | Submit                            |
| [[key:↑]] / [[key:↓]] | Previous / next submitted message |
| [[key:Backspace]]     | Delete                            |
| [[key:Escape]]        | Close                             |

## Command builder

Type to search commands or arguments. [[key:Tab]] accepts the gray completion. [[key:↑]] / [[key:↓]] select a suggestion. Run applies the command to the preview below.

```widget
commands
```

## Commands

`<arg>` is required. `[arg]` is optional. Arguments are separated by one space. Names are case sensitive. Coordinates wrap at the world edges.

| Command                          | Example                   | Effect                                                     |
| -------------------------------- | ------------------------- | ---------------------------------------------------------- |
| `/help [cmd]`                    | `/help give`              | Show usage; no argument shows the help prompt              |
| `/list [type]`                   | `/list item`              | List command data                                          |
| `/give <item> [num] [mat] [ele]` | `/give sword 1 iron fire` | Drop an item nearby; does not equip it                     |
| `/stat <type> [num]`             | `/stat hp 25`             | Read or set a stat, defeated-unit count, or view priority  |
| `/cast <item> [mat] [ele]`       | `/cast wave wood water`   | Cast an ability directly                                   |
| `/tp <id\|x,y>`                  | `/tp 4,4`                 | Teleport to coordinates or near a named entity             |
| `/mod <type>`                    | `/mod fly`                | Change movement, faction, or stats                         |
| `/focus [id]`                    | `/focus target`           | Highlight a named entity; no ID clears focus               |
| `/new [cell] [num] [dir]`        | `/new tree 3 right`       | Place cells in a line; no cell clears the cell ahead       |
| `/pin <name> [x,y]`              | `/pin target 4,4`         | Name a location; omitted coordinates use the hero position |

## Items and aliases

```widget
items
```

| Argument     | Values                                                             |
| ------------ | ------------------------------------------------------------------ |
| Material     | `wood`, `iron`, `gold`, `diamond`, `ruby`                          |
| Element      | `fire`, `water`, `earth`, `air`                                    |
| Direction    | `up`, `right`, `down`, `left`                                      |
| List         | `list`, `mod`, `cmd`, `item`, `id`, `stat`, `cast`, `cell`         |
| Movement mod | `fly`, `swim`, `walk`                                              |
| Faction mod  | `pvp` → hostile; `pve` → settler                                   |
| Stat mod     | `god` raises combat stats; `reset` restores class/level base stats |

## Give

| Example                     | Result                     |
| --------------------------- | -------------------------- |
| `/give sword`               | [[item:sword]]             |
| `/give sword 1 iron fire`   | [[item:sword iron fire]]   |
| `/give arrow 10`            | [[item:10 arrow]]          |
| `/give potion 10 wood hp`   | [[item:10 potion wood hp]] |
| `/give potion 10 iron mp`   | [[item:10 potion iron mp]] |
| `/give bucket 1 iron water` | [[item:bucket iron water]] |

For `/give`, material `default` clears the material. A potion's final argument is a stat such as `hp` or `mp`, rather than an element. The amount defaults to 1.

## Cast

Material defaults to wood. Valid names are spells and skills, except `zap` and `block`. Cast executes the effect directly; it does not grant an item or require equipped gear.

```text
/cast beam iron fire
/cast slash wood
```

## Locations

Pins must have unique names. `/list id` shows names in the current world.

```text
/pin target 8,4
/focus target
/tp target
/focus
```

## Cells

`/new` defaults to one cell in the hero's facing direction, or up when there is no facing. `/list cell` shows valid names. Clearing excludes the hero and buildings.

```text
/new water_deep 3 right
/new tree 2 down
/new
```

## Errors

Unknown commands and wrong argument counts show usage. Invalid items, materials, elements, coordinates, and IDs return an error above the hero.

```text
/give unknown
No item "unknown"!
```

```scene
chat
```
