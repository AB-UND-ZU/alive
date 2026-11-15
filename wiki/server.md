# Server

Run from the project folder:

```sh
npm install
npm run server
```

In the game, use the Servers portal and select **(Add server)**. Enter the printed WebSocket address and a username when asked. [Multiplayer](clients-multiplayer.md) also connects two previews. Use the LAN address when playing from another device. The default port is [[data:3001]].

## Shared world

The server runs movement, combat, enemies and quests. Players send actions and see the server's results.

Players share the world, ground loot and quest progress. Everyone receives completed quest rewards. Each player has their own character, equipment and dialog selections. Stock and brewing queues are shared. Pausing one game leaves the world running.

## Savegames

The server saves all worlds and characters automatically in `~/.alive/server.save`. Restart it with the same file to continue.

Usernames are unique and saved with each character. Returning clients keep their saved name.

Each browser stores a secret reconnect token. The native terminal client stores its token separately. Keep its site data and use the same server address to return to that character. Erasing a saved server removes its local address only. Adding it again restores the same character. The two embedded previews keep separate tokens.

To choose a save file:

```sh
ALIVE_SERVER_SAVE=/path/to/server.save npm run server
```

## Admins

Joining players print their username and player ID in the server terminal. Restart with the IDs that may use Test Mode and commands:

```sh
npm run server -- --admin <player-id> --admin <player-id>
```

Other players can chat, but cannot run commands. Tab completes usernames in server commands.

| Command | Action |
| --- | --- |
| `/server players [online\|offline\|banned]` | List all players or one group. |
| `/server kick <username>` | Disconnect one player; keep their character. |
| `/server kickall` | Disconnect everyone; keep characters. |
| `/server ban [username]` | Delete a character and ban its ID and username. Omit the name to list bans. |
| `/server unban [username]` | Remove a ban. The player starts a fresh character. Omit the name to list bans. |
| `/server admin [username] [on\|off]` | Grant, revoke or toggle commands. Omit the name to list admins. |
| `/server restart` | Save the world and restart; clients reconnect. |

Admin changes last until restart. Startup IDs keep their permission after restart. A ban keeps the username reserved until its owner returns after being unbanned.
