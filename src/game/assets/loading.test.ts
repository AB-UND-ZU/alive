import { mapDiscovery, soundNotes } from "./sprites/particles";
import { soundsLoading, worldLoading } from "./loading";
import { colors } from "./colors";

const text = (line: ReturnType<typeof worldLoading>) =>
  line.slice(1, -1).map((sprite) => sprite.layers.slice(-1)[0].char).join("");

it("shows the sound count at its natural length with the green notes sprite", () => {
  const line = soundsLoading(9, 785);
  expect(text(line)).toBe("Loading č9/785...");
  expect(text(soundsLoading(100, 785))).toBe("Loading č100/785...");
  expect(line[9].name).toBe(soundNotes.name);
  expect(line[9].layers).toEqual([
    { char: "█", color: colors.white },
    { char: "č", color: colors.green },
  ]);
});

it("shows the destination at its natural length with the warp sprite", () => {
  const menu = worldLoading("Menu");
  expect(text(menu).slice(9)).toBe("Menu...");
  expect(text(worldLoading("Dungeon")).slice(9)).toBe("Dungeon...");
  expect(menu[9].name).toBe(mapDiscovery.name);
  expect(menu[9].layers).toContainEqual({
    char: "-",
    color: menu[1].layers[0].color,
  });
});
