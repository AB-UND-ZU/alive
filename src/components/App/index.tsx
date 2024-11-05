import Controls from "../Controls";
import Dimensions from "../Dimensions";
import Stats from "../Stats";
import Terminal from "../Terminal";
import World from "../World";
import "./index.css";

// Catch synchronous errors
window.onerror = function(message, source, lineno, colno, error) {
  alert(`Error: ${message}\nSource: ${source}\nLine: ${lineno}, Column: ${colno}\n${error ? `Details: ${error.stack}` : ''}`);
  return true; // Prevents the browser default error handling
};

// Catch unhandled promise rejections
window.onunhandledrejection = function(event) {
  alert(`Unhandled Promise Rejection: ${event.reason}`);
  event.preventDefault(); // Optional, prevents the default logging to the console
};

export default function App() {
  return (
    <Dimensions className="App">
      <World>
        <Stats />
        <Terminal />
        <Controls />
      </World>
    </Dimensions>
  );
}
