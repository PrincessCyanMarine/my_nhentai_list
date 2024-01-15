import { sendMessage } from "./messageHelper";

export async function createTabOnGroup(
  props: chrome.tabs.CreateProperties | string | undefined,
  _originalTab?: any
) {
  if (!props) return;
  if (typeof props === "string") props = { url: props };
  sendMessage({
    type: "openTabOnGroup",
    props,
  });
}
