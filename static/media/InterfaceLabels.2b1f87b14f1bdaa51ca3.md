# Interface Labels

Annotates the noninteractive native Interface scene inside `Terminal`. Arrows, labels and quick-action buttons use game sprites and the terminal's cell dimensions. Stat icons and colors come from `getStatSprite` and `getStatColor`. HP, MP and XP occupy separate rows. The full yellow quick-action list matches the native Use menu; no hotkey list is drawn.

Bottom captions identify Skill, Spell and Gear on the same rows. The native preview equips Compass so its gear display is visible. Positions leave the centered hero visible. The fixed 32-column viewport keeps labels on the same cells on smaller screens; its surrounding scroller exposes the full diagram. Pointer events are disabled.
