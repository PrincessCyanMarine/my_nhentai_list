export interface GalleryHentaiInfo extends HentaiInfo {
  images: GalleryImages;
  tags: GalleryTag[];
}

export interface GalleryImages {
  cover: GalleryImage;
  thumbnail: GalleryImage;
  pages: GalleryImage[];
}

export interface GalleryImage extends Image {
  gallery: GalleryHentaiInfo;
  url: () => string;
  thumbnail: () => Image;
}

export interface GalleryTag extends Tag {
  _url: string;
  count: number;
  created: boolean;
}

export interface HentaiInfo {
  id: number;
  media_id: string;
  num_favorites: number;
  num_pages: number;
  scanlator: string;
  tags: Tag[];
  title: Title;
  upload_date: null;
  images: Images;
}

export interface Images {
  cover: Image;
  thumbnail?: Image;
  pages?: Image[];
}

export interface Image {
  number: number;
  type: ImageType;
  width: number;
  height: number;
  extension: Extension;
}

export enum Extension {
  JPG = "jpg",
  PNG = "png",
}

export enum ImageType {
  COVER = "cover",
  PAGE = "page",
  THUMBNAIL = "thumbnail",
}

export interface Tag {
  id: number;
  name: string;
  type: string;
}

export interface Title {
  english: string;
  japanese: string;
  pretty: string;
}
