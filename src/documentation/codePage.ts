import glyphAliases from "./glyphAliases.json";

const extended =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»" +
  "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" +
  "αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u00a0";

const controls = "☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼";

export const codePage437 = Array.from({ length: 256 }, (_, code) => {
  // The DOS font stores the graphical controls at U+0100–U+011E.
  if (code === 0) return " ";
  if (code < 32)
    return glyphAliases[controls[code - 1] as keyof typeof glyphAliases];
  if (code === 127) return glyphAliases["⌂"];
  if (code >= 128) return extended[code - 128];
  return String.fromCharCode(code);
});
