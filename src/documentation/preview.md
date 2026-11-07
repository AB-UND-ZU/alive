# Game Frame

`preview.tsx` mounts the real Dimensions, World, Stats, Terminal and Controls. Feature scenes use `createInitialWorld`, a stationary viewpoint that yields to dialog viewpoints. The full Play page uses the ordinary game lifecycle.

The frame URL uses `?test#scene/option`. Autoplay performs one short sequence of normal keyboard events, then idles until Reset. Losing focus resumes any remaining actions. Focus stops autoplay and enables manual input. Blur resumes autoplay while the snippet is visible. Offscreen and hidden states release held keys and pause simulation. Escape closes an open dialog; otherwise it returns focus to the page. All game frames capture navigation-key defaults so arrows, Space and paging keys cannot scroll the documentation. Feature scenes keep Escape for closing dialogs and releasing focus.

Feature scenes skip save storage. Audio is muted. Frames report hero position and health for interactive tools.
