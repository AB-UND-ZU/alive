import { capabilities as three } from "../renderers/three-js/capabilities";
import { capabilities as html } from "../renderers/html/capabilities";
import { capabilities as terminal } from "../renderers/terminal/capabilities";
import { GridTable } from "./GridTable";
import { ReferenceLink } from "./references";
import { Text } from "./visuals";

const clients = [
  { name: "ThreeJS", page: "threejs", capabilities: three },
  { name: "HTML", page: "html", capabilities: html },
  { name: "Terminal", page: "terminal", capabilities: terminal },
];

export const rendererHeaders = () =>
  clients.map((client) => (
    <ReferenceLink key={client.page} name={client.page}>
      <Text>{client.name}</Text>
    </ReferenceLink>
  ));

export function RendererComparison() {
  const feature = (key: keyof typeof three) =>
    clients.map((client) => (client.capabilities[key] ? "Yes" : "No"));
  return (
    <GridTable
      headers={["Feature", ...rendererHeaders()]}
      rows={[
        ["Runs in", "Browser", "Browser", "Browser / Terminal / SSH"],
        ["Display", "WebGL", "HTML / SVG", "ANSI"],
        ["Sprites", "Layered", "Layered", "One character"],
        ["Palette", "16 colors", "16 colors", "16 colors"],
        ["Lighting", ...feature("lighting")],
        ["Shadows", ...feature("shadows")],
        ["Fog of war", "Yes", "Yes", "Yes"],
        ["Unit health bars", ...feature("healthBars")],
        ["Item stack dots", ...feature("stackDots")],
        ["Smooth movement", ...feature("smoothMovement")],
        [
          "Controls",
          "Keyboard\nMouse\nTouch",
          "Keyboard\nMouse\nTouch",
          "Keyboard",
        ],
      ]}
      compact
    />
  );
}
