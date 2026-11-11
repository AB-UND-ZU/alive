# Fishing

Coordinates hook casting, bait attachment, reeling and escape on the participating entities' action generations.

| Component     | Role                                      |
| ------------- | ----------------------------------------- |
| Conditionable | Active hook/tool action                   |
| Baitable      | Caster, bait amount and caught target     |
| Hookable      | Hook attachment, reeling and escape state |

[Trigger](trigger.md) begins the action. [AI](ai.md) manages fish habitats and catch selection; [Fishable](../components/fishable.md) records habitat population. One already caught target is not replaced by a second catch.
