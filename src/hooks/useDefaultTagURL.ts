import { useEffect, useMemo, useState } from "react";
import { MyNHentaiListConfiguration } from "../pages/ConfigPage";
import { Tag } from "../models/HentaiInfo";

export default ({
  CONFIG,
  tags,
  defaultSorting,
  defaultTags,
  excludedTags,
  currentlySelected,
}: {
  CONFIG: MyNHentaiListConfiguration | undefined;
  tags: Record<string, Tag> | undefined;
  defaultSorting: number | undefined;
  defaultTags: number[] | undefined;
  excludedTags: number[] | undefined;
  currentlySelected: number[] | undefined;
}) => {
  return useMemo<string | undefined>(() => {
    // console.log(CONFIG, tags);
    if (!CONFIG || CONFIG?.noChipLinks || !tags) return undefined;
    let url = `https://nhentai.net/search/?q=`;
    if (CONFIG?.dontChangeTagURLsDefaults) {
      return url;
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
    return url;
  }, [CONFIG, tags]);
};
