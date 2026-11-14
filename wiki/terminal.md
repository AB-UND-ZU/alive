# Terminal

Play in a UTF-8 terminal, locally or over SSH. Each cell has one character, a foreground color and a background color. Movement snaps to cells; health bars and stack dots are omitted.

```sh
npm run terminal
```

Use `npm run terminal -- --test` to enable [chat commands](chat.md). Terminal saves are separate from browser [savegames](savegames.md).

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
| [[key:Ctrl]] [[key:C]] | Save and quit |

[Other keyboard shortcuts](keyboard-mouse.md) match the browser. The preview uses a keyboard.

```scene
clients/terminal
```
