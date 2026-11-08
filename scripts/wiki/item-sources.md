# Item Sources

The wiki reads normal item sources from balancing exports. NPC quest rewards live inside sequence closures, so this extractor reads their TypeScript syntax during a wiki build. It collects literal `deals[].item` rewards and `choices[]` items with their owning NPC and source line. Request prices and description icons are excluded.

Dynamic item expressions are reported in `unresolved`; the extractor does not execute NPC sequences or invent a result. Generated JSON is written only when its content changes, so the development watcher does not loop.
