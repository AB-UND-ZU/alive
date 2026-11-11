# Chat

Chat accepts messages and commands in Test Mode. Messages stay in your game; they are not sent to other players.

```widget
popup chat
```

| Key | Action |
| --- | --- |
| [[key:C]] | Open chat |
| [[key:/]] | Open chat with `/` |
| [[key:Enter]] | Submit |
| [[key:Tab]] | Accept the gray suggestion |
| [[key:↑]] [[key:↓]] | Cycle suggestions; browse saved history from an empty line |
| [[key:Backspace]] | Delete |
| [[key:Escape]] | Clear the line; press again to close |

## Command Reference

Arguments use spaces and case-sensitive names. `<arg>` is required; `[arg]` is optional. Invalid arguments return an error or usage above the hero.

```widget
command-reference
```

## Try Commands

Type `/gi`. Tab accepts the gray suggestion; on touch screens, swipe right over the dialog or keyboard. Type a longer prefix to narrow the suggested word. Up and Down choose a suggestion. From an empty line, Up recalls messages saved in this browser.

```scene
chat
```
