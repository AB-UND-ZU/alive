import { parentPort, workerData } from "worker_threads";
import { runGeneration } from "../../game/levels/generation";
import { setSaveSummaries } from "../../game/saves";
import { setGenerationTestMode } from "../../engine/utils";

setGenerationTestMode(workerData.testMode);
setSaveSummaries(workerData.saves);
runGeneration(workerData.request, (message) =>
  parentPort!.postMessage(message)
);
