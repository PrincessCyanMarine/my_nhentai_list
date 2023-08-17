const React = require("react");
const ReactDOM = require("react-dom/client");
const Popup = require("../components/Popup").default;

// require("../lib/live");

const root = ReactDOM.createRoot(document.getElementById("react-app"));
const render = () => {
  // console.log("Rendering React");
  root.render(<Popup />);
};

document.onvisibilitychange = () => {
  if (document.visibilityState === "visible") render();
  // location.reload();
};

render();
