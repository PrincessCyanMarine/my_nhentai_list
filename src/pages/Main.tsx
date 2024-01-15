import React, { useContext, useEffect, useId, useRef, useState } from "react";
import { HentaiInfo, Tag } from "../models/HentaiInfo";
import { InfoList, RatingList } from "../models/RatingList";
import HentaiInfoComponent from "../components/HentaiInfoComponent";
import Fuse from "fuse.js";
import { VscSortPrecedence, VscClose, VscTag, VscGear } from "react-icons/vsc";
import updateChecker from "../components/updateChecker";
import {
  SORTING_FUNCTIONS,
  SortingFunction,
} from "../components/Sorting/Definitions";
import SortingSelector from "../components/Sorting/SortingSelector";
import { isWithinElementBounds } from "../helpers/HtmlHelper";
import { Routing } from "./Popup";
import { getInfo, getRatings, getTags } from "../helpers/chromeGetter";
import { InfoContext } from "../context/infoContext";
import { RatingsContext } from "../context/ratingsContext";
import { TagsContext } from "../context/tagsContext";
import { SortingContext } from "../context/sortingContext";
import { MyNHentaiListConfiguration } from "./ConfigPage";
import { useSyncedDefault } from "../hooks/useStorage";
import StatusSelector from "../components/StatusSelector";
import { createTabOnGroup } from "../helpers/tabHelper";

const OBSERVER_SKIP = 10;

export default () => {
  const { _value: CONFIG } = useSyncedDefault<
    Partial<MyNHentaiListConfiguration>
  >("configuration", {});
  // const [tags, setTags] = useState<Record<number, Tag>>({});
  // const [info, setInfo] = useState<InfoList | null>(null);
  // const [ratings, setRatings] = useState<RatingList | null>(null);
  const [itemsShown, setItemsShown] = useState<number>(OBSERVER_SKIP);

  const {
    forceSort,
    isSortingFunctionReverse,
    setForceSort,
    setIsSortingFunctionReverse,
    setSortingFunction,
    sortingFunction,
  } = useContext(SortingContext);
  const tags = useContext(TagsContext);
  const ratings = useContext(RatingsContext);
  const info = useContext(InfoContext);

  const [selected, setSelected] = useState<(number | string)[]>([]);

  const select = (id: number | string) => {
    if (id == -1) return;
    setSelected((s) => {
      if (s.includes(id)) return s.filter((i) => i != id);
      else return s.concat(id);
    });
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
    if (!info || !ratings) return;
    if (forceSort) {
      setForceSort(false);
      return;
    }
    setItemArray(
      sort(
        Object.keys(info)
          .concat(Object.keys(ratings))
          .filter((value, index, self) => self.indexOf(value) === index)
      )
    );
  }, [
    info,
    ratings,
    sortingFunction,
    forceSort,
    isSortingFunctionReverse,
    itemsShown,
  ]);

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

  const [search, setSearch] = useState<string>("");
  const [matches, setMatches] = useState<Fuse.FuseResult<HentaiInfo>[]>([]);
  // useDebug(matches);
  const [fuses, setFuse] = useState<Fuse<HentaiInfo>[]>([]);
  const [showSortingOptions, setShowSortingOptions] = useState<boolean>(false);
  const [messages, _setMessages] = useState<
    {
      message: string;
      disappearing: boolean;
      id: number;
    }[]
  >([]);

  useEffect(() => {
    setItemsShown(OBSERVER_SKIP);
  }, [matches, search, sortingFunction, isSortingFunctionReverse]);

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
          getFn: (obj) => {
            let _tags = obj.tags?.map((t) => tags[t]?.name) || [];
            return _tags;
          },
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

  // useEffect(() => {
  //   Promise.all([
  //     chrome.storage.sync.get("list"),
  //     chrome.storage.local.get("list"),
  //   ]).then(([sync, local]) => {
  //     console.log(sync);
  //     console.log(local);
  //     for (let id in sync["list"]) {
  //       console.log(id, sync["list"][id], local["list"][id]);
  //       local["list"][id] = sync["list"][id];
  //     }
  //     chrome.storage.local.set({ list: local["list"] });
  //     chrome.storage.sync.remove("list");
  //   });
  // }, []);

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

  const [observerTarget, setObserverTarget] =
    useState<React.RefObject<HTMLDivElement | null> | null>(null);
  useEffect(() => {
    if (!observerTarget) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setItemsShown((s) => s + OBSERVER_SKIP);
      }
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget]);

  const [statusFilter, setStatusFilter] = useState<
    HentaiInfo["status"] | "none" | undefined
  >(undefined);

  return (
    <div>
      <div id="topbar">
        <button onClick={() => setSearch("")} className="button">
          <VscClose />
        </button>
        <input
          id="search-bar"
          value={search}
          onInput={(ev) => setSearch(ev.currentTarget.value)}
        />
        <button
          className="button"
          onClick={() => {
            Routing.goTo("/config");
          }}
        >
          <VscGear />
        </button>
        <button
          className="button"
          onClick={() => {
            Routing.goTo("/tags");
          }}
        >
          <VscTag />
        </button>
        <button
          className="button"
          onClick={() => setShowSortingOptions((s) => !s)}
        >
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
                  // if (!json["info"]) json["info"] = {};
                  // if (!json["list"]) json["list"] = {};
                  // if (
                  //   ((info && Object.keys(info).length > 0) ||
                  //     (ratings && Object.keys(ratings).length > 0)) &&
                  //   !confirm(
                  //     "Are you sure you want to import? (all of your current saved info will be lost)"
                  //   )
                  // )
                  //   return;
                  // if (!json["tags"]) json["tags"] = {};
                  if (!json["local"]) json["local"] = {};
                  if (!json["sync"]) json["sync"] = {};
                  // for (let i in json["info"]) {
                  //   let item = json["info"][i];
                  //   for (let id in item.tags) {
                  //     let tag = item.tags[id];
                  //     if (typeof tag == "number") continue;
                  //     json["tags"][id] = tag;
                  //     json["info"][i].tags[id] = tag;
                  //   }
                  // }
                  // chrome.storage.local.set({
                  //   info: { ...info, ...json["info"] },
                  //   list: { ...ratings, ...json["list"] },
                  //   tags: { ...tags, ...json["tags"] },
                  // });
                  function merge<T>(a: T, b: T): T {
                    console.log("merging", a, b);
                    let _merge = (a: any, b: any) => {
                      if (typeof a != "object" || typeof b != "object")
                        return b;
                      if (Array.isArray(a) && Array.isArray(b)) {
                        let _a = [...a];
                        _a = _a.concat(b);
                        _a = _a.filter((v, i, self) => self.indexOf(v) === i);
                        return _a;
                      }
                      let _a = { ...a };
                      for (let key in b) _a[key] = _merge(a[key], b[key]);

                      return _a;
                    };
                    let res = _merge(a, b);
                    console.log("merged", res);
                    return res;
                  }
                  let mergeStorage = async (type: "sync" | "local") => {
                    console.log(type);
                    let storage = await chrome.storage[type].get();
                    console.log(type, storage);
                    await chrome.storage[type].set(merge(storage, json[type]));
                  };
                  Promise.all([
                    mergeStorage("sync"),
                    mergeStorage("local"),
                  ]).then(() => {
                    location.reload();
                  });
                };
                reader.readAsText(file);
              });
              fileSelector.click();
            }}
            className="save-button"
          >
            IMPORT
          </button>
          <button
            onClick={() => {
              // getInfo().then((info) => {
              //   let _info = { ...info };
              //   getRatings().then((ratings) => {
              //     let json = JSON.stringify({
              //       info: _info,
              //       list: ratings,
              //       tags,
              //     });
              //     let blob = new Blob([json], { type: "application/json" });
              //     let url = URL.createObjectURL(blob);
              //     let a = document.createElement("a");
              //     a.href = url;
              //     a.download = `my-nhentai-list-${Date.now()}.json`;
              //     a.click();
              //   });
              // });
              chrome.storage.local.get().then((local) => {
                chrome.storage.sync.get().then((sync) => {
                  let json = JSON.stringify({
                    local,
                    sync,
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
            className="save-button"
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
              // chrome.storage.local.remove("info");
              // chrome.storage.local.remove("list");
              // chrome.storage.local.remove("tags");
              chrome.storage.local.clear();
              chrome.storage.sync.clear();
              location.reload();
            }}
            className="save-button"
          >
            CLEAR
          </button>
        </div>
        <div id="status-selector-container">
          <StatusSelector
            // className={styles.status}
            onChange={(status) => setStatusFilter(status as any)}
            selected={statusFilter}
            extra={[["none", "NONE"]]}
          />
        </div>
        <div id="titles_list">
          {info && ratings && (
            <>
              {search.length > 0 ? (
                <>
                  {matches
                    .filter((t) => {
                      if (!statusFilter) return true;
                      if (statusFilter == "none") return !t.item.status;
                      return t.item.status == statusFilter;
                    })
                    .slice(0, itemsShown)
                    .map((match, index) => {
                      const info = match.item;
                      const key = info.id;
                      const rating = ratings?.[key];
                      return (
                        <HentaiInfoComponent
                          CONFIG={CONFIG}
                          allTags={tags}
                          id={key}
                          key={key}
                          info={info}
                          rating={rating}
                          match={match}
                          select={select}
                          selected={selected.includes(key)}
                          setRef={
                            index == itemsShown - 1
                              ? setObserverTarget
                              : undefined
                          }
                        />
                      );
                    })}
                </>
              ) : (
                <>
                  {itemArray
                    .filter((t) => {
                      if (!statusFilter) return true;
                      if (statusFilter == "none") return !info?.[t]?.status;
                      return info?.[t]?.status == statusFilter;
                    })
                    .slice(0, itemsShown)
                    .map((key, index) => {
                      return (
                        <HentaiInfoComponent
                          CONFIG={CONFIG}
                          allTags={tags}
                          id={key}
                          key={key}
                          info={info?.[key]}
                          rating={ratings?.[key]}
                          select={select}
                          selected={selected.includes(key)}
                          setRef={
                            index == itemsShown - 1
                              ? setObserverTarget
                              : undefined
                          }
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
            onClick={async () => {
              let links = selected.map((id) => `https://nhentai.net/g/${id}/`);
              setSelected([]);
              let currentTab = await chrome.tabs.getCurrent();
              for (let url of links)
                await createTabOnGroup({ url }, currentTab);
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
