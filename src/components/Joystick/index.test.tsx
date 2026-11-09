/* eslint-disable testing-library/no-node-access, testing-library/no-container -- arrows are drawn as glyph spans without accessible roles */
import { render } from "@testing-library/react";
import Joystick from ".";
import { Orientation } from "../../engine/components/orientable";
import { colors } from "../../game/assets/colors";
import { readCell, showsLayers } from "../Controls/testing";

const arrows: Record<Orientation, string> = {
  up: "ė",
  right: "ę",
  down: "Ę",
  left: "Ě",
};

const getArrow = (container: HTMLElement, orientation: Orientation) =>
  Array.from(container.querySelectorAll(".Cell")).find(
    (cell) => readCell(cell) === arrows[orientation]
  );

describe("joystick", () => {
  it("highlights the main direction and dims the secondary one", () => {
    const { container } = render(
      <Joystick orientations={["right", "down"]} origin={[100, 100]} />
    );

    expect(
      showsLayers(getArrow(container, "right")!, [
        { char: arrows.right, color: colors.white },
      ])
    ).toBe(true);
    expect(
      showsLayers(getArrow(container, "down")!, [
        { char: arrows.down, color: colors.grey },
      ])
    ).toBe(true);
    expect(getArrow(container, "up")).toBeUndefined();
    expect(getArrow(container, "left")).toBeUndefined();
  });

  it.each(["up", "right", "down", "left"] as const)(
    "shows the %s arrow",
    (orientation) => {
      const { container } = render(
        <Joystick orientations={[orientation]} origin={[100, 100]} />
      );

      expect(getArrow(container, orientation)).toBeDefined();
    }
  );

  it("is placed around the touch origin", () => {
    const { container } = render(
      <Joystick orientations={["up"]} origin={[100, 200]} />
    );
    const joystick = container.querySelector(".Joystick") as HTMLElement;

    expect(parseFloat(joystick.style.left)).toBeLessThan(100);
    expect(parseFloat(joystick.style.top)).toBeLessThan(200);
  });

  it("is hidden without a touch or direction", () => {
    const { container: withoutOrigin } = render(
      <Joystick orientations={["up"]} />
    );
    const { container: withoutDirection } = render(
      <Joystick orientations={[]} origin={[100, 100]} />
    );

    expect(withoutOrigin).toBeEmptyDOMElement();
    expect(withoutDirection).toBeEmptyDOMElement();
  });
});
