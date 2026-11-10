# Item Sources

The wiki reads normal item sources from balancing exports. NPC quest rewards live inside sequence closures, so this extractor reads their TypeScript syntax when `wiki:sources` is run. It collects literal `deals[].item` rewards and `choices[]` items with their owning NPC and source line. Request prices and description icons are excluded.

Dynamic item expressions are reported in `unresolved`; the extractor does not execute NPC sequences or invent a result. The committed JSON is checked against native rewards and patterns in tests. Ordinary builds and previews reuse it without regeneration.
