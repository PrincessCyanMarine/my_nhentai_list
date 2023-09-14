const { readFileSync, writeFileSync } = require("fs");
const data = JSON.parse(
  readFileSync("my-nhentai-list-1694657773453.json", "utf-8")
);
let tags = {};

// console.log(Object.keys(data));
for (let key in data.info) {
  let item = data.info[key];
  for (let index in item.tags) {
    let tag = item.tags[index];
    item.tags[index] = tag.id;
    if (tags[tag]) continue;
    tags[tag] = true;
  }
}

data.tags = tags;
writeFileSync("output.json", JSON.stringify(data), "utf-8");
