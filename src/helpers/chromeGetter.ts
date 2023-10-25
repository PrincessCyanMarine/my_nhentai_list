import { Tag } from "../models/HentaiInfo";
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
    chrome.storage.local.get("info", (data) => {
      // console.log(data);
      resolve(!data || !data["info"] ? {} : data["info"]);
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
