import React, { useEffect, useId, useState } from "react";
import "../sass/popup.scss";
import { HentaiInfo } from "../models/HentaiInfo";
import { InfoList, RatingList } from "../models/RatingList";
import HentaiInfoComponent from "./HentaiInfoComponent";
import Fuse from "fuse.js";
import { VscSortPrecedence, VscClose } from "react-icons/vsc";
import {
  FaSortAlphaDown,
  FaSortAlphaUpAlt,
  FaSortAmountDownAlt,
  FaSortAmountUp,
  FaSortAmountUpAlt,
  FaSortNumericDown,
  FaSortNumericUp,
  FaSortNumericUpAlt,
} from "react-icons/fa";

function getInfo() {
  return new Promise<InfoList>((resolve, reject) => {
    chrome.storage.local.get("info", (data) => {
      // console.log(data);
      resolve(!data || !data["info"] ? {} : data["info"]);
    });
  });
}
function getRatings() {
  return new Promise<RatingList>((resolve, reject) => {
    chrome.storage.sync.get("list", (data) => {
      // console.log(data);
      resolve(!data || !data["list"] ? {} : data["list"]);
    });
  });
}

type SortingFunction = (a: string, b: string) => number;

export default () => {
  const [info, setInfo] = useState<InfoList>({});
  const [ratings, setRatings] = useState<RatingList>({});

  const _sortByNumber = (a?: number | null, b?: number | null) => {
    if (a && b) {
      return b - a;
    } else if (a) {
      return -1;
    } else if (b) {
      return 1;
    } else {
      return 0;
    }
  };

  const _sortByString = (a?: string | null, b?: string | null) => {
    if (a && b) {
      return a.localeCompare(b);
    } else if (a) {
      return -1;
    } else if (b) {
      return 1;
    } else {
      return 0;
    }
  };

  const sortByScore: SortingFunction = (a, b) =>
    _sortByNumber(ratings[a], ratings[b]);
  const sortByTitle: SortingFunction = (a, b) =>
    _sortByString(
      info[a]?.title.pretty ?? "NO TITLE INFORMATION",
      info[b]?.title.pretty ?? "NO TITLE INFORMATION"
    );
  const sortByPages = (a: string, b: string, r = false) => {
    let _f = r ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
    return _sortByNumber(info[a]?.num_pages ?? _f, info[b]?.num_pages ?? _f);
  };
  const sortByRandom: SortingFunction = (a, b) => Math.random() - 0.5;
  const sortById = (a: string, b: string) =>
    _sortByNumber(Number(a), Number(b));

  const sortByScoreReverse: SortingFunction = (a, b) => sortByScore(a, b) * -1;
  const sortByTitleReverse: SortingFunction = (a, b) => sortByTitle(a, b) * -1;
  const sortByPagesReverse: SortingFunction = (a, b) =>
    sortByPages(a, b, true) * -1;
  const sortByIdReverse: SortingFunction = (a, b) => sortById(a, b) * -1;

  const [sortingFunction, _setSortingFunction] =
    useState<SortingFunction>(sortByScore);

  const setSortingFunction = (func: SortingFunction) => {
    _setSortingFunction(() => func);
    setShowSortingOptions(false);
  };

  useEffect(() => {
    const _onscroll = (ev: Event) => setShowSortingOptions(false);

    document
      .getElementById("titles_list")
      ?.parentElement?.addEventListener("scroll", _onscroll);
    return () => {
      document
        .getElementById("titles_list")
        ?.parentElement?.removeEventListener("scroll", _onscroll);
    };
  }, []);

  const [itemArray, setItemArray] = useState<string[]>([]);

  useEffect(() => {
    setItemArray(
      sort(
        Object.keys(info)
          .concat(Object.keys(ratings))
          .filter((value, index, self) => self.indexOf(value) === index)
      )
    );
  }, [info, ratings, sortingFunction]);

  function sort(ids: string[]) {
    let _sortingFunction = sortingFunction;
    if (typeof _sortingFunction != "function") _sortingFunction = sortByScore;
    return ids.sort(_sortingFunction);
  }

  useEffect(() => {
    getInfo().then(setInfo);
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes["info"]) setInfo(changes["info"].newValue);
    });
  }, []);

  useEffect(() => {
    getRatings().then(setRatings);
    chrome.storage.sync.onChanged.addListener((changes) => {
      if (changes["list"]) setRatings(changes["list"].newValue);
    });
  }, []);

  const [search, setSearch] = useState<string>("");
  const [matches, setMatches] = useState<Fuse.FuseResult<HentaiInfo>[]>([]);
  const [fuses, setFuse] = useState<Fuse<HentaiInfo>[]>([]);
  const [showSortingOptions, setShowSortingOptions] = useState<boolean>(false);

  useEffect(() => {
    let toSearch = sort(Object.keys(info)).map((key) => info[key]);
    setFuse([
      new Fuse(
        toSearch.filter((i) => !!i),
        {
          keys: ["title.pretty"],
          includeMatches: true,
          shouldSort: false,
          isCaseSensitive: false,
          includeScore: true,
        }
      ),
      new Fuse(
        toSearch.filter((i) => !!i),
        {
          keys: ["tags.name"],
          threshold: 0.3,
          includeMatches: true,
          shouldSort: false,
          isCaseSensitive: false,
          includeScore: true,
        }
      ),
      new Fuse(
        toSearch.filter((i) => !!i),
        {
          keys: ["id"],
          includeMatches: true,
          isCaseSensitive: false,
          includeScore: true,
        }
      ),
    ]);
  }, [info]);

  useEffect(() => {
    if (!fuses) return;
    let m: Fuse.FuseResult<HentaiInfo>[] = [];
    for (let fuse of fuses) m = m.concat(fuse.search(search));

    setMatches(
      m
        .filter((value, _, self) => {
          let __m = self.filter((v) => v.item.id == value.item.id);
          let __s = __m
            .map((v) => v.score)
            .filter((v) => v != undefined) as number[];
          let __i = 0;
          for (let i = 1; i < __s.length; i++) {
            if (__s[i] < __s[__i]) __i = i;
          }
          return __m[__i] == value;
        })
        .sort((a, b) => {
          return (a.score ?? 0) - (b.score ?? 0);
        })
    );
  }, [fuses, search]);

  useEffect(() => {
    let elem = document.getElementById("titles_list");
    while (elem) {
      elem.scrollTo(0, 0);
      elem = elem.parentElement;
    }
  }, [matches, sortingFunction, search]);

  return (
    <div>
      <div id="topbar">
        <button onClick={() => setSearch("")}>
          <VscClose />
        </button>
        <input
          id="search-bar"
          value={search}
          onInput={(ev) => setSearch(ev.currentTarget.value)}
        />
        <button onClick={() => setShowSortingOptions((s) => !s)}>
          <VscSortPrecedence />
        </button>
        {showSortingOptions && (
          <div id="sorting-options">
            <button onClick={() => setSortingFunction(sortByScore)}>
              <span>
                Score <FaSortNumericUpAlt />
              </span>
            </button>
            <button onClick={() => setSortingFunction(sortByScoreReverse)}>
              <span>
                Score <FaSortNumericDown />
              </span>
            </button>
            <button onClick={() => setSortingFunction(sortByTitle)}>
              <span>
                Title <FaSortAlphaUpAlt />
              </span>
            </button>
            <button onClick={() => setSortingFunction(sortByTitleReverse)}>
              <span>
                Title <FaSortAlphaDown />
              </span>
            </button>
            <button onClick={() => setSortingFunction(sortByPages)}>
              <span>
                Number of Pages <FaSortNumericUpAlt />
              </span>
            </button>
            <button onClick={() => setSortingFunction(sortByPagesReverse)}>
              <span>
                Number of Pages <FaSortNumericDown />
              </span>
            </button>
            <button onClick={() => setSortingFunction(sortById)}>
              <span>
                ID <FaSortNumericUpAlt />
              </span>
            </button>
            <button onClick={() => setSortingFunction(sortByIdReverse)}>
              <span>
                ID <FaSortNumericDown />
              </span>
            </button>
            <button onClick={() => setSortingFunction(sortByRandom)}>
              <span>Random</span>
            </button>
          </div>
        )}
      </div>
      <main>
        {" "}
        <div id="buttons">
          <button
            onClick={() => {
              let fileSelector = document.createElement("input");
              fileSelector.setAttribute("type", "file");
              fileSelector.setAttribute("accept", ".json");
              fileSelector.multiple = false;
              fileSelector.addEventListener("change", (ev) => {
                const file = (ev.currentTarget as any)?.files[0] as File;
                if (!file) return;
                if (!file.name.endsWith(".json")) {
                  // console.log("Invalid file type");
                  alert("Invalid file type");
                  return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const result = ev.target?.result as string;
                  const json = JSON.parse(result);
                  if (!json) return;
                  if (!json["info"] || !json["list"]) {
                    // console.log("Invalid JSON");
                    alert("Invalid JSON");
                    return;
                  }
                  if (
                    ((info && Object.keys(info).length > 0) ||
                      (ratings && Object.keys(ratings).length > 0)) &&
                    !confirm(
                      "Are you sure you want to import? (all of your current saved info will be lost)"
                    )
                  )
                    return;
                  chrome.storage.local.set({ info: json["info"] });
                  chrome.storage.sync.set({ list: json["list"] });
                };
                reader.readAsText(file);
              });
              fileSelector.click();
            }}
          >
            IMPORT
          </button>
          <button
            onClick={() => {
              getInfo().then((info) => {
                getRatings().then((ratings) => {
                  let json = JSON.stringify({ info, list: ratings });
                  let blob = new Blob([json], { type: "application/json" });
                  let url = URL.createObjectURL(blob);
                  let a = document.createElement("a");
                  a.href = url;
                  a.download = `my-nhentai-list-${Date.now()}.json`;
                  a.click();
                });
              });
            }}
          >
            EXPORT
          </button>
          <button
            onClick={() => {
              if (
                !confirm(
                  "Are you sure you want to clear all of your saved info?"
                )
              )
                return;
              chrome.storage.local.remove("info");
              chrome.storage.sync.remove("list");
              location.reload();
            }}
          >
            CLEAR
          </button>
        </div>
        <div id="titles_list">
          {search.length > 0 ? (
            <>
              {matches.map((match) => {
                const info = match.item;
                const rating = ratings[info.id];
                return (
                  <HentaiInfoComponent
                    id={info.id}
                    key={info.id}
                    info={info}
                    rating={rating}
                    match={match}
                  />
                );
              })}
            </>
          ) : (
            <>
              {itemArray.map((key) => {
                return (
                  <HentaiInfoComponent
                    id={key}
                    key={key}
                    info={info[key]}
                    rating={ratings[key]}
                  />
                );
              })}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
