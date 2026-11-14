# Replica presentation

The replica keeps cosmetic sequence state outside authoritative components. It creates existing stacked-sprite particles with negative IDs, preserving the server's positive ID space and allocation counter. Snapshot patches leave these particles alone; stop, actor changes and world changes dispose them. No movement, combat, AI or quest system runs on a client.

Smoke, weather, portal dots, highlights, splash phases, fire and audited read-only popup builders animate using server start times and local presentation time. Weather cannot alter terrain here; fire cannot deal damage. Each client generates weather around its own player, and popup particles remain private to their reader.
