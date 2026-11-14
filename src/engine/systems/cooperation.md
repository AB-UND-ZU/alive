# Cooperative progression

Hosted worlds install `metadata.warpPlayer`. Single-player worlds keep their existing quest behavior.

`LEVEL.cooperativeRewards` records each completed quest's selected items and experience. `PLAYER.rewardOffsets` stores a receipt cursor for each level. The completing player pays the native quest prices and receives the native reward; `shareQuestRewards` records the batch and marks that player's receipt before synchronizing peers. `setupCooperation` grants remaining batches through native inventory/stat handling, including offline characters. Dead characters wait until they can receive inventory again. Both the log and receipts belong to the world snapshot, so reconnects, level transfers and saves do not duplicate rewards.

Defeated-unit counts belong to the shared level as well as each character. All characters in that level get quest kill credit, and a new arrival starts with the level's current totals. Ordinary ground loot stays shared rather than being copied for every character.

Ground loot, including the first dungeon stick, belongs to whoever collects it. Players can break fences for additional sticks. Only quest rewards use the cooperative reward log.
