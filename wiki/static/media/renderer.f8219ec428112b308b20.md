# Renderer

Notifies React listeners when reference generations change and resets them on level changes.

| Helper              | Contract                                                                      |
| ------------------- | ----------------------------------------------------------------------------- |
| rerenderEntity      | Increment the entity's own generation                                         |
| getEntityGeneration | Include own, movement-reference, sequence-reference and equipment generations |

[Renderable](../components/renderable.md) is an invalidation counter, not a visual sprite. A visible mutation needs the appropriate generation update. [Render hooks](../../bindings/hooks.md) subscribe to these notifications; [Map](map.md) performs final registration cleanup after rendering notifications.
