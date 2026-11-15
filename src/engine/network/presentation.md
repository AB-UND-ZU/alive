# Replica presentation

The replica keeps cosmetic sequence state outside authoritative components. It creates existing stacked-sprite particles with negative IDs, preserving the server's positive ID space and allocation counter. Snapshot patches leave these particles alone; stop, actor changes and world changes dispose them. No movement, combat, AI or quest system runs on a client.

Smoke, weather, portal dots, highlights, splash phases, fire, confirmed hit markers and audited read-only popup builders animate using server start times and local presentation time. Weather cannot alter terrain here; fire cannot deal damage. Each client generates weather around its own player, and popup particles remain private to their reader.

Local visual revisions are separate from authoritative render counters. This avoids invalidating popup content caches on their own redraws and keeps server state intact. Presentation sequences require their initial arguments and start times; server test saves must be reset when changing that format.

Discovery, interaction prompts and player chat are also local presentations. Discovery checks the local player's personal prompt, so another player's interaction cannot hide its marker. Interaction animations accept skipped frames. Dialog typing and untyping change only local particles; the server retains message lifetime and cleanup. NPC dialog progression remains authoritative.
