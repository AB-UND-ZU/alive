# Trigger

Turns queued player or AI intent into spell, skill, tool, dialog, quick-item and chat actions.

The actor needs an available action, a new action-reference generation and control of its unit. An already consumed action is skipped. The initial menu phase is skipped too.

| Intent               | Destination                                |
| -------------------- | ------------------------------------------ |
| Spell / skill / tool | Create a cast or active condition          |
| Contextual target    | Start the matching interaction or popup    |
| Quick item           | Select or use the configured item          |
| Chat input           | Update chat or execute a test-mode command |

[Popup](popup.md) receives dialog input next. [Fishing](fishing.md), [Build](build.md), [Harvest](harvest.md) and [Magic](magic.md) advance the resulting actions.
