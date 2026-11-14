import Systems from "../Systems";
import { InstanceRoot } from "./Instances";
import { DimensionsContext } from "../../../components/Dimensions/sizing";
import { createAreaWorld, assertHero, advance } from "../../../testing/harness";
import { renderScene } from "../../../testing/render";
import { createSign } from "../../../bindings/creation";
import { registerEntity } from "../../../engine/systems/map";
import { openPopup, setVerticalIndex } from "../../../engine/systems/popup";
import { frameWidth } from "../../../game/assets/utils";
import { createText } from "../../../game/assets/ui";

jest.mock("@react-three/drei/core/useFont", () => {
  const { Font } = require("three-stdlib");
  const font = new Font(
    require("../../../../public/fonts/MostPerfectDOSVGA.json")
  );
  return { useFont: () => font };
});

it.each([
  { instant: false, elapsed: 1000 },
  { instant: false, elapsed: 3000 },
  { instant: true, elapsed: 3000 },
])(
  "erases the final columns and blank rows when scrolling a sign (%j)",
  async ({ instant, elapsed }) => {
    const world = createAreaWorld("|       |\n| ♀     |\n|       |", {
      size: 48,
    });
    const hero = assertHero(world);
    const width = frameWidth - 2;
    const popup = createSign(world, { x: 3, y: 1 }, [
      [
        createText("Z".repeat(width)),
        [],
        createText("Short"),
        createText("Y".repeat(width)),
        [],
        ...Array.from({ length: 12 }, () => createText("Next")),
      ],
    ]);
    registerEntity(world, popup);
    openPopup(world, hero, popup, instant);
    advance(world, elapsed);
    const { renderer, advanceFrames } = await renderScene(
      world,
      <DimensionsContext.Provider value={world.metadata.dimensions}>
        <InstanceRoot />
        <Systems />
      </DimensionsContext.Provider>
    );
    try {
      await advanceFrames(3);
      const count = (char: string) => {
        let total = 0;
        renderer.scene.instance.traverse((object) => {
          if (object.userData.char === char) total += 1;
        });
        return total;
      };
      expect(count("Z")).toBe(width);
      setVerticalIndex(world, popup, 1);
      await advanceFrames(3);
      expect(count("Z")).toBe(0);
      setVerticalIndex(world, popup, 0);
      await advanceFrames(3);
      expect(count("Z")).toBe(width);
      expect(count("Y")).toBe(width);
      setVerticalIndex(world, popup, 4);
      await advanceFrames(3);
      expect(count("Z")).toBe(0);
      expect(count("Y")).toBe(0);
    } finally {
      await renderer.unmount();
    }
  }
);
