# Touch Controls

Only the Touch preview installs the desktop mouse adapter. Press, drag and release dispatch touch events through the stable window to the native Controls handlers. Real touch devices use their own events and receive no extra listeners or cursor.

Release, leaving the iframe, losing focus or hiding the document cancels movement. An original target may disappear while dragging; Touch.target still identifies it, while dispatching through window ensures the native release handler runs. Returning with a held mouse does not restart a gesture.

The idle desktop cursor uses the actual stacked Joystick center sprite. While the native Joystick is visible, that cursor hides and the game's origin and direction arrows remain. The desktop reference uses the same native angle-to-directions helpers as Controls and points toward the cursor. On native touch devices it shows all four directions.
