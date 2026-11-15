# Terminal

```scene
clients/terminal
```

[Play Terminal](../terminal/) in the browser, or run it in a UTF-8 terminal locally or over SSH. Each cell has one character, a foreground color and a background color. Movement snaps to cells; health bars and stack dots are omitted.

```sh
npm run terminal
```

Use `npm run terminal -- --test` to enable [chat commands](chat.md). Sounds play on the host machine through native Web Audio. The native client requires Node.js 24 or newer. Native terminal saves are separate; browser clients share [savegames](savegames.md).

Connect to a [Server](server.md):

```sh
npm run terminal -- --server localhost:3001 --name Player
```

The server saves the character. The native client keeps its reconnect token in `~/.local/share/alive/servers.json`, or under `XDG_DATA_HOME` when set. Server admins may use commands.

| Input | Action |
| --- | --- |
| [[key:↑]][[key:←]][[key:↓]][[key:→]] | Move |
| [[key:W]][[key:A]][[key:S]][[key:D]] | Move |
| [[key:Enter]] | Interact or confirm |
| [[key:Space]] | Cast the equipped spell |
| [[key:Ctrl]] [[key:S]] | Use the equipped skill or tool |
| [[key:C]] | Open Chat |
| [[key:Tab]] | Change dialog tabs |
| [[key:Escape]] | Go back, close a dialog or pause |
| [[key:Ctrl]] [[key:C]] | Save and quit (native) |

[Other keyboard shortcuts](keyboard-mouse.md) match the browser. The preview uses a keyboard.
