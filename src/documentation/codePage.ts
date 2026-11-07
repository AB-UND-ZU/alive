const extended =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»" +
  "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" +
  "αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u00a0";

export const codePage437 = Array.from({ length: 256 }, (_, code) => {
  // The DOS font stores the graphical controls at U+0100–U+011E.
  if (code === 0) return " ";
  if (code < 32) return String.fromCharCode(0x100 + code - 1);
  if (code === 127) return "\u011f";
  if (code >= 128) return extended[code - 128];
  return String.fromCharCode(code);
});
