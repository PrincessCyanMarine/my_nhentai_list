import {
  GalleryHentaiInfo,
  GalleryImage,
  GalleryTag,
  HentaiInfo,
  Image,
  Images,
  Tag,
} from "../models/HentaiInfo";

declare global {
  interface Window {
    gallery: GalleryHentaiInfo;
  }
}

// console.log();
// console.log(filterGallery(window.gallery));
// console.log(JSON.stringify(filterGallery(window.gallery)).length);
// console.log("Sending message");

if (!/\/g\/[0-9]+\/[0-9]+/.test(window.location.pathname)) {
  let informationInjection = document.createElement("a");
  informationInjection.className = "my-nhentai-list-information-injection";
  informationInjection.style.display = "none";
  informationInjection.innerText = JSON.stringify(
    JSON.stringify(filterGallery(window.gallery))
  );
  document.body.appendChild(informationInjection);
}
// window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");

// window.onmessage = (event) => {
//   console.log("Message received from extension", event);
//   event.source?.postMessage("Message received from extension");
// };

function filterGallery(gallery?: GalleryHentaiInfo) {
  if (!gallery) return;
  let {
    id,
    media_id,
    num_favorites,
    num_pages,
    scanlator,
    tags,
    title,
    upload_date,
    images,
  } = gallery;

  let clear = <T extends R, R>(obj: T, filter: Exclude<keyof T, keyof R>[]) => {
    let res: any = {};
    for (let key in obj) {
      if (filter.includes(key as any)) continue;
      res[key] = obj[key];
    }
    return res as R;
  };

  let _images: Partial<Images>;
  {
    let _clear = (i: GalleryImage) =>
      clear(i, ["gallery", "url", "thumbnail"]) as Image;

    _images = {
      cover: _clear(images.cover),
      //   thumbnail: _clear(images.thumbnail),
      //   pages: [] as Image[],
    };

    // for (let index in images.pages)
    //   _images["pages"][index] = _clear(images.pages[index]);
  }

  let _tags = [] as Tag[];
  for (let index in tags)
    _tags[index] = clear(tags[index], ["_url", "count", "created"]);

  let res = {
    id,
    media_id,
    num_favorites,
    num_pages,
    scanlator,
    tags: _tags,
    title,
    upload_date,
    images: _images,
  } as HentaiInfo & { tags: Tag[] };
  //   if (includeImages) res.images = _images;
  return res;
}
