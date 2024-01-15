import { MessageTypes } from "../helpers/messageHelper";

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

const getCurrentTab = async () =>
  (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

async function createTabOnGroup(props: chrome.tabs.CreateProperties) {
  let currentTab = await getCurrentTab();
  if (!props.index && props.index != 0) props.index = currentTab.index + 1;
  console.log(props);
  let newTab = await chrome.tabs.create(props);

  // do {
  //   newTab = await chrome.tabs.get(newTab.id!);
  //   if (newTab.status == "complete") break;
  //   await wait(100);
  // } while (newTab.status != "complete");

  if (currentTab?.groupId >= 0) {
    await chrome.tabs.group({
      tabIds: newTab.id,
      groupId: currentTab.groupId,
    });
  } else {
    let groupId = await chrome.tabs.group({
      tabIds: [newTab.id!, currentTab?.id!],
    });
    await chrome.tabGroups.update(groupId, {
      title: `${currentTab.title}`,
    });
  }
}
chrome.contextMenus.onClicked.addListener(genericOnClick);

function genericOnClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab | undefined
) {
  if (info.menuItemId == "openOnNhentai") {
    let text = info.selectionText?.trim();
    if (text && text.length > 0 && !isNaN(Number(text))) {
      createTabOnGroup({ url: `https://nhentai.net/g/${text}` });
    }
  }
}
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    title: "Open on nhentai",
    contexts: ["selection"],
    id: "openOnNhentai",
  });
});

chrome.runtime.onMessage.addListener(
  async (msg: MessageTypes, sender, send) => {
    switch (msg.type) {
      case "openTab":
        msg.props = {
          url: msg.url,
        };
      case "openTabOnGroup":
        createTabOnGroup(msg.props!);
        break;
      case "closeTab":
        if (!msg.tabId && msg.tabId != 0)
          msg.tabId = (await getCurrentTab())?.id;
        if (msg.tabId) chrome.tabs.remove(msg.tabId);
        break;
    }
  }
);
