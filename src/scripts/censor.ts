if (localStorage.getItem("censorImages") == "true") censor();

function censor() {
  if (document.getElementById("censorStyle")) return;
  let customStyle = document.createElement("style");
  customStyle.innerHTML = `#image-container > * > img { filter: grayscale(1) blur(100px) !important; opacity: 0.5 !important; } #cover > * > img { filter: grayscale(1) blur(20px) !important; } .cover > img { filter: grayscale(1) blur(8px) !important; } .gallerythumb > img{ filter: grayscale(1) blur(30px) !important; pointer-events: none !important; }`;
  customStyle.id = "censorStyle";
  document.children[0].appendChild(customStyle);
}

var shouldCensor = true;

function tryAndCensor() {
  if (shouldCensor) {
    censor();
  } else if (shouldCensor == false) {
    document.getElementById("censorStyle")?.remove();
  }
  localStorage.setItem("censorImages", (shouldCensor ?? false).toString());
}

chrome.storage.sync.get("configuration", (res) => {
  shouldCensor = res["configuration"]?.["censorImages"] || false;
  tryAndCensor();
  chrome.storage.sync.onChanged.addListener((changes) => {
    if (changes["configuration"]?.newValue?.["censorImages"] == undefined)
      return;
    shouldCensor = changes["configuration"].newValue["censorImages"];
    tryAndCensor();
  });
});
