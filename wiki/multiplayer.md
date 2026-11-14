# Co-op

Experimental local-network co-op supports up to [[data:8]] connected players. A host computer runs the shared world. Each browser controls its own character.

## Join a server

Open the game from the host's game address. Pause, choose [[button:SERVERS]], enter the host address and choose [[button:CONNECT]]. The host supplies a WebSocket address such as `ws://192.168.1.10:3001`.

Choose a username in the chat prompt when first connecting. The server remembers it with your reconnect key.

A new character arrives in the shared [Menu](menu.md). Use [Portals](portals.md) to choose a character and enter the [Dungeon](dungeon.md). Returning players reconnect to their own character in its current level.

Use the same browser profile, game address and server address when returning. The browser stores a secret reconnect key; keep its site data to retain access to the character. Different browser profiles create different characters. Connecting the same character in another tab replaces its older connection.

## Playing together

World changes, explored areas, quest progress, defeated enemies and ground loot are shared.

Each player has their own character, equipment, quick items, dialogs, camera, controls, pause screen and chat input.

Everyone receives the same completed quest rewards once. Disconnected characters receive them too; dead characters receive pending rewards after revival. Later arrivals catch up with completed quest rewards and use the current shared checkpoint.

The first tutorial stick supplies a starter weapon for every teammate. Dungeon quest hints follow the room each character enters.

Only one player can read a particular shared dialog at a time. Teammates can pass through each other, and dungeon fight entrances stay open for the party.

[[key:C]] Open chat.

[[key:Enter]] Send chat.

On touch screens, open the use window and choose [[button:CHAT]]. Messages appear above the speaking character for [[data:3]] seconds. A new message replaces the previous one. Server admins can run commands; for other players, messages starting with `/` remain chat.

## Pause, leave and return

Pausing stops your input while the shared world continues. Your character can still be attacked. Returning to the local menu or closing the connection leaves the character on the server, hidden from active play until it reconnects.

The server saves automatically. Its save contains the shared worlds and every character. The browser's single-player save list does not contain server characters. See [Savegames](savegames.md) for local games.

During connection loss, movement stops and old actions are discarded. Reconnecting loads current server state. Movement and spells wait for server confirmation; fast sprite changes may look less smooth on a slow connection.
