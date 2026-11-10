import { keyboardPages, keyboardSize } from "../components/Keyboard";

const storageKey = "alive.chatHistory";

export const loadChatHistory = (fallback: number[][]): number[][] => {
  try {
    const history: unknown = JSON.parse(
      localStorage.getItem(storageKey) || "null"
    );
    if (
      Array.isArray(history) &&
      history.every(
        (line) =>
          Array.isArray(line) &&
          line.every(
            (key) =>
              Number.isInteger(key) &&
              key >= 0 &&
              key < keyboardPages.length * keyboardSize
          )
      )
    )
      return history;
  } catch {}
  return fallback;
};

export const saveChatHistory = (history: number[][]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {}
};
