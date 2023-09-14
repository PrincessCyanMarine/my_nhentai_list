import { HentaiInfo, Tag } from "../models/HentaiInfo";
import { InfoList, RatingList } from "../models/RatingList";

export function getTags() {
  return new Promise<Record<number, Tag>>((resolve, reject) => {
    chrome.storage.local.get("tags", (data) => {
      // console.log("tags", data);
      resolve(!data || !data["tags"] ? {} : data["tags"]);
    });
  });
}

export function getInfo() {
  return new Promise<InfoList>((resolve, reject) => {
    let tags = getTags();
    chrome.storage.local.get("info", (data) => {
      // console.log(data);
      tags.then((tags) => {
        // console.log(tags);
        if (!data || !data["info"]) return resolve({});
        let info = data["info"];
        for (let i in info) {
          let item = info[i];
          // console.log(item.tags);
          for (let index in item.tags) {
            // console.log(index);
            let tag = item.tags[index];
            // console.log(tag, typeof tag == "number", tags[tag]);
            // if (!tags[tag]) console.log(tag);
            if (typeof tag == "number") {
              info[i].tags[index] = tags[tag]
                ? tags[tag]
                : { id: tag, name: "Unknown" };
            }
          }
        }
        // console.log(info);
        resolve(info);
      });
    });
  });
}

export function getRatings() {
  return new Promise<RatingList>((resolve, reject) => {
    chrome.storage.local.get("list", (data) => {
      // console.log(data);
      resolve(!data || !data["list"] ? {} : data["list"]);
    });
  });
}
