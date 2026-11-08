import {
  createStructureSpecimen,
  createStructureDevices,
} from "./StructureOverview";
test.each([false, true])(
  "native building factories expose exterior and interior views (fort=%s)",
  (fort) => {
    const specimen = createStructureSpecimen(fort);
    expect(specimen.fragments.length).toBeGreaterThan(10);
    expect(specimen.door?.LOCKABLE).toBeDefined();
    expect(specimen.outside).not.toEqual(specimen.inside);
    expect(specimen.fragments.some((entity) => entity.ATTACKABLE)).toBe(false);
  }
);

test("Portal and Lever retain native nonattackable interactions", () => {
  const { portal, lever } = createStructureDevices();
  expect(portal.WARPABLE).toBeDefined();
  expect(portal.POPUP?.tabs).toEqual(["warp"]);
  expect(lever.CLICKABLE).toEqual({ clicked: false, player: true });
  expect(lever.COLLIDABLE).toBeDefined();
  expect(portal.ATTACKABLE).toBeUndefined();
  expect(lever.ATTACKABLE).toBeUndefined();
});

test("wood and desert buildings retain their native locked door types", () => {
  const wood = createStructureSpecimen(false);
  const fort = createStructureSpecimen(true);
  expect(wood.door?.LOCKABLE).toMatchObject({
    type: "door",
    material: "wood",
    locked: true,
  });
  expect(fort.door?.LOCKABLE).toMatchObject({
    type: "port",
    material: "wood",
    locked: true,
  });
  expect(wood.outside).not.toEqual(fort.outside);
});
