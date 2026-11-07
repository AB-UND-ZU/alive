# Interface Diagram

A static grid of game sprites and labels. The Island spawn area comes from the preview world factory; bars, buttons, item icons and frame characters use game assets and UI helpers.

Controls and arrows use explicit character cells. Up arrows on row 4 point to controls on row 2. The lower arrows share the frame row and point to buttons two rows below, leaving one empty cell between arrow and button. The remaining frame stays visible.

The diagram scrolls horizontally on narrow screens. It has no running world, iframe or input handlers.
