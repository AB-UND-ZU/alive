import { PassThrough } from "stream";
import { emitTerminalKeys } from "./cli";

it("recognizes a bare Escape promptly and preserves split arrow sequences", async () => {
  const stream = new PassThrough();
  const press = jest.fn();
  try {
    emitTerminalKeys(stream);
    stream.on("keypress", (_text, key) => press(key.name));
    stream.write("\x1b");
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(press.mock.calls).toEqual([["escape"]]);
    press.mockClear();
    stream.write("\x1b");
    await new Promise((resolve) => setTimeout(resolve, 10));
    stream.write("[A");
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(press.mock.calls).toEqual([["up"]]);
  } finally {
    stream.destroy();
  }
});
