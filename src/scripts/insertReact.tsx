import React from "react";
import ReactDOM from "react-dom";
import Popup from "../pages/Popup";

if (process.env.NODE_ENV === "development") require("../lib/live");

// @ts-ignore
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
