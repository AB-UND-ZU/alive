# Server Game

A Servers preview frame mounts the selected isolated renderer with a slot-specific credential store. Its connection guard survives World child remounts, so receiving the first server world cannot join again.

The parent passes its shared preview client as children, so the terminal build never imports the browser scene or Three.js.

The frame reports connection status to its parent and enables sound only after interaction. Controls release held input on blur while keeping the view live; page hiding still pauses normally. Unmounting closes the native connection.

The optional `username` query parameter is forwarded when joining; credentials still come from the isolated client-slot storage.

The native Servers portal can leave and reconnect independently. Parent frame status distinguishes a locally returned game from an initial connection failure.
