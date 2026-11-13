# Shadow Cache

Updates renderer shadow maps only when a visible shadow light or caster changes. A point light otherwise needs six scene passes for its cube map on every frame.

The signature tracks light position, shadow range and map size, plus caster position, scale and geometry. A change sets `shadowMap.needsUpdate`. Mounting disables automatic updates; unmounting restores them.
