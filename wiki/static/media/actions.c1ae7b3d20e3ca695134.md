# Action activation rows

`getActionActivations` builds the six-cell sprite row beneath an equipped action.
Browser controls and the terminal renderer share the same ammo supply, mana,
harvesting condition and equipped-weapon display. Values above 99 use the
existing nine-plus sprites. `alignRight` selects which end keeps its padding.

`getActionName` supplies the same action label to both clients, including Mine, Dig, Build and Catch, and the equipped weapon name while a tool is active.
