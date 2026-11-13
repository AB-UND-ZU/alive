# Action activation rows

`getActionActivations` builds the six-cell sprite row beneath an equipped action.
Browser controls and the terminal renderer share the same ammo supply, mana,
harvesting condition and equipped-weapon display. Values above 99 use the
existing nine-plus sprites. `alignRight` selects which end keeps its padding.
