import { act, render, screen } from "@testing-library/react";
import { PropsWithChildren } from "react";
// Initialize shared assets in the same order as the game entry point.
import "../engine";
import { GamePreview } from "./GamePreview";

jest.mock("./visuals", () => ({
  Pixels: () => null,
  Text: ({ children }: PropsWithChildren) => <>{children}</>,
  Choice: () => null,
}));

jest.mock("./SpriteCode", () => ({ SpriteCode: () => null }));

const originalIntersectionObserver = window.IntersectionObserver;
const originalResizeObserver = window.ResizeObserver;
let notify: IntersectionObserverCallback;
let observer: IntersectionObserver;

beforeEach(() => {
  jest.spyOn(document, "hidden", "get").mockReturnValue(false);
  window.IntersectionObserver = class implements IntersectionObserver {
    root = null;
    rootMargin = "0px";
    thresholds = [0.05];
    constructor(callback: IntersectionObserverCallback) {
      notify = callback;
      observer = this;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  jest.restoreAllMocks();
  window.IntersectionObserver = originalIntersectionObserver;
  window.ResizeObserver = originalResizeObserver;
});

const visibility = (...states: boolean[]) => {
  const target = screen.getByRole("region");
  const bounds = target.getBoundingClientRect();
  act(() => {
    notify(
      states.map((isIntersecting, time) => ({
        target,
        time,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: bounds,
        intersectionRect: bounds,
        rootBounds: null,
      })),
      observer
    );
  });
};

const setup = (ready = true) => {
  render(<GamePreview name="movement" base="/" />);
  visibility(true);
  const iframe = screen.getByTitle("Movement") as HTMLIFrameElement;
  const messages = jest.spyOn(iframe.contentWindow!, "postMessage");
  const notifyReady = () =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: window.location.origin,
          source: iframe.contentWindow,
          data: { type: "preview-ready" },
        })
      );
    });
  if (ready) notifyReady();
  messages.mockClear();
  return { messages, notifyReady };
};

it.each([
  [[false, true], "view"],
  [[true, false], "pause"],
] as const)("uses the final visibility state in %j", (states, type) => {
  const { messages } = setup();
  visibility(...states);
  expect(messages).toHaveBeenLastCalledWith({ type }, window.location.origin);
});

it("resumes a frame that becomes ready after a hidden-to-visible batch", () => {
  const { messages, notifyReady } = setup(false);
  visibility(false, true);
  notifyReady();
  expect(messages).toHaveBeenLastCalledWith(
    { type: "view" },
    window.location.origin
  );
});

it("does not load a preview when a visibility batch ends offscreen", () => {
  render(<GamePreview name="movement" base="/" />);
  visibility(true, false);
  expect(screen.queryByTitle("Movement")).not.toBeInTheDocument();
});

it("keeps a hidden page paused and resumes when the page becomes visible", () => {
  const { messages } = setup();
  const hidden = jest.spyOn(document, "hidden", "get");
  hidden.mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  visibility(false, true);
  expect(messages).toHaveBeenLastCalledWith(
    { type: "pause" },
    window.location.origin
  );
  hidden.mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(messages).toHaveBeenLastCalledWith(
    { type: "view" },
    window.location.origin
  );
});

it("uses the native client variant and reloads readiness when the renderer changes", () => {
  const { rerender } = render(
    <GamePreview name="clients" renderer="terminal" base="/alive/wiki/" />
  );
  const target = screen.getByRole("region", { name: "Renderer" });
  const bounds = target.getBoundingClientRect();
  act(() =>
    notify(
      [
        {
          target,
          time: 0,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: bounds,
          intersectionRect: bounds,
          rootBounds: null,
        },
      ],
      observer
    )
  );
  const iframe = screen.getByTitle("Renderer") as HTMLIFrameElement;
  expect(iframe.src).toBe("http://localhost/alive/terminal/?preview&test");
  expect(iframe).toHaveStyle({ height: "480px" });
  rerender(<GamePreview name="clients" renderer="html" base="/alive/wiki/" />);
  expect(screen.getByTitle("Renderer")).not.toBe(iframe);
  expect(screen.getByTitle("Renderer").getAttribute("src")).toContain(
    "/alive/html/?preview&test"
  );
  expect(screen.getByRole("status")).toBeInTheDocument();
});

it("loads feature scenes from the selected client bundle", () => {
  render(<GamePreview name="movement" renderer="html" base="/alive/wiki/" />);
  visibility(true);
  expect(screen.getByTitle("Movement")).toHaveAttribute(
    "src",
    "http://localhost/alive/html/preview.html?test#movement"
  );
});

it("does not enable test commands when the menu preview opts out", () => {
  render(
    <GamePreview
      name="clients"
      renderer="three-js"
      base="/alive/wiki/"
      testMode={false}
    />
  );
  visibility(true);
  expect(screen.getByTitle("Renderer")).toHaveAttribute(
    "src",
    "http://localhost/alive/?preview"
  );
});
