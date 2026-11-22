import { capabilities as excalibur } from "../renderers/excalibur/capabilities";
import { capabilities as three } from "../renderers/three-js/capabilities";
import { capabilities as html } from "../renderers/html/capabilities";
import { capabilities as terminal } from "../renderers/terminal/capabilities";
import { GridTable } from "./GridTable";
import { ReferenceLink } from "./references";
import { Text } from "./visuals";
import { GamePreview } from "./GamePreview";

const clients = [
  {
    name: "Excalibur",
    page: "excalibur",
    renderer: "excalibur",
    capabilities: excalibur,
  },
  {
    name: "ThreeJS",
    page: "threejs",
    renderer: "three-js",
    capabilities: three,
  },
  { name: "HTML", page: "html", renderer: "html", capabilities: html },
  {
    name: "Terminal",
    page: "terminal",
    renderer: "terminal",
    capabilities: terminal,
  },
] as const;

export const rendererHeaders = () =>
  clients.map((client) => (
    <ReferenceLink key={client.page} name={client.page}>
      <Text>{client.name}</Text>
    </ReferenceLink>
  ));

export function RendererComparison({ base }: { base: string }) {
  const feature = (key: keyof typeof three) =>
    clients.map((client) => (client.capabilities[key] ? "Yes" : "No"));
  return (
    <GridTable
      headers={["Feature", ...rendererHeaders()]}
      rows={[
        [
          "Example",
          ...clients.map((client) => (
            <GamePreview
              key={client.renderer}
              name="comparison"
              renderer={client.renderer}
              base={base}
              testMode={false}
            />
          )),
        ],
        [
          "Runs in",
          "Browser",
          "Browser",
          "Browser",
          "Browser / Terminal / SSH",
        ],
        ["Display", "Canvas", "WebGL", "HTML / SVG", "ANSI"],
        ["Sprites", "Layered", "Layered", "Layered", "One character"],
        ["Palette", "16 colors", "16 colors", "16 colors", "16 colors"],
        ["Lighting", ...feature("lighting")],
        ["Shadows", ...feature("shadows")],
        ["Fog of war", "Yes", "Yes", "Yes", "Yes"],
        ["Unit health bars", ...feature("healthBars")],
        ["Item stack dots", ...feature("stackDots")],
        ["Smooth movement", ...feature("smoothMovement")],
        [
          "Controls",
          "Keyboard\nMouse\nTouch",
          "Keyboard\nMouse\nTouch",
          "Keyboard\nMouse\nTouch",
          "Keyboard",
        ],
      ]}
      compact
    />
  );
}
