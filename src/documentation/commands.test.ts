import { completeCommand } from "./commands";

describe("command completion", () => {
  it("completes command names and item arguments", () => {
    expect(completeCommand("/gi")).toEqual(["/give"]);
    expect(completeCommand("/give sw")).toEqual(["/give sword"]);
    expect(completeCommand("/g sword 1 i")).toEqual(["/g sword 1 iron"]);
  });
  it("offers potion stats in the last argument instead of elements", () => {
    expect(completeCommand("/give potion 10 wood m")).toEqual([
      "/give potion 10 wood mp",
    ]);
    expect(completeCommand("/give sword 1 iron f")).toEqual([
      "/give sword 1 iron fire",
    ]);
  });
  it("uses valid cast, cell, and mod values", () => {
    expect(completeCommand("/cast z")).toEqual([]);
    expect(completeCommand("/new water_d")).toContain("/new water_deep");
    expect(completeCommand("/mod re")).toEqual(["/mod reset"]);
    expect(completeCommand("/cast wave wood fire extra")).toEqual([]);
  });
});
