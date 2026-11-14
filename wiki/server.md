# Server

Run from the project folder:

```sh
npm install
npm run server
```

Enter the printed WebSocket address on [Multiplayer](clients-multiplayer.md). Use the LAN address when playing from another device. The default port is [[data:3001]].

## Shared world

The server runs movement, combat, enemies and quests. Players send actions and see the server's results.

Players share the world, ground loot and quest progress. Everyone receives completed quest rewards. Each player has their own character, equipment and dialogs. Pausing one game leaves the world running.

## Savegames

The server saves all worlds and characters automatically in `~/.alive/server.save`. Restart it with the same file to continue.

Each client stores a secret reconnect token in its browser. Keep its site data and use the same server address to return to that character. The two Multiplayer previews keep separate tokens.

To choose a save file:

```sh
ALIVE_SERVER_SAVE=/path/to/server.save npm run server
```
