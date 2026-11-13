import packageJson from "../../../package.json";

// encode package version as V<major>x<minor>[.<patch>], e.g. 0.2.0 -> V0x02
const [major = 0, minor = 0, patch = 0] = packageJson.version
  .split(".")
  .map((part) => parseInt(part, 10) || 0);
export const gameVersion = `V${major}x${minor.toString().padStart(2, "0")}${
  patch ? `.${patch}` : ""
}`;
