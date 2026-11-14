import { act, fireEvent, render, screen } from "@testing-library/react";
import "../engine";
import { ServerPreview } from "./ServerPreview";

jest.mock("./visuals", () => ({
  Pixels: () => null,
  Choice: () => null,
  Text: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Input: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  Button: ({
    children,
    onClick,
    type = "button",
  }: React.PropsWithChildren<{
    onClick?: () => void;
    type?: "button" | "submit";
  }>) => (
    <button type={type} onClick={onClick}>
      {children}
    </button>
  ),
}));
const connect = () => {
  render(<ServerPreview base="/alive/wiki/" />);
  fireEvent.change(screen.getByRole("textbox", { name: "Server URL" }), {
    target: { value: "localhost:3001" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Connect" }));
};
const status = (
  client: number,
  state: string,
  origin = window.location.origin
) => {
  const frame = screen.getByTitle(`Player ${client} game`) as HTMLIFrameElement;
  fireEvent(
    window,
    new MessageEvent("message", {
      origin,
      source: frame.contentWindow,
      data: { type: "server-status", status: state },
    })
  );
};
const originalIntersectionObserver = window.IntersectionObserver;
const originalResizeObserver = window.ResizeObserver;
beforeEach(() => {
  jest.useFakeTimers();
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(() => {
  jest.useRealTimers();
  window.IntersectionObserver = originalIntersectionObserver;
  window.ResizeObserver = originalResizeObserver;
});
it("connects two distinct client slots to the same normalized server", () => {
  connect();
  for (const client of [1, 2]) {
    const frame = screen.getByTitle(`Player ${client} game`);
    expect(frame).toHaveAttribute(
      "src",
      `/alive/wiki/preview.html?server=ws%3A%2F%2Flocalhost%3A3001%2F&client=${client}#servers`
    );
    status(client, "connected");
  }
  act(() => jest.advanceTimersByTime(20000));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it.each(["rejected", "reconnecting"])(
  "reports a failed initial connection on %s and permits a retry",
  (failed) => {
    connect();
    status(1, failed, "https://untrusted.example");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    status(1, "connected");
    status(2, failed);
    expect(screen.getByRole("alert")).toHaveTextContent("Connection failed");
    expect(screen.queryByTitle("Player 1 game")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(screen.getByTitle("Player 2 game")).toBeInTheDocument();
  }
);
it("times out if either game cannot finish connecting", () => {
  connect();
  status(1, "connected");
  act(() => jest.advanceTimersByTime(15000));
  expect(screen.getByRole("alert")).toHaveTextContent("Connection failed");
});
it("allows an established client to reconnect without discarding either view", () => {
  connect();
  status(1, "connected");
  status(2, "connected");
  status(1, "reconnecting");
  act(() => jest.advanceTimersByTime(1000));
  status(1, "connected");
  act(() => jest.advanceTimersByTime(20000));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("sends each username to its own game and retains it on retry", () => {
  render(<ServerPreview base="/" />);
  for (const [slot, name] of [
    [1, "Alice"],
    [2, "Bob"],
  ])
    fireEvent.change(
      screen.getByRole("textbox", { name: `Player ${slot} username` }),
      { target: { value: name } }
    );
  fireEvent.click(screen.getByRole("button", { name: "Connect" }));
  expect(screen.getByTitle("Player 1 game")).toHaveAttribute(
    "src",
    expect.stringContaining("username=Alice")
  );
  expect(screen.getByTitle("Player 2 game")).toHaveAttribute(
    "src",
    expect.stringContaining("username=Bob")
  );
  status(1, "rejected");
  fireEvent.click(screen.getByRole("button", { name: "Connect" }));
  expect(screen.getByTitle("Player 2 game")).toHaveAttribute(
    "src",
    expect.stringContaining("username=Bob")
  );
});
