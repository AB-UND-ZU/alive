import { fireEvent, render, screen } from "@testing-library/react";
import { CommandBuilder, CommandReference } from "./CommandBuilder";
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
test("Run executes a native stat command in the builder without a preview", () => {
  render(<CommandBuilder />);
  fireEvent.change(screen.getByRole("textbox", { name: "Command" }), {
    target: { value: "/stat hp 12" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run" }));
  expect(
    screen.getByRole("group", { name: "Command builder" })
  ).toHaveAttribute("data-hp", "12");
  expect(screen.queryByTitle("Chat")).not.toBeInTheDocument();
});
test("item search chooses a real command argument", () => {
  render(<CommandBuilder />);
  fireEvent.change(screen.getByRole("textbox", { name: "Search items" }), {
    target: { value: "pickaxe" },
  });
  fireEvent.click(screen.getByRole("option", { name: "pickaxe" }));
  expect(screen.getByRole("textbox", { name: "Command" })).toHaveValue(
    "/give pickaxe "
  );
});
