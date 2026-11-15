# Saved servers

`createServerList` stores normalized server addresses in the client's bookmark list. Browser clients and the native terminal install its list and erase callbacks on each local world. Joining adds an address once. Erasing removes that bookmark and its reconnect credentials. It sends no deletion to the server: the old character remains orphaned, and adding the address again creates a new player.
