exports.renderedColors = async (roots) => {
  const colors = new Set(
    roots
      .flatMap((root) => [
        root,
        ...root.querySelectorAll(".CellGlyph, svg rect"),
      ])
      .filter((node) => node.matches(".CellGlyph, svg rect"))
      .map(
        (node) =>
          getComputedStyle(node)[node.matches("rect") ? "fill" : "color"]
      )
  );
  const canvas = document.createElement("canvas"),
    context = canvas.getContext("2d");
  for (const image of roots.flatMap((root) => [
    ...[root, ...root.querySelectorAll("img")].filter((node) =>
      node.matches("img")
    ),
  ])) {
    await image.decode();
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4)
      if (data[i + 3])
        colors.add(`rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`);
  }
  return [...colors];
};
