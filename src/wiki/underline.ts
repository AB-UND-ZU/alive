import { characterMarkup } from "../components/Row/characters";

export const underlineImage = (color: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 16" shape-rendering="crispEdges">${characterMarkup(
      [{ char: "_", color }]
    )}</svg>`
  )}")`;
