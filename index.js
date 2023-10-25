const { readFileSync, writeFileSync } = require("fs");
const { tags, info } = JSON.parse(
  readFileSync("my-nhentai-list-1694749272404.json", "utf-8")
);

let tagcount = {};
for (let index in info) {
  let item = info[index];
  for (let tag of item.tags) {
    if (!tagcount[tag]) tagcount[tag] = 0;
    tagcount[tag]++;
  }
}
for (let key in tagcount) {
  let tag = tagcount[key];
  tagcount[key] = { ...tags[key], count: tag };
  // if (!tagcount[key].count) delete tagcount[key];
  // console.log(tagcount[key].type != "artist");
  // if (!tagcount[key].type != "artist") delete tagcount[key];
}
for (let tag of Object.values(tagcount)
  .sort((a, b) => b.count - a.count)
  .reverse()) {
  if (tag.type != "tag") continue;
  console.log(tag);
}
// console.log(tagcount);
