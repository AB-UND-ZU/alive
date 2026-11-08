import { fireEvent, render, screen } from "@testing-library/react";
import { Damage } from "./Damage";
beforeEach(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
test("the calculator keeps fractional health through repeated hits", () => {
  render(<Damage />);
  const health = screen.getByRole("spinbutton", { name: "Defender HP" });
  expect(health).toHaveValue(30);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Weapon damage" }), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Attacker Power" }), {
    target: { value: "0" },
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Defender Armor" }), {
    target: { value: "3" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Hit" }));
  expect(health).toHaveValue(29.75);
  fireEvent.click(screen.getByRole("button", { name: "Hit" }));
  expect(health).toHaveValue(29.5);
});
test("damage tabs and adjacent buttons edit the attacker", () => {
  render(<Damage />);
  fireEvent.click(screen.getByRole("tab", { name: "magic" }));
  expect(screen.getByRole("tab", { name: "magic" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Increase Attacker Wisdom" })
  );
  expect(
    screen.getByRole("spinbutton", { name: "Attacker Wisdom" })
  ).toHaveValue(1);
});
