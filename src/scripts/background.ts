chrome.contextMenus.onClicked.addListener(genericOnClick);

function genericOnClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab | undefined
) {
  if (info.menuItemId == "openOnNhentai") {
    let text = info.selectionText?.trim();
    if (text && text.length > 0 && !isNaN(Number(text))) {
      chrome.tabs.create({
        url: `https://nhentai.net/g/${text}`,
      });
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
