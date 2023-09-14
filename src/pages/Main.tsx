import React, { useEffect, useId, useState } from "react";
import { HentaiInfo, Tag } from "../models/HentaiInfo";
import { InfoList, RatingList } from "../models/RatingList";
import HentaiInfoComponent from "../components/HentaiInfoComponent";
import Fuse from "fuse.js";
import { VscSortPrecedence, VscClose, VscTag } from "react-icons/vsc";
import updateChecker from "../components/updateChecker";
import {
  SORTING_FUNCTIONS,
  SortingFunction,
} from "../components/Sorting/Definitions";
import SortingSelector from "../components/Sorting/SortingSelector";
import { isWithinElementBounds } from "../helpers/HtmlHelper";
import { Routing } from "./Popup";
import { getInfo, getRatings, getTags } from "../helpers/chromeGetter";

export default () => {
  const [info, setInfo] = useState<InfoList | null>(null);
  const [ratings, setRatings] = useState<RatingList | null>(null);
  const [selected, setSelected] = useState<(number | string)[]>([]);

  const select = (id: number | string) => {
    if (id == -1) return;
    setSelected((s) => {
      if (s.includes(id)) return s.filter((i) => i != id);
      else return s.concat(id);
    });
  };

  const [sortingFunction, _setSortingFunction] = useState<SortingFunction>(
    SORTING_FUNCTIONS[0]
  );
  const [isSortingFunctionReverse, setIsSortingFunctionReverse] =
    useState<boolean>(false);
  const [sortingFunctionLoaded, setSortingFunctionLoaded] =
    useState<boolean>(false);

  useEffect(() => {
    if (sortingFunctionLoaded || !ratings || !info) return;
    chrome.storage.local.get("sortingFunction", (data) => {
      setSortingFunctionLoaded(true);
      if (!data || !data["sortingFunction"]) return;

      let funcName = data["sortingFunction"];
      if (funcName.endsWith("Reverse")) {
        funcName = funcName.slice(0, -7);
        setIsSortingFunctionReverse(true);
      } else setIsSortingFunctionReverse(false);
      for (let func of SORTING_FUNCTIONS) {
        if (func.name == funcName) {
          setSortingFunction(func);
          return;
        }
      }
    });
  }, [ratings, info, sortingFunctionLoaded, isSortingFunctionReverse]);

  useEffect(() => {
    // console.log(sortingFunction.name);
    if (!sortingFunctionLoaded) return;
    let funcName =
      sortingFunction.name + (isSortingFunctionReverse ? "Reverse" : "");
    chrome.storage.local.set({ sortingFunction: funcName });
  }, [sortingFunction, sortingFunctionLoaded]);

  const setSortingFunction = (func: SortingFunction) => {
    _setSortingFunction(() => func);
    setIsSortingFunctionReverse(false);
    // setShowSortingOptions(false);
    if (func.forceSort) setForceSort(true);
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
  const [forceSort, setForceSort] = useState<boolean>(false);

  useEffect(() => {
    if (forceSort) {
      setForceSort(false);
      return;
    }
    if (!info || !ratings) return;
    setItemArray(
      sort(
        Object.keys(info)
          .concat(Object.keys(ratings))
          .filter((value, index, self) => self.indexOf(value) === index)
      )
    );
  }, [info, ratings, sortingFunction, forceSort, isSortingFunctionReverse]);

  function sort(ids: string[]) {
    if (!sortingFunction) return ids;
    return ids.sort((a, b) => {
      let res = sortingFunction.fun({
        a,
        b,
        info,
        ratings,
        reversed: isSortingFunctionReverse,
      });
      if (isSortingFunctionReverse) res = -res;
      return res;
    });
  }

  useEffect(() => {
    getInfo().then(setInfo);
    chrome.storage.local.onChanged.addListener(async (changes) => {
      let tags = await getTags();
      if (changes["info"]) {
        let _info = changes["info"].newValue;
        for (let i in _info) {
          let item = _info[i];
          for (let id in item.tags) {
            let tag = item.tags[id];
            if (typeof tag != "number") continue;
            _info[i].tags[id] = tags[tag];
          }
        }
        setInfo(_info);
      }
    });
  }, []);

  useEffect(() => {
    getRatings().then(setRatings);
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes["list"]) setRatings(changes["list"].newValue);
    });
  }, []);

  const [search, setSearch] = useState<string>("");
  const [matches, setMatches] = useState<Fuse.FuseResult<HentaiInfo>[]>([]);
  const [fuses, setFuse] = useState<Fuse<HentaiInfo>[]>([]);
  const [showSortingOptions, setShowSortingOptions] = useState<boolean>(false);
  const [messages, _setMessages] = useState<
    {
      message: string;
      disappearing: boolean;
      id: number;
    }[]
  >([]);

  const [messageId, setMessageId] = useState<number>(0);

  const addMessage = (message: string) => {
    message = message.trim();
    let id = messageId;
    _setMessages((m) => {
      m.unshift({ message, disappearing: false, id });
      // m = m.map((msg, i) => {
      //   if (i < 5) return msg;
      //   setTimeout(() => {
      //     _setMessages((m) => m.filter((_msg) => _msg.id != msg.id));
      //   }, 500);
      //   return { ...msg, disappearing: true, disappearTime: "0.1s" };
      // });
      return m.filter((_m) => !_m.disappearing).slice(0, 5);
    });
    setMessageId((id) => id + 1);
    setTimeout(() => {
      _setMessages((m) => {
        let _m = [...m];
        let pos = _m.findIndex((_msg) => _msg.id == id);
        if (pos == -1) return _m;
        _m[pos].disappearing = true;
        return _m;
      });
      setTimeout(() => {
        _setMessages((m) => m.filter((_msg) => _msg.id != id));
      }, 500);
    }, 1000);
  };

  useEffect(() => {
    if (!info) return;
    let toSearch = sort(Object.keys(info)).map((key) => info[key]);
    let options = {
      includeMatches: true,
      shouldSort: false,
      isCaseSensitive: false,
      includeScore: true,
    };
    setFuse([
      new Fuse(
        toSearch.filter((i) => !!i),
        {
          ...options,
          keys: ["title.pretty"],
        }
      ),
      new Fuse(
        toSearch.filter((i) => !!i),
        {
          ...options,
          keys: ["tags.name"],
          threshold: 0.3,
        }
      ),
      new Fuse(
        toSearch.filter((i) => !!i),
        {
          ...options,
          keys: ["id"],
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
  }, [sortingFunction, search]);

  useEffect(() => {
    updateChecker();
  }, []);

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
        <button
          onClick={() => {
            Routing.goTo("/tags");
          }}
        >
          <VscTag />
        </button>
        <button onClick={() => setShowSortingOptions((s) => !s)}>
          <VscSortPrecedence />
        </button>
        {showSortingOptions && (
          <SortingSelector
            isSortingFunctionReverse={isSortingFunctionReverse}
            setSortingFunction={setSortingFunction}
            sortingFunction={sortingFunction}
            setIsSortingFunctionReverse={setIsSortingFunctionReverse}
          />
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
                  if (!json["tags"]) json["tags"] = {};
                  for (let i in json["info"]) {
                    let item = json["info"][i];
                    for (let id in item.tags) {
                      let tag = item.tags[id];
                      if (typeof tag == "number") continue;
                      json["tags"][id] = tag;
                      json["info"][i].tags[id] = tag;
                    }
                  }
                  chrome.storage.local.set({
                    info: json["info"],
                    list: json["list"],
                    tags: json["tags"],
                  });
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
                let _info = { ...info };
                getRatings().then((ratings) => {
                  let tags: Record<number, Tag> = {};

                  for (let i in _info) {
                    let item = _info[i];
                    for (let tag of item.tags) {
                      // console.log(tag);
                      tags[tag.id] = tag;
                    }
                    _info[i].tags = _info[i].tags.map((t) => t.id) as any;
                  }

                  let json = JSON.stringify({
                    info: _info,
                    list: ratings,
                    tags,
                  });
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
              chrome.storage.local.remove("list");
              chrome.storage.local.remove("tags");
              location.reload();
            }}
          >
            CLEAR
          </button>
        </div>
        <div id="titles_list">
          {info && ratings && (
            <>
              {search.length > 0 ? (
                <>
                  {matches.map((match) => {
                    const info = match.item;
                    const key = info.id;
                    const rating = ratings?.[key];
                    return (
                      <HentaiInfoComponent
                        id={key}
                        key={key}
                        info={info}
                        rating={rating}
                        match={match}
                        select={select}
                        selected={selected.includes(key)}
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
                        info={info?.[key]}
                        rating={ratings?.[key]}
                        select={select}
                        selected={selected.includes(key)}
                      />
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </main>
      {selected.length > 0 && (
        <div id="selected">
          <button
            onClick={() => {
              if (
                !confirm(
                  "Are you sure you want to delete all of the selected hentai's information?"
                )
              )
                return;
              chrome.storage.local.get("info", (data) => {
                let _info = data["info"] || {};
                for (let id of selected) {
                  delete _info[id];
                }
                chrome.storage.local.set({ info: _info });
              });
              chrome.storage.local.get("list", (data) => {
                let _list = data["list"] || {};
                for (let id of selected) {
                  delete _list[id];
                }
                chrome.storage.local.set({ list: _list });
              });
              setSelected([]);
            }}
          >
            DELETE
          </button>
          <button
            onClick={() => {
              let links = selected.map((id) => `https://nhentai.net/g/${id}/`);
              let text = links.join("\n");
              navigator.clipboard.writeText(text);
              addMessage("Copied links to clipboard");
            }}
          >
            LINKS
          </button>
          <button
            onClick={() => {
              let text = selected.join("\n");
              navigator.clipboard.writeText(text);
              addMessage("Copied ids to clipboard");
            }}
          >
            IDS
          </button>
          <button
            onClick={() => {
              let links = selected.map((id) => `https://nhentai.net/g/${id}/`);
              setSelected([]);
              for (let link of links) {
                window.open(link, "_blank");
              }
            }}
          >
            OPEN
          </button>
          <button
            onClick={() => {
              setSelected([]);
            }}
          >
            CANCEL
          </button>
        </div>
      )}
      {messages && (
        <div id="messages">
          {messages.map(({ message, disappearing }, i) => (
            <div
              className={"message" + (disappearing ? " disappearing" : "")}
              key={i}
            >
              {message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
