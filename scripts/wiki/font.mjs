import { deflateSync, inflateSync } from "node:zlib";

export function fontTables(woff) {
  return Array.from({ length: woff.readUInt16BE(12) }, (_, index) => {
    const offset = 44 + index * 20;
    const start = woff.readUInt32BE(offset + 4);
    const length = woff.readUInt32BE(offset + 8);
    const original = woff.readUInt32BE(offset + 12);
    const data = woff.subarray(start, start + length);
    return {
      tag: woff.toString("ascii", offset, offset + 4),
      data: length < original ? inflateSync(data) : data,
    };
  });
}
export function fontCharacters(cmap) {
  let offset;
  for (let index = 0; index < cmap.readUInt16BE(2); index++) {
    const candidate = cmap.readUInt32BE(8 + index * 8);
    if (cmap.readUInt16BE(candidate) === 12) {
      const characters = new Map();
      for (let group = 0; group < cmap.readUInt32BE(candidate + 12); group++) {
        const at = candidate + 16 + group * 12;
        for (
          let code = cmap.readUInt32BE(at);
          code <= cmap.readUInt32BE(at + 4);
          code++
        )
          characters.set(
            code,
            cmap.readUInt32BE(at + 8) + code - cmap.readUInt32BE(at)
          );
      }
      return characters;
    }
    if (cmap.readUInt16BE(candidate) === 4) offset = candidate;
  }
  if (offset === undefined)
    throw Error("The DOS font has no Unicode character table");
  const characters = new Map();
  const count = cmap.readUInt16BE(offset + 6) / 2;
  for (let index = 0; index < count; index++) {
    const end = cmap.readUInt16BE(offset + 14 + index * 2);
    const start = cmap.readUInt16BE(offset + 16 + count * 2 + index * 2);
    const delta = cmap.readInt16BE(offset + 16 + count * 4 + index * 2);
    const pointer = offset + 16 + count * 6 + index * 2;
    const range = cmap.readUInt16BE(pointer);
    for (let code = start; code <= end && code < 0xffff; code++) {
      let glyph = range
        ? cmap.readUInt16BE(pointer + range + (code - start) * 2)
        : (code + delta) & 0xffff;
      if (range && glyph) glyph = (glyph + delta) & 0xffff;
      if (glyph) characters.set(code, glyph);
    }
  }
  return characters;
}
const checksum = (data) => {
  const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4);
  data.copy(padded);
  let sum = 0;
  for (let offset = 0; offset < padded.length; offset += 4)
    sum = (sum + padded.readUInt32BE(offset)) >>> 0;
  return sum;
};
export function aliasFont(woff, aliases) {
  const tables = fontTables(woff);
  const cmap = tables.find((table) => table.tag === "cmap");
  const characters = fontCharacters(cmap.data);
  for (const [alias, original] of Object.entries(aliases)) {
    if ([...original].length !== 1) continue;
    const glyph = characters.get(original.codePointAt(0));
    if (!glyph) throw Error(`Missing native font glyph for ${alias}`);
    characters.set(alias.codePointAt(0), glyph);
  }
  const entries = [...characters].sort(([left], [right]) => left - right);
  const data = Buffer.alloc(28 + entries.length * 12);
  data.writeUInt16BE(1, 2);
  data.writeUInt16BE(3, 4);
  data.writeUInt16BE(10, 6);
  data.writeUInt32BE(12, 8);
  data.writeUInt16BE(12, 12);
  data.writeUInt32BE(data.length - 12, 16);
  data.writeUInt32BE(entries.length, 24);
  entries.forEach(([code, glyph], index) => {
    const offset = 28 + index * 12;
    data.writeUInt32BE(code, offset);
    data.writeUInt32BE(code, offset + 4);
    data.writeUInt32BE(glyph, offset + 8);
  });
  cmap.data = data;
  const header = Buffer.from(woff.subarray(0, 44));
  header.writeUInt32BE(0, 24);
  header.writeUInt32BE(0, 28);
  header.writeUInt32BE(0, 32);
  header.writeUInt32BE(0, 36);
  header.writeUInt32BE(0, 40);
  const directory = Buffer.alloc(tables.length * 20);
  const chunks = [header, directory];
  let offset = header.length + directory.length;
  tables.forEach((table, index) => {
    const compressed = deflateSync(table.data);
    const stored =
      compressed.length < table.data.length ? compressed : table.data;
    const at = index * 20;
    directory.write(table.tag, at, "ascii");
    directory.writeUInt32BE(offset, at + 4);
    directory.writeUInt32BE(stored.length, at + 8);
    directory.writeUInt32BE(table.data.length, at + 12);
    directory.writeUInt32BE(checksum(table.data), at + 16);
    const padding = Buffer.alloc((4 - (stored.length % 4)) % 4);
    chunks.push(stored, padding);
    offset += stored.length + padding.length;
  });
  header.writeUInt32BE(offset, 8);
  header.writeUInt32BE(
    12 +
      tables.length * 16 +
      tables.reduce(
        (sum, table) => sum + Math.ceil(table.data.length / 4) * 4,
        0
      ),
    16
  );
  return Buffer.concat(chunks);
}
