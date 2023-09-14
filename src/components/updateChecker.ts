import { ElementBuilder } from "../helpers/ElementBuilder";
import "../sass/updateChecker.scss";

function _isRemoteNewer(remote: string, local: string) {
  let _a = remote.split(".");
  let _b = local.split(".");
  for (let i = 0; i < _a.length; i++) {
    let a = parseInt(_a[i]) || 0;
    let b = parseInt(_b[i]) || 0;
    if (a > b) return true;
    if (b > a) return false;
  }
  return false;
}

export default function compareVersions(autoAdd = true) {
  return new Promise<Element | null>(async (resolve, reject) => {
    try {
      let local = chrome.runtime.getManifest().version || "0";
      let remote =
        (
          await (
            await fetch(
              "https://api.github.com/repos/PrincessCyanMarine/my_nhentai_list/tags"
            )
          ).json()
        )[0].name.replace("v", "") || "0";
      let ignored = (await chrome.storage.sync.get("ignoreUpdate"))[
        "ignoreUpdate"
      ];
      // console.log("Ignored version:", ignored);
      // console.log("Local version:", local);
      // console.log("Remote version:", remote);

      if (ignored && remote <= ignored) return resolve(null);
      if (_isRemoteNewer(remote, local)) {
        const _close = () => {
          let alerts = document.getElementsByClassName(
            "new-mnl-update-available"
          );
          for (let i = 0; i < alerts.length; i++) alerts[i].remove();
        };

        const _ignore = () => {
          chrome.storage.sync.set({ ignoreUpdate: remote });
          _close();
        };

        let res = new ElementBuilder("div")
          .addClass("new-mnl-update-available")
          .appendChildren(
            new ElementBuilder("p").addText("New version available").build(),
            new ElementBuilder("div")
              .addClass("mnl-update-versions")
              .appendChildren(
                new ElementBuilder("span").addText(`Current: ${local}`).build(),
                new ElementBuilder("span").addText(`Latest: ${remote}`).build()
              )
              .build(),
            new ElementBuilder("div")
              .addClass("mnl-update-buttons")
              .appendChildren(
                new ElementBuilder("a")
                  .addHtml("<p>Download</p>")
                  .setAttribute(
                    "href",
                    "https://github.com/PrincessCyanMarine/my_nhentai_list/releases/latest"
                  )
                  .setAttribute("target", "_blank")
                  .build(),
                new ElementBuilder("a")

                  .addHtml("<p>Close</p>")
                  .addEventListener("click", _close)
                  .build(),
                new ElementBuilder("a")

                  .addHtml("<p>Ignore update</p>")
                  .addEventListener("click", _ignore)
                  .build()
              )
              .build()
          )
          .build();
        if (autoAdd) document.body.appendChild(res);
        resolve(res);
      } else resolve(null);
    } catch (err) {
      reject(err);
    }
  });
}
