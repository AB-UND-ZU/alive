import "../../index.css";
import Controls from "../Controls";
import Dimensions from "../Dimensions";
import Stats from "../Stats";
import Terminal from "../Terminal";
import World from "../World";
import ClientPreview, {
  isClientPreview,
} from "../../renderers/interface/ClientPreview";
import "./index.css";

if (process.env.NODE_ENV !== "development") {
  // Catch synchronous errors
  window.onerror = function (message, source, lineno, colno, error) {
    alert(
      `Error: ${message}\nSource: ${source}\nLine: ${lineno}, Column: ${colno}\n${
        error ? `Details: ${error.stack}` : ""
      }`
    );
    return true; // Prevents the browser default error handling
  };

  // Catch unhandled promise rejections
  window.onunhandledrejection = function (event) {
    alert(`Unhandled Promise Rejection: ${event.reason}`);
    event.preventDefault(); // Optional, prevents the default logging to the console
  };
}

export default function App() {
  const preview = isClientPreview();
  return (
    <Dimensions className="App">
      <World persistent={!preview}>
        <Stats />
        <Terminal />
        <Controls />
        {preview && <ClientPreview />}
      </World>
    </Dimensions>
  );
}
