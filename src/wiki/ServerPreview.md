# Server Preview

The Multiplayer page's `servers` scene connects two isolated game frames to one entered WebSocket URL. Each slot namespaces its reconnect credentials in localStorage, keeping both characters separate from normal play and from each other.

The parent accepts status messages only from its own frames on the same origin. Initial connection failures and rejected sessions close both frames and show an error. A missing ready state times out after fifteen seconds. Established connections may reconnect within the same deadline. Retrying remounts both frames and preserves their saved credentials.

The form uses native wiki Input, Button and Text sprites. The two games sit side by side on wide pages and stack on smaller screens.

Each player has a username input. Names are passed separately to the two frames on Connect; blank names use the native chat prompt. The server always prefers a saved name for returning credentials.
