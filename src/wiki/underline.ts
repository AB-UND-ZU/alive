import { characterImage } from "../components/Row/characters";

export const underlineImage = (color: string) =>
  `url("${characterImage([{ char: "_", color }])}")`;
