# Servers

The local game's pause menu offers Servers. Enter the host's printed WebSocket address, such as `192.168.0.2:3001`, then connect. The browser enters the shared server menu; character selection and portal travel use authoritative game inputs.

The host field uses native invisible input editing so mobile browsers open their keyboard. Its visible text, cursor and buttons use the existing sprite rows. Keyboard focus changes the button sprites. Failed connections retain the entered address; Back returns to the local menu.

The last host address and the per-server reconnect credential are local metadata. The actual world and character saves belong to the server. Connecting again with the same browser storage reclaims that character. Composed wiki worlds do not expose server connections.
