# Server Game

A Servers preview frame mounts the normal game with a slot-specific credential store. Its connection guard survives World child remounts, so receiving the first server world cannot join again.

The frame reports connection status to its parent and enables sound only after interaction. Controls release held input on blur while keeping the view live; page hiding still pauses normally. Unmounting closes the native connection.
