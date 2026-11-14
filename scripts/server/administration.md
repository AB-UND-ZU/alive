# Server administration

`createAdministration` owns startup admin IDs, runtime grants and the public player roster. The transport owns credential verification. Usernames use 1–16 ASCII letters, digits, underscores or hyphens, starting with a letter, digit or underscore; matching ignores case. Returning credentials always use the saved name. Unnamed actors remain in a private chat prompt and cannot move or perform gameplay actions.

Only authoritative admin players can execute commands or use test features. Each admin has one pending server command, consumed after a host step with permission checked again. Native gameplay commands keep the normal actor tick path. Runtime grants reset to the startup allowlist on restart.

Kicking releases input and closes connections while retaining characters. Banning also forgets the actor and private interface, saves the ban, and reserves both UUID and username. Only account identity, credential hash, username and ban/reset metadata remain; unbanning lets the same credential create a fresh character. A new credential cannot claim a reserved name. Client UUIDs are not authentication secrets: reconnect still requires the bearer token.

Server replies use an owner-specific native INFO window so player lists can scroll. Restart saves, closes sockets with code 1012, reloads the durable world, and reapplies startup permissions. Code 1008 for a kick/ban intentionally stops automatic reconnection.
