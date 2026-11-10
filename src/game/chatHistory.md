# Chat History

Stores the keyboard-index arrays in localStorage under `alive.chatHistory`. Submitting a nonempty line adds the trimmed entry. Starting history navigation with Up reads storage again, so another game or a reloaded page can recall it.

Malformed values and unavailable storage fall back to the player's in-memory history. Clearing a speech bubble does not remove history. The key indices are validated against the current game keyboard before they are used.
