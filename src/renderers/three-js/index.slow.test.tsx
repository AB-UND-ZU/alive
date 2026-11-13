import { create } from "@react-three/test-renderer";
import ThreeJsRenderer from ".";
import { createWorld } from "../../engine";

jest.mock("@react-three/fiber", () => ({
  ...jest.requireActual("@react-three/fiber"),
  Canvas: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("./Camera", () => ({ __esModule: true, default: () => null }));
jest.mock("./Entity/Instances", () => ({ InstanceRoot: () => null }));
jest.mock("./Entity/ShadowCache", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("./Systems", () => ({
  __esModule: true,
  default: function SceneProbe() {
    const { useWorld } = require("../interface/hooks");
    const { useDimensions } = require("../../components/Dimensions");
    const context = useWorld();
    const dimensions = useDimensions();
    return <group userData={{ context, dimensions }} />;
  },
}));

it("supplies the requested world and viewport to the Three.js scene without an outer provider", async () => {
  const world = createWorld();
  const renderer = await create(
    <ThreeJsRenderer
      world={world}
      columns={17}
      rows={13}
      cellWidth={18}
      cellHeight={32}
      paused
    />
  );
  const { context, dimensions } = renderer.scene.findAll(
    (node) => !!node.instance.userData?.context
  )[0].instance.userData;

  expect(context.ecs).toBe(world);
  expect(context.paused).toBe(true);
  expect(dimensions).toMatchObject({
    renderedColumns: 17,
    renderedRows: 13,
    cellWidth: 18,
    cellHeight: 32,
    aspectRatio: 9 / 16,
    pixelSize: 2,
  });
  await renderer.unmount();
});
