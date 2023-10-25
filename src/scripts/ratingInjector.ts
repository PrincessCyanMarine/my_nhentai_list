import "../sass/injector.scss";
import { HentaiInfo, Tag } from "../models/HentaiInfo";
import { ElementBuilder } from "../helpers/ElementBuilder";
import compareVersions from "../components/updateChecker";
import { MyNHentaiListConfiguration } from "../pages/ConfigPage";

function getId() {
  let id: number;
  {
    let _id = window.location.pathname.match(/g\/([0-9]+)/)?.[1];
    if (!_id) return;
    id = parseInt(_id);
  }
  if (!id || isNaN(id)) return undefined;
  return id;
}

// console.log("gallery");
// @ts-ignore
// console.log("gallery", window.gallery);
let attempts = 0;
function inject() {
  let id = getId()!;
  if (!id) return;
  let info = document.getElementById("info");
  if (!info) {
    attempts++;
    let timer = 100 + Math.floor(attempts / 5) * 1000;
    setTimeout(inject, timer);
    return;
  }
  // console.log(id);
  compareVersions();

  chrome.storage.local.get("list", (data) => {
    if (!data) data = {};
    if (!data["list"]) data["list"] = {};
    let rating = data["list"][id] ?? -1;
    let label = document.createElement("label");
    let input = document.createElement("input");
    label.className = "btn btn-secondary rating_label";
    // label.innerHTML = '<i class="fa fa-star"></i>';
    let span = document.createElement("span");

    let leftArrow2 = document.createElement("span");
    let leftArrow = document.createElement("span");
    let rightArrow = document.createElement("span");
    let rightArrow2 = document.createElement("span");
    leftArrow2.className = "rating_arrow";
    leftArrow.className = "rating_arrow";
    rightArrow.className = "rating_arrow";
    rightArrow2.className = "rating_arrow";

    leftArrow2.innerHTML = "❮❮";
    leftArrow.innerHTML = "❮";
    rightArrow.innerHTML = "❯";
    rightArrow2.innerHTML = "❯❯";

    let save = (rating: number) => {
      data["list"][id] = rating;
      chrome.storage.local.set(data, function () {
        // console.log("saved");
      });
    };

    const step = (ev: MouseEvent, a: number) => {
      ev.preventDefault();
      ev.stopPropagation();
      let rating = parseFloat(input.value);
      rating = Math.min(10, Math.max(rating + a, -1));
      input.value = rating.toFixed(2);
      save(rating);
    };

    leftArrow.onclick = (ev) => step(ev, -0.1);
    rightArrow.onclick = (ev) => step(ev, 0.1);
    leftArrow2.onclick = (ev) => step(ev, -1);
    rightArrow2.onclick = (ev) => step(ev, 1);

    input.type = "number";
    input.value = rating.toFixed(2);
    input.min = "-1";
    input.max = "10";
    input.step = "0.5";
    input.className = "rating_input";
    input.onchange = function () {
      let rating = parseFloat(input.value);
      rating = Math.min(10, Math.max(rating, -1));
      input.value = rating.toFixed(2);
      save(rating);
    };

    span.className = "rating_span";

    // input.step = 0.1;
    span.appendChild(leftArrow2);
    span.appendChild(leftArrow);
    span.appendChild(input);
    span.appendChild(rightArrow);
    span.appendChild(rightArrow2);
    label.appendChild(span);
    info?.appendChild(label);
  });

  //   chrome.storage.local.get("list/", function (data) {
  //     let sites = data.sites;
  //     if (!sites) return;
  //     let url = window.location.href;
  //// console.log(url);
  //     let obj = sites.find((s) => url.match(s.url));
  //     if (!obj) {
  //// console.log("not found");
  //       return;
  //     }
  //     let infoblock = document.getElementById("info-block");
  //   });
}

if (!/\/g\/[0-9]+\/[0-9]+/.test(window.location.pathname)) {
  inject();

  let observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      if (mutation.addedNodes.length == 0) continue;
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        let node = mutation.addedNodes[i];
        if (
          node instanceof HTMLAnchorElement &&
          node.className == "my-nhentai-list-information-injection"
        ) {
          chrome.storage.local.get("info", (data) => {
            if (!data || !data["info"]) data = { info: {} };
            let arrivingData = JSON.parse(
              JSON.parse((node as HTMLAnchorElement).innerText)
            ) as HentaiInfo & { tags: Tag[] };
            // console.log("testing arriving data");
            if (!arrivingData) return;
            // console.log("received arriving data");
            let id = arrivingData.id;
            // console.log("testing id");
            if (!id) return;
            // console.log("id exists");
            let timeNow = Date.now().valueOf();
            let tags: Record<number, Tag> = {};
            for (let tag of arrivingData.tags as Tag[]) tags[tag.id] = tag;
            arrivingData.tags = (arrivingData.tags as Tag[]).map(
              (t) => t.id
            ) as any;
            if (!data["info"][id]) data["info"][id] = arrivingData;
            if (!data["info"][id]?.first_read)
              data["info"][id].first_read = timeNow;
            data["info"][id].last_read = timeNow;
            // console.log("data", data);
            chrome.storage.local.set(data, function () {
              // console.log("saved info");
              (node as HTMLAnchorElement).remove();
            });
            chrome.storage.local.get("tags", (data) => {
              if (!data || !data["tags"]) data = { tags: {} };
              for (let id in tags)
                if (!data["tags"][id]) data["tags"][id] = tags[id];

              chrome.storage.local.set(data, function () {
                // console.log("saved tags");
              });
            });
          });
        }
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
  });
}
