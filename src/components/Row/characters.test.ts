import { characterMask, composeCharacterPixels } from "./characters";

describe("stacked character rendering", () => {
  it("fills a cell without seams and combines the two half blocks", () => {
    expect(characterMask("█").filter(Boolean)).toHaveLength(9 * 16);
    const pixels = composeCharacterPixels([
      { char: "▀", color: "#ff0000" },
      { char: "▄", color: "#00ff00" },
    ]);
    expect(pixels.every(Boolean)).toBe(true);
    expect(new Set(pixels)).toEqual(new Set(["#ff0000", "#00ff00"]));
  });
  it("preserves holes and applies later layers only to their covered pixels", () => {
    const pixels = composeCharacterPixels([
      { char: "█", color: "#008000" },
      { char: "A", color: "#ffffff" },
    ]);
    expect(pixels.filter((color) => color === "#ffffff")).toHaveLength(
      characterMask("A").filter(Boolean).length
    );
    expect(pixels).toContain("#008000");
  });
  it("puts stack dots on the shared pixel grid", () => {
    const pixels = composeCharacterPixels([], 6);
    expect(pixels[13 * 9]).toBe("#c0c0c0");
    expect(pixels[15 * 9]).toBe("#c0c0c0");
  });
});
