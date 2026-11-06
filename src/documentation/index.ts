import { createScene } from "./scenes";
import { Orientation } from "../engine/components/orientable";
import { muteAudio } from "../game/sound/resumable";

muteAudio();
for (const container of Array.from(
  document.querySelectorAll<HTMLElement>("[data-scene]")
)) {
  const id = container.dataset.scene!;
  let scene = createScene(id);
  let timer: ReturnType<typeof setInterval> | undefined;
  container.replaceChildren();
  const title = document.createElement("h3");
  title.textContent = scene.title;
  const hint = document.createElement("p");
  hint.className = "scene-hint";
  hint.textContent = scene.hint;
  const screen = document.createElement("div");
  screen.className = "scene-screen";
  const controls = document.createElement("div");
  controls.className = "scene-controls";
  const button = (label: string, action: () => void) => {
    const element = document.createElement("button");
    element.type = "button";
    element.textContent = label;
    element.addEventListener("click", action);
    controls.append(element);
    return element;
  };
  const select = scene.options ? document.createElement("select") : undefined;
  if (select) {
    select.setAttribute("aria-label", scene.title);
    scene.options!.forEach((label, index) =>
      select.add(new Option(label, String(index)))
    );
    select.addEventListener("change", () => {
      pause();
      scene.select!(select.selectedIndex);
      render();
    });
  }
  const render = () => {
    screen.replaceChildren();
    scene.render(screen);
    if (select) select.selectedIndex = Number(screen.dataset.index);
  };
  const pause = () => {
    clearInterval(timer);
    timer = undefined;
    auto.textContent = "Auto";
    auto.setAttribute("aria-pressed", "false");
  };
  button("Play", () => {
    pause();
    scene.play();
    render();
  });
  const auto = button("Auto", () => {
    if (timer) {
      pause();
      return;
    }
    auto.textContent = "Pause";
    auto.setAttribute("aria-pressed", "true");
    timer = setInterval(() => {
      scene.play();
      render();
    }, 800);
  });
  auto.setAttribute("aria-pressed", "false");
  button("Reset", () => {
    pause();
    scene = createScene(id);
    render();
  });
  if (scene.move) {
    (
      [
        ["Left", "left"],
        ["Up", "up"],
        ["Down", "down"],
        ["Right", "right"],
      ] as [string, Orientation][]
    ).forEach(([label, direction]) => {
      button(label, () => {
        pause();
        scene.move!(direction);
        render();
      });
    });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) pause();
  }).observe(container);
  container.append(title, hint);
  if (select) container.append(select);
  container.append(screen, controls);
  render();
}
