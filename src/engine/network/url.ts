export const serverUrl = (value: string) => {
  const url = new URL(value.includes("://") ? value : `ws://${value}`);
  if (
    !["http:", "https:", "ws:", "wss:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash ||
    url.search
  )
    throw new Error("Enter a WebSocket host URL");
  url.protocol = ["https:", "wss:"].includes(url.protocol) ? "wss:" : "ws:";
  return url.href;
};
