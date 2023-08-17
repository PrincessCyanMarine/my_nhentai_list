import { Extension, HentaiInfo, Image, ImageType } from "../models/HentaiInfo";

export const getImageURL = (gallery?: HentaiInfo, image?: Image) => {
  var t, e;
  if (!image || !gallery) return undefined;

  return (
    "page" === image.type
      ? ((t = "i"), (e = image.number.toString()))
      : "thumbnail" === image.type
      ? ((t = "t"), (e = "".concat(image.number.toString(), "t")))
      : ((t = "t"), (e = "".concat(image.type))),
    "https://"
      .concat(t, ".nhentai.net/galleries/")
      .concat(gallery.media_id, "/")
      .concat(e, ".")
      .concat(image.extension)
  );
};
