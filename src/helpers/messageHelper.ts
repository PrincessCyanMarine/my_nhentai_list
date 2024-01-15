export type MessageTypes =
  | {
      type: "openTab";
      url: string;
      props?: chrome.tabs.CreateProperties;
    }
  | {
      type: "openTabOnGroup";
      props: chrome.tabs.CreateProperties;
    }
  | {
      type: "closeTab";
      tabId?: number;
    };

export const sendMessage = (msg: MessageTypes) =>
  chrome.runtime.sendMessage(msg);
