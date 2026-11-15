# Saved servers

`createServerList` stores normalized server addresses in the client's bookmark list. Browser clients and the native terminal install its list and erase callbacks on each local world. Joining adds an address once. Erasing removes only that bookmark; the separate reconnect credentials remain, so adding the address again restores the same player ID and character.
