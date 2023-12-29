import React, { useEffect, useId, useState } from "react";
import {
  KeysMatching,
  MyNHentaiListConfiguration,
} from "../../pages/ConfigPage";
import { InfoList } from "../../models/RatingList";
import { Tag } from "../../models/HentaiInfo";
// import { useDebug } from "../../helpers/useDebug";

export default ({
  id,
  dataTags,
  tags,
  ratings,
  CONFIG,
  info,
  currentlySelected,
  favoriteTags,
  defaultTags,
  defaultSorting,
  excludedTags,
}: {
  id: string | undefined;
  dataTags: number[] | undefined;
  tags: Record<string, Tag> | undefined;
  ratings: Record<string, number> | undefined;
  CONFIG: MyNHentaiListConfiguration | undefined;
  info: InfoList | undefined;
  currentlySelected: number[] | undefined;
  defaultTags: number[] | undefined;
  favoriteTags: number[] | undefined;
  defaultSorting: number | undefined;
  excludedTags: number[] | undefined;
}) => {
  const [defaultURL, setDefaultURL] = useState<string | undefined>(
    `https://nhentai.net/search/?q=`
  );
  // useDebug(defaultURL);
  useEffect(() => {
    if (!CONFIG || CONFIG?.noChipLinks || !tags) return;
    let url = `https://nhentai.net/search/?q=`;
    if (CONFIG?.dontChangeTagURLsDefaults) {
      setDefaultURL(url);
      return;
    }
    let sorting = 0;
    let researchTags = [];
    if (!CONFIG["dontChangeTagURLsSorting"] && defaultSorting)
      sorting = defaultSorting;

    if (!CONFIG["dontChangeTagURLsDefaults"] && defaultTags) {
      researchTags.push(...defaultTags);
    }

    if (!CONFIG["dontChangeTagURLsSelected"]) {
      researchTags.push(
        ...(currentlySelected?.filter(
          (t) => !excludedTags || !excludedTags.includes(t)
        ) || [])
      );
    }
    if (!CONFIG["dontChangeTagURLsExcluded"]) {
      researchTags.push(...(excludedTags?.map((t) => -t) || []));
    }

    url = `https://nhentai.net/search/?${
      sorting == 0 ? "" : `sort=popular${["-today", "-week", ""][sorting - 1]}&`
    }q=${researchTags
      .map((id) => {
        let exclude = false;
        if (id < 0) {
          id = -id;
          exclude = true;
        }
        let tag = tags?.[id];
        if (!tag) {
          // alert("SOMETHING WENT WRONG WITH TAG " + id);
          return "";
        }
        return `${exclude ? "-" : ""}${tag.type}%3A"${tag.name}"`;
      })
      .join("+")
      .replace(/ /g, "+")}`;
    setDefaultURL(url);
  }, [CONFIG, tags]);
  // useDebug(defaultURL);
  const [rating, setRating] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!id || !ratings) {
      setRating(undefined);
      return;
    }
    setRating(ratings[id]);
  }, [ratings, id]);

  let favoriteId = useId();
  let regularId = useId();

  const [reloadAnimation, setReloadAnimation] = useState(false);

  useEffect(() => {
    if (reloadAnimation) {
      setReloadAnimation(false);
      return;
    }
    if (CONFIG?.noFavoriteChips && CONFIG?.noRegularTagChips) return;
    const addAnimation = (divId: string, key: KeysMatching<boolean>) => {
      if (CONFIG?.[key]) return;
      let divRef = document.getElementById(divId);
      if (!divRef) return;
      let inview = true;
      let animating = false;

      let observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          animating = true;
          inview = true;
          frame = requestAnimationFrame(animate);
        } else {
          animating = false;
          inview = false;

          let boundingBox = entries[0].boundingClientRect;
          if (
            boundingBox.top == 0 &&
            boundingBox.bottom == 0 &&
            boundingBox.left == 0 &&
            boundingBox.right == 0
          )
            setReloadAnimation(true);
        }
      });
      observer.observe(divRef);
      let scrollDirection = 1;
      let children = divRef.children;

      let totalWidth = 0;
      for (let i = 0; i < children.length; i++)
        totalWidth += children[i].clientWidth;
      totalWidth += 8 * (children.length - 1) + 12;

      let frame: number;
      let animate = () => {
        if (!animating || !divRef || totalWidth < 0) return;
        if (divRef.scrollLeft <= 0) scrollDirection = 1;
        else if (divRef.scrollLeft + divRef.clientWidth + 1 >= totalWidth)
          scrollDirection = -0.5;

        divRef.scrollLeft = (divRef.scrollLeft || 0) + scrollDirection * 2;
        // console.log(
        //   divRef.scrollLeft,
        //   divRef.clientWidth,
        //   totalWidth,
        //   scrollDirection
        // );
        frame = requestAnimationFrame(animate);
      };
      let onmouseenter = () => {
        animating = false;
        cancelAnimationFrame(frame);
      };
      let onmouseleave = () => {
        if (inview && !animating) {
          animating = true;
          frame = requestAnimationFrame(animate);
        }
      };

      if (!CONFIG?.noChipLinks) {
        divRef.addEventListener("mouseenter", onmouseenter);
        divRef.addEventListener("mouseleave", onmouseleave);
      }

      const removeAnimation = () => {
        let divRef = document.getElementById(divId);
        // console.log("REMOVING FROM ", divRef, frame, observer);
        cancelAnimationFrame(frame);
        if (observer) {
          if (divRef) observer.unobserve(divRef);
          observer.disconnect();
        }
        if (divRef) {
          divRef.removeEventListener("mouseenter", onmouseenter);
          divRef.removeEventListener("mouseleave", onmouseleave);
        }
      };
      return removeAnimation;
    };
    const removers = [
      addAnimation(favoriteId, "noFavoriteChips"),
      addAnimation(regularId, "noRegularTagChips"),
    ];
    return () => {
      removers.forEach((remover) => remover?.());
    };
  }, [
    dataTags,
    favoriteId,
    regularId,
    favoriteTags,
    tags,
    info,
    CONFIG,
    reloadAnimation,
  ]);

  return (
    <>
      {!CONFIG?.hideRatingOnGallery && id && (
        <div
          className={`rating ${
            (rating && rating >= 0) || rating == 0
              ? rating >= 6
                ? "rating--positive"
                : rating >= 4
                ? "rating--neutral"
                : "rating--negative"
              : ""
          }`}
        >
          {rating == 0 || (rating && rating >= 0)
            ? rating.toFixed(2)
            : "NOT RATED"}
        </div>
      )}

      {!CONFIG?.hideReadOnGallery && id && info?.[id]?.status && (
        <div className={`read-indicator ${info?.[id].status ?? "none"}`}> </div>
      )}

      {!CONFIG?.noFavoriteChips &&
        dataTags &&
        dataTags.filter((tag) => favoriteTags?.includes(tag)).length > 0 && (
          <div
            className={`gallery-tags ${
              CONFIG?.noRegularTagChips ? "" : " favorite-tags"
            }`}
            id={favoriteId}
            style={CONFIG?.noChipLinks ? { pointerEvents: "none" } : {}}
          >
            {dataTags
              ?.filter((tag) => favoriteTags?.includes(tag))
              .map((tag) => {
                return (
                  <a
                    className={`gallery-tag gallery-tag--favorite ${
                      currentlySelected?.includes(tag)
                        ? "gallery-tag--selected"
                        : ""
                    }`}
                    href={
                      !CONFIG?.noChipLinks &&
                      tags?.[tag]?.type &&
                      tags?.[tag]?.name
                        ? `${defaultURL}+${tags?.[tag].type}:"${tags?.[tag]?.name}"`
                        : ""
                    }
                    style={
                      tags?.[tag]?.name
                        ? {
                            cursor: "pointer",
                          }
                        : {
                            cursor: "not-allowed",
                          }
                    }
                  >
                    {tags?.[tag]?.name || `UNKNOWN TAG (${tag.toString()})`}
                  </a>
                );
              })}
          </div>
        )}

      {!CONFIG?.noRegularTagChips &&
        dataTags &&
        dataTags.filter((tag) => !favoriteTags?.includes(tag)).length > 0 && (
          <div
            className="gallery-tags"
            id={regularId}
            style={CONFIG?.noChipLinks ? { pointerEvents: "none" } : {}}
          >
            {dataTags
              ?.filter((tag) => !favoriteTags?.includes(tag))
              .map((tag) => {
                return (
                  <a
                    className={`gallery-tag ${
                      currentlySelected?.includes(tag)
                        ? "gallery-tag--selected"
                        : ""
                    }`}
                    href={
                      !CONFIG?.noChipLinks &&
                      tags?.[tag]?.type &&
                      tags?.[tag]?.name
                        ? `${defaultURL}+${tags?.[tag]?.type}:"${tags?.[tag]?.name}"`
                        : undefined
                    }
                    style={
                      tags?.[tag]?.name
                        ? {
                            cursor: "pointer",
                          }
                        : {
                            cursor: "not-allowed",
                          }
                    }
                  >
                    {tags?.[tag]?.name || `UNKNOWN TAG (${tag.toString()})`}
                  </a>
                );
              })}
          </div>
        )}
    </>
  );
};
// let scrollDirection = parseFloat(
//   div.getAttribute("data-scroll-direction") || "1"
// );
// let totalWidth = parseInt(div.getAttribute("data-total-width") || "0");
// if (div.scrollLeft <= 0) scrollDirection = 1;
// else if (div.scrollLeft + div.clientWidth >= totalWidth)
//   scrollDirection = -0.5;
// div.scrollLeft += scrollDirection;
// div.setAttribute("data-scroll-direction", scrollDirection.toString());
