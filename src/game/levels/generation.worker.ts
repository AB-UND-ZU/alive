import { setGenerationTestMode } from "../../engine/utils";
import { setSaveSummaries, SaveSummary } from "../saves";
import { runGeneration, GenerationRequest } from "./generation";

globalThis.onmessage = ({
  data,
}: MessageEvent<{
  request: GenerationRequest;
  testMode: boolean;
  saves: SaveSummary[];
}>) => {
  setGenerationTestMode(data.testMode);
  setSaveSummaries(data.saves);
  runGeneration(data.request, (message) => globalThis.postMessage(message));
};
