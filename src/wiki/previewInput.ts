export const capturePreviewKey = (event: KeyboardEvent) => {
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "Tab",
      "PageUp",
      "PageDown",
      "Home",
      "End",
    ].includes(event.key)
  )
    event.preventDefault();
};
