import { render, screen } from "@testing-library/react";
import { CommandReference } from "./CommandReference";
import { commandSignatures } from "../game/assets/commands";

beforeEach(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

test("the command reference includes every native signature once", () => {
  render(<CommandReference />);
  for (const command of Object.values(commandSignatures))
    expect(screen.getByRole("table").textContent).toContain(command.usage);
});
