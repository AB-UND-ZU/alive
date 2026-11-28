import packageJson from "../../../package.json";

// encode package version as V<major>x<minor>[.<patch>], e.g. 0.2.0 -> V0x02
export const formatGameVersion = (version: string) => {
  const [major = 0, minor = 0, patch = 0] = version
    .split(".")
    .map((part) => parseInt(part, 10) || 0);
  return `V${major}x${minor.toString(16).toUpperCase().padStart(2, "0")}${patch ? `.${patch}` : ""}`;
};

export const gameVersion = formatGameVersion(packageJson.version);
