import React, { useEffect, useMemo, useState } from "react";
import { InfoList } from "../../models/RatingList";
import { MyNHentaiListConfiguration } from "../../pages/ConfigPage";
import { Tag } from "../../models/HentaiInfo";
import CustomGallery from "./CustomGallery";
import { useSubscription } from "../../hooks/useSubscription";
// import { useDebug } from "../../helpers/useDebug";
export type GalleryItem = {
  dataTags: number[];
  link: string;
  image: {
    src: string;
    width: number;
    height: number;
  };
  id: string;
  title: string;
  anchorPadding: string;
};
import style from "../../sass/CustomContainer.module.scss";
import useDefaultTagURL from "../../hooks/useDefaultTagURL";
import StatusSelector from "../StatusSelector";
import ButtonLink from "../ButtonLink";
import { createTabOnGroup } from "../../helpers/tabHelper";
import { Tab } from "@mui/material";
import { useDebug } from "../../helpers/useDebug";

let galleryStyle = localStorage.getItem("galleryStyle")
  ? parseInt(localStorage.getItem("galleryStyle")!)
  : undefined;
if (galleryStyle != undefined && isNaN(galleryStyle!)) galleryStyle = undefined;

export default ({
  title,
  galleryInfo,
}: {
  //   galleries: HTMLDivElement[];
  title: string;
  galleryInfo: GalleryItem[];
}) => {
  let CONFIG = useSubscription<MyNHentaiListConfiguration>(
    {},
    "sync",
    "configuration"
  );
  useEffect(() => {
    if (CONFIG.galleryStyle != undefined)
      localStorage.setItem("galleryStyle", CONFIG.galleryStyle.toString());
  }, [CONFIG.galleryStyle]);

  let tags = useSubscription<Record<string, Tag>>({}, "local", "tags");

  const getTagURL = (tag: number) =>
    tags[tag]
      ? location.pathname.startsWith("/search") &&
        location.search.includes("q=")
        ? location.search.replace(
            /q=(.+?)(&|$)/,
            (_, $1, $2) =>
              `q=${$1}+${tags[tag].type}%3A%22${tags[tag].name}%22${$2}`
          )
        : `https://nhentai.net/search/?q=${tags[tag].type}%3A%22${tags[tag].name}%22`
      : undefined;

  let ratings = useSubscription<Record<string, number>>({}, "local", "list");
  let info = useSubscription<InfoList>({}, "local", "info");
  let currentlySelected = useSubscription<number[]>(
    [],
    "sync",
    "currentlySelectedTags"
  );
  let defaultTags = useSubscription<number[]>(
    [],
    "sync",
    "defaultSelectedTags"
  );
  let favoriteTags = useSubscription<number[]>([], "sync", "favoriteTags");
  let defaultSorting = useSubscription<number>(0, "sync", "defaultTagSorting");
  let excludedTags = useSubscription<number[]>(
    [],
    "sync",
    "currentlyExcludedTags"
  );

  let galleryProps = {
    tags,
    ratings,
    CONFIG,
    info,
    currentlySelected,
    defaultTags,
    favoriteTags,
    defaultSorting,
    excludedTags,
  } as Parameters<typeof CustomGallery>[0];

  const defaultURL = useDefaultTagURL({
    CONFIG,
    currentlySelected,
    defaultSorting,
    defaultTags,
    excludedTags,
    tags,
  });
  // useDebug(defaultURL);
  //   useDebug({
  //     title,
  //     galleryInfo,
  //     CONFIG,
  //     currentlySelected,
  //     defaultSorting,
  //     defaultTags,
  //     excludedTags,
  //     favoriteTags,
  //     info,
  //     ratings,
  //     tags,
  //   });

  function Title({ title }: { title: string }) {
    let ref = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
      let target = ref.current;
      if (!target) return;
      let animating = false;
      let animationFrame: number | undefined;

      const animate = () => {
        if (!animating) return;
        let target = ref.current;
        if (!target) return;
        let parent = target.parentElement;
        if (!parent) return;
        let parentWidth = parent.clientWidth;
        let targetWidth = target.clientWidth;
        if (targetWidth > parentWidth) {
          let dir = parseInt(target.getAttribute("data-dir") || "1");
          let max = targetWidth / 2 - parentWidth / 2 + 16;
          let x = parseInt(target.getAttribute("data-x") || `${max}`);
          x -= dir;
          if ((dir > 0 && x < -max) || (dir < 0 && x > max)) {
            target.setAttribute("data-dir", `${-dir}`);
          }
          target.setAttribute("data-x", `${x}`);
          target.style.transform = `translateX(${x}px)`;
        }
        animationFrame = requestAnimationFrame(animate);
      };

      let observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          animating = true;
          animationFrame = requestAnimationFrame(animate);
        } else {
          animating = false;
          cancelAnimationFrame(animationFrame!);
        }
      });
      observer.observe(target);
    }, [ref]);
    return (
      <div className={style.list_item_title_container}>
        <div className={style.list_item_title} ref={ref}>
          {title}
        </div>
      </div>
    );
  }

  const [seeingMore, setSeeingMore] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (seeingMore != undefined) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
  }, [seeingMore]);

  return (
    <>
      {title && <h2>{title}</h2>}

      {
        [
          galleryInfo.map(
            ({ image, title, dataTags, id, link, anchorPadding }) => (
              <div className="gallery" data-tags={dataTags.join(" ")}>
                <a
                  onClick={async (ev) => {
                    if (!CONFIG.dontShowMoreOnGallery) {
                      ev.preventDefault();
                      ev.stopPropagation();
                      setSeeingMore(id);
                      return;
                    } else if (CONFIG.readDefaultsToAnotherTab) {
                      ev.preventDefault();
                      ev.stopPropagation();
                      createTabOnGroup({
                        url: link,
                        active: !CONFIG.dontFocusOnAnotherTabRead,
                      });
                    }
                  }}
                  href={link}
                  className="cover"
                  style={{ padding: anchorPadding }}
                >
                  <img
                    className="lazyload"
                    width={image.width}
                    height={image.height}
                    data-src={image.src}
                    src={image.src}
                  />
                  <noscript>
                    <img
                      src={image.src}
                      width={image.width}
                      height={image.height}
                    />
                  </noscript>
                  <div className="caption">{title}</div>
                </a>
                <CustomGallery {...galleryProps} id={id} dataTags={dataTags} />
              </div>
            )
          ),
          <div className={style.titles_list}>
            {galleryInfo.map(({ id, dataTags, image, title, link }) => (
              <div className={style.list_item}>
                <div className={style.list_item_image}>
                  <a
                    onClick={async () => {
                      if (CONFIG.readDefaultsToAnotherTab)
                        await createTabOnGroup({
                          url: link,
                          active: !CONFIG.dontFocusOnAnotherTabRead,
                        });
                      else window.open(link, "_self");
                    }}
                    style={{
                      aspectRatio: `${image.width}/${image.height}`,
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                  >
                    <img
                      src={image.src}
                      className="censorable"
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </a>
                </div>
                <Title title={info[id]?.title?.pretty || title} />
                <div className={style.list_item_rating}>
                  {ratings[id] == undefined || ratings[id] < 0 ? (
                    "UNRATED"
                  ) : (
                    <div
                      className={`${style.rating} ${
                        ratings[id] >= 6
                          ? style.good
                          : ratings[id] >= 4
                          ? style.average
                          : style.bad
                      }`}
                    >
                      ★ {ratings[id].toFixed(2).toString().padStart(5, "0")}
                    </div>
                  )}
                </div>
                <a
                  href={getTagURL(
                    dataTags.find((t) => [6346, 12227, 29963].includes(t)) || 0
                  )}
                  className={style.language}
                >
                  {(() => {
                    let language = dataTags.find((t) =>
                      [6346, 12227, 29963].includes(t)
                    );
                    if (!language) return null;
                    let image = chrome.runtime.getURL(
                      `/assets/language/${language}.gif`
                    );
                    if (!image) return null;
                    return <img src={image} />;
                  })()}
                </a>
                <div className={style.list_item_read_button}>
                  <ButtonLink
                    href={link}
                    target={
                      CONFIG.readDefaultsToAnotherTab
                        ? CONFIG.dontFocusOnAnotherTabRead
                          ? "_background"
                          : "_blank"
                        : "_self"
                    }
                  >
                    READ
                  </ButtonLink>
                </div>
                <div className={style.list_item_more_button}>
                  <button
                    onClick={() => {
                      setSeeingMore(id);
                    }}
                  >
                    MORE
                  </button>
                </div>
                <div className={style.list_item_tags}>
                  <div>
                    {dataTags
                      .filter((t) => favoriteTags.includes(t))
                      .map((tag) => {
                        return (
                          <a href={getTagURL(tag)}>{tags[tag]?.name || tag}</a>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>,
        ][CONFIG.galleryStyle ?? galleryStyle ?? 0]
      }

      {seeingMore != undefined && (
        <div className={style.moreInfo}>
          <div
            className={style.background}
            onClick={() => {
              setSeeingMore(undefined);
            }}
          />
          <div className={style.foreground}>
            <a
              onClick={(ev) => {
                if (CONFIG.readDefaultsToAnotherTab) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  createTabOnGroup({
                    url:
                      galleryInfo.find((t) => t.id == seeingMore)?.link || "",
                    active: !CONFIG.dontFocusOnAnotherTabRead,
                  });
                }
              }}
              href={galleryInfo.find((t) => t.id == seeingMore)?.link}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 300,
                  maxWidth: "100%",
                  aspectRatio: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  className="censorable"
                  src={galleryInfo.find((g) => g.id == seeingMore)?.image.src}
                  style={{
                    aspectRatio: `${
                      galleryInfo.find((g) => g.id == seeingMore)?.image.width
                    }/${
                      galleryInfo.find((g) => g.id == seeingMore)?.image.height
                    }`,
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                />
              </div>
              <div
                className={style.tag}
                style={{ fontSize: 24, fontWeight: "bold" }}
              >
                READ
              </div>
            </a>
            <StatusSelector
              className={style.status_selector}
              selected={info[seeingMore]?.status}
              onChange={(status) => {
                if (!info[seeingMore]) return;
                info[seeingMore].status = status as any;
                chrome.storage.local.set({ info });
              }}
            />
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              {info[seeingMore]?.title.pretty ||
                galleryInfo.find((g) => g.id == seeingMore)?.title}
            </div>
            {ratings[seeingMore] != undefined && ratings[seeingMore] >= 0 && (
              <div
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                <div
                  style={{
                    color:
                      ratings[seeingMore] >= 6
                        ? "#0f0"
                        : ratings[seeingMore] >= 4
                        ? "#ff0"
                        : "#f00",
                  }}
                >
                  ★ {ratings[seeingMore].toFixed(2).toString().padStart(5, "0")}
                </div>
              </div>
            )}
            <div>#{seeingMore}</div>
            <div
              style={{
                fontSize: 16,
              }}
            >
              <span
                style={{
                  fontWeight: "bold",
                }}
              >
                Pages:
              </span>{" "}
              {info[seeingMore]?.num_pages || "UNKNOWN"}
            </div>
            {info[seeingMore] && (
              <div
                style={{
                  fontSize: 16,
                }}
              >
                Read:{" "}
                <span
                  style={{
                    fontWeight: "bold",
                  }}
                >
                  {info[seeingMore]?.last_page || 0}/
                  {info[seeingMore].num_pages}
                </span>{" "}
                pages
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              {(
                [
                  ["LANGUAGE", ["language"]],
                  ["PARODY", ["parody"]],
                  ["CHARACTERS", ["character"]],
                  ["TAGS", ["tag"]],
                  ["ARTISTS", ["artist"]],
                  ["GROUPS", ["group"]],
                  ["CATEGORIES", ["category"]],
                ] as ([string, string[], boolean] | [string, string[]])[]
              ).map(([title, filter, include]) => {
                if (include == undefined) include = true;
                let _tags = galleryInfo
                  .find((g) => g.id == seeingMore)
                  ?.dataTags.sort((a, b) => {
                    if (favoriteTags.includes(a) == favoriteTags.includes(b))
                      return 0;
                    if (favoriteTags.includes(a)) return -1;
                    return 1;
                  })
                  .filter((t) => filter.includes(tags[t]?.type) == include);
                return (
                  _tags &&
                  _tags.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        {title}
                      </div>
                      <div className={style.tags}>
                        {_tags.map((tag) => (
                          <a
                            data-tag={tag}
                            href={getTagURL(tag)}
                            className={`${style.tag}${
                              favoriteTags.includes(tag)
                                ? ` ${style.favorite}`
                                : ""
                            }`}
                          >
                            {tags[tag]?.name || tag}
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
