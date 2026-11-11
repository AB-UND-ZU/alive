# Vessel

Coordinates a mounted player with the vessel that carries it.

Mounted movement runs once per player reference generation. It updates passenger and vessel positions, checks destinations and handles leaving the vessel. [Mountable](../components/mountable.md) links the passenger; [Player](../components/player.md) stores the current mount.

Runs before normal [Movement](movement.md), which skips movement already consumed by the vessel action.

Water vessels play a soft wash while moving. Starting, turning and stopping can play a bubble sound; the visual bubble trail stays silent during steady sailing.
