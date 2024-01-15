import React, { useContext, useEffect, useRef, useState } from "react";
import { VscArrowDown, VscArrowLeft, VscArrowUp } from "react-icons/vsc";
import { Routing } from "./Popup";
import { Tag } from "../models/HentaiInfo";
import { getInfo, getTags } from "../helpers/chromeGetter";
import TagPresenter from "../components/TagPresenter";
import styles from "../sass/TagSearcher.module.scss";
import { useSyncedDefault } from "../hooks/useStorage";
import { TagsContext } from "../context/tagsContext";
import { InfoContext } from "../context/infoContext";
import { RatingsContext } from "../context/ratingsContext";
import Fuse from "fuse.js";
import { createTabOnGroup } from "../helpers/tabHelper";
// import { useDebug } from "../helpers/useDebug";

// let url = `https://nhentai.net/search/?q=${}`
// type Tag = Tag & { count: number };

export default () => {
  const tags = useContext(TagsContext);
  const info = useContext(InfoContext);

  const [count, setCount] = useState<Record<number, number>>({});
  const [sortingFunction, setSortingFunction] = useState<number>(0);

  const sortTags = (tags: Tag[] | undefined) => {
    const byCount = (a: Tag, b: Tag) => count[b.id] - count[a.id];
    const byName = (a: Tag, b: Tag) => a.name.localeCompare(b.name);

    const _sort = () => {
      if (!tags) return tags;
      switch (sortingFunction) {
        case 0:
          return tags.sort(byCount);
        case 1:
          return tags.sort(byName);
        case 2:
          return tags.sort(byCount).reverse();
        case 3:
          return tags.sort(byName).reverse();
        default:
          return tags.sort(byCount);
      }
    };
    return _sort()
      ?.sort((a, b) => {
        if (selectedTags.includes(a.id) == selectedTags.includes(b.id))
          return 0;
        return selectedTags.includes(a.id) ? -1 : 1;
      })
      .sort((a, b) => {
        if (
          defaultSelectedTags.includes(a.id) ==
          defaultSelectedTags.includes(b.id)
        )
          return 0;
        return defaultSelectedTags.includes(a.id) ? -1 : 1;
      })
      .sort((a, b) => {
        if (favoriteTags.includes(a.id) == favoriteTags.includes(b.id))
          return 0;
        return favoriteTags.includes(a.id) ? -1 : 1;
      });
  };

  useEffect(() => {
    if (
      !info ||
      !tags ||
      Object.keys(info).length == 0 ||
      Object.keys(tags).length == 0
    )
      return;
    let _count: Record<number, number> = {};
    Object.values(info).forEach((i) => {
      i.tags?.forEach((t) => {
        _count[t] = (_count[t] || 0) + 1;
      });
      setCount(_count);
    });
  }, [info, tags]);

  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [excludedTags, setExcludedTags] = useState<number[]>([]);

  const {
    _defaultValue: defaultSelectedTags,
    _setDefaultValue: setDefaultSelected,
    _loaded: defaultSelectedLoaded,
  } = useSyncedDefault<number[]>("defaultSelectedTags", []);

  const [sortingFunctionLoaded, setSortingFunctionLoaded] = useState(false);
  useEffect(() => {
    chrome.storage.sync
      .get("tagSortingFuntion")
      .then((s) => setSortingFunction(s.tagSortingFuntion || 0));
    setSortingFunctionLoaded(true);
  }, []);

  useEffect(() => {
    if (!defaultSelectedLoaded) return;
    (async () => {
      let _selectedTags = (
        await chrome.storage.sync.get("currentlySelectedTags")
      )?.["currentlySelectedTags"];
      let _excludedTags = (
        await chrome.storage.sync.get("currentlyExcludedTags")
      )?.["currentlyExcludedTags"];
      // console.log("loaded tags", _selectedTags, _excludedTags);
      setSelectedTags(_selectedTags ? _selectedTags : defaultSelectedTags);
      setExcludedTags(_excludedTags ? _excludedTags : []);
    })();
  }, [defaultSelectedLoaded]);

  useEffect(() => {
    if (!sortingFunctionLoaded) return;
    chrome.storage.sync.set({ tagSortingFuntion: sortingFunction });
  }, [sortingFunction, sortingFunctionLoaded]);

  useEffect(() => {
    if (!defaultSelectedLoaded) return;
    (async () => {
      await chrome.storage.sync.set({
        currentlySelectedTags: selectedTags,
      });
      await chrome.storage.sync.set({
        currentlyExcludedTags: excludedTags,
      });
    })();

    // console.log("saved tags", selectedTags, excludedTags);
  }, [selectedTags, excludedTags, defaultSelectedLoaded]);

  const selectTag = (id: number, exclusive = false) => {
    // console.log("selecting tag", id);
    let tag = tags[id];
    // console.log(tags);
    if (!tag) return;
    setSelectedTags((s) => {
      if (exclusive && !s.includes(id))
        s = s.filter((t) => tags[t].type != tag!.type);
      let excluded = excludedTags.includes(id);
      if (s.includes(id))
        setExcludedTags((s) => {
          return excluded ? s.filter((t) => t != id) : [...s, id];
        });
      return s.includes(id)
        ? excluded
          ? s.filter((t) => t != id)
          : s
        : [...s, id];
    });
  };

  const deselectTag = (id: number) => {
    setSelectedTags((s) => {
      return s.filter((t) => t != id);
    });
    setExcludedTags((s) => {
      return s.filter((t) => t != id);
    });
  };

  const addTagToDefault = (id: number, exclusive = false) => {
    let tag = tags[id];
    if (!tag) return;
    setDefaultSelected((s) => {
      if (s.includes(id) == selectedTags.includes(id)) {
        if (s.includes(id)) deselectTag(id);
        else selectTag(id, exclusive);
      }

      if (exclusive && !s.includes(id))
        s = s.filter((t) => tags[t].type != tag!.type);
      return s.includes(id) ? s.filter((t) => t != id) : [...s, id];
    });
  };
  useEffect(() => {}, []);

  const { _value: favoriteTags, _setDefaultValue: setFavoriteTags } =
    useSyncedDefault<number[]>("favoriteTags", []);

  const {
    _value: sortingSelected,
    _setValue: setSortingSelected,
    _defaultValue: defaultTagSorting,
    _setDefaultValue: setDefaultSorting,
  } = useSyncedDefault<number>("defaultTagSorting", 0);

  const [contextMenuShown, setContextMenuShown] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuTag, setContextMenuTag] = useState<Tag | null>(null);
  useEffect(() => {
    const _f = (ev: MouseEvent) => {
      if (ev.button != 2) {
        setContextMenuShown(false);
        setContextMenuTag(null);
      }
    };
    window.addEventListener("click", _f);
    return () => window.removeEventListener("click", _f);
  }, []);

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [filteredTags, setFilteredTags] = useState<Fuse.FuseResult<Tag>[]>();

  useEffect(() => {
    let fuse = new Fuse(Object.values(tags), {
      keys: ["name"],
      includeMatches: true,
    });
    setFilteredTags(() => fuse.search(tagFilter));
  }, [tagFilter]);
  // useDebug(filteredTags);

  return (
    <div>
      <div id="topbar">
        <button
          style={{
            width: "100%",
            textAlign: "left",
          }}
          onClick={() => {
            Routing.goTo("/");
          }}
        >
          <VscArrowLeft />
        </button>
      </div>
      <main>
        <div className={styles.searchBar}>
          <input
            style={{
              cursor: "text",
              pointerEvents: "all",
            }}
            type="text"
            value={tagFilter}
            onChange={(ev) => {
              setTagFilter(ev.target.value);
            }}
          />
          <button onClick={() => setTagFilter("")}>CLEAR</button>
          {tagFilter && filteredTags && (
            <div>
              <TagPresenter
                tags={filteredTags.map((t) => t.item)}
                tagClassName={styles.tag}
                presenterClassName={styles.filtered_tag_presenter}
                selected={selectedTags}
                selectedClassName={(tag) =>
                  `${styles.selected}${
                    excludedTags.includes(tag.id) ? ` ${styles.excluded}` : ""
                  }`
                }
                onClick={(tag) => {
                  // console.log(tag);
                  selectTag(tag.id);
                }}
                onContextMenu={(tag, ev) => {
                  // console.log(tag);
                  ev.preventDefault();
                  ev.stopPropagation();

                  setContextMenuPosition({
                    x:
                      document.body.clientWidth - ev.pageX < 200
                        ? ev.pageX - 200
                        : ev.pageX,
                    y:
                      document.body.clientHeight - ev.pageY < 96
                        ? ev.pageY - 96
                        : ev.pageY,
                  });
                  setContextMenuShown(true);
                  setContextMenuTag(tag);
                }}
                textHighlighter={(tag) => {
                  function textHighlighter(text: string) {
                    if (!tag) return "";
                    const matches = filteredTags?.find(
                      (m) => m.item.id == tag.id
                    )?.matches;
                    if (!matches || matches.length == 0) return text;
                    let result = "";
                    let last = 0;
                    for (const match of matches) {
                      if (match.value != text) continue;
                      for (const index of match.indices) {
                        result += text.slice(last, index[0]);
                        result += `<span class="${styles.highlight}">`;
                        result += text.slice(index[0], index[1] + 1);
                        result += "</span>";
                        last = index[1] + 1;
                      }
                    }
                    result += text.slice(last);
                    return (
                      <span dangerouslySetInnerHTML={{ __html: result }} />
                    );
                  }

                  return (
                    <>
                      {tag?.id && favoriteTags.includes(tag.id) && (
                        <span className={styles.favorite}>★</span>
                      )}{" "}
                      {tag?.id && defaultSelectedTags.includes(tag.id) && (
                        <span className={styles.decoration}>◆</span>
                      )}{" "}
                      {(tag?.name ? textHighlighter(tag.name) : undefined) ||
                        "NO NAME FOUND"}
                    </>
                  );
                }}
              />
            </div>
          )}
        </div>
        <div className={styles.searchBar}>
          <input
            readOnly
            disabled
            type="text"
            value={selectedTags
              .map((id) => {
                let tag = tags[id];
                if (!tag) return "";
                return `${excludedTags.includes(tag.id) ? "-" : ""}${
                  tag.type
                }:"${tag.name}"`;
              })
              .join(" ")}
          />

          <a
            onClick={async () => {
              await createTabOnGroup(
                {
                  url: `https://nhentai.net/search/?q=${selectedTags
                    .map((id) => {
                      let tag = tags[id];
                      if (!tag) return "";
                      return `${excludedTags.includes(tag.id) ? "-" : ""}${
                        tag.type
                      }%3A"${tag?.name}"`;
                    })
                    .join("+")
                    .replace(/ /g, "+")}${
                    sortingSelected == 0
                      ? ""
                      : `&sort=popular${
                          ["-today", "-week", ""][sortingSelected - 1]
                        }`
                  }`,
                  active: true,
                },
                await chrome.tabs.getCurrent()
              );
            }}
          >
            <button>Search</button>
          </a>
          <button
            onClick={() => {
              setSelectedTags(defaultSelectedTags);
              setExcludedTags([]);
            }}
          >
            Clear
          </button>
        </div>

        <TagPresenter
          tags={[
            {
              id: 0,
              name: "Recent",
              type: "sorting",
            },
            {
              id: 1,
              name: "Popular - Today",
              type: "sorting",
            },
            {
              id: 2,
              name: "Popular - Week",
              type: "sorting",
            },
            {
              id: 3,
              name: "Popular - All time",
              type: "sorting",
            },
          ]}
          textHighlighter={(tag) => {
            return (
              <>
                {defaultTagSorting == tag?.id && (
                  <span className={styles.decoration}>◆</span>
                )}{" "}
                {tag?.name || "NO NAME FOUND"}
              </>
            );
          }}
          tagClassName={styles.tag}
          presenterClassName={styles.sorting_presenter}
          selected={[sortingSelected]}
          selectedClassName={styles.selected}
          onClick={(tag) => {
            setSortingSelected(tag.id);
          }}
          onContextMenu={(tag, ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            setDefaultSorting(tag.id);
          }}
        />

        <div
          style={{
            marginTop: "1rem",
          }}
        >
          <h1
            style={{
              marginLeft: "8px",
            }}
          >
            Sort tags by
          </h1>
          <TagPresenter
            tags={[
              {
                id: 0,
                name: "Count 9->1",
                type: "sorting",
              },
              {
                id: 1,
                name: "Name A->Z",
                type: "sorting",
              },
              {
                id: 2,
                name: "Count 1->9",
                type: "sorting",
              },
              {
                id: 3,
                name: "Name Z->A",
                type: "sorting",
              },
            ]}
            tagClassName={styles.tag}
            presenterClassName={styles.sorting_presenter}
            selectedClassName={styles.selected}
            selected={[sortingFunction]}
            onClick={(tag) => {
              setSortingFunction(tag.id);
            }}
            onContextMenu={(tag, ev) => {
              ev.preventDefault();
              ev.stopPropagation();
            }}
          />
        </div>

        {(
          [
            {
              name: "Favorites",
              defaultShown: true,
              filter: (t) => favoriteTags.includes(t.id),
              exclusive: false,
            },
            {
              name: "Languages",
              defaultShown: false,
              filter: (t) => t.type == "language",
              exclusive: false,
            },
            {
              name: "Tags",
              defaultShown: false,
              filter: (t) => t.type == "tag",
            },
            {
              name: "Artists",
              defaultShown: false,
              filter: (t) => t.type == "artist",
            },
            {
              name: "Groups",
              defaultShown: false,
              filter: (t) => t.type == "group",
            },
            {
              name: "Categories",
              defaultShown: false,
              filter: (t) => t.type == "category",
            },
            {
              name: "Parodies",
              defaultShown: false,
              filter: (t) => t.type == "parody",
            },
            {
              name: "Characters",
              defaultShown: false,
              filter: (t) => t.type == "character",
            },
          ] as {
            name: string;
            defaultShown: boolean;
            filter: (value: Tag, index: number, array: Tag[]) => boolean;
            exclusive?: boolean;
          }[]
        ).map(({ name, defaultShown, filter, exclusive }) => {
          const [shown, setShown] = useState<boolean>(defaultShown);

          return (
            tags &&
            (Object.values(tags).filter(filter).length == 0 ? (
              <div key={name} />
            ) : (
              <div key={name}>
                <div
                  onClick={() => setShown((s) => !s)}
                  className={styles.contentHider}
                >
                  {name} {shown ? <VscArrowUp /> : <VscArrowDown />}
                </div>
                {shown && (
                  <TagPresenter
                    tags={sortTags(Object.values(tags).filter(filter))}
                    tagClassName={styles.tag}
                    presenterClassName={styles.tag_presenter}
                    selected={selectedTags}
                    selectedClassName={(tag) =>
                      `${styles.selected}${
                        excludedTags.includes(tag.id)
                          ? ` ${styles.excluded}`
                          : ""
                      }`
                    }
                    onClick={(tag) => {
                      // console.log(tag);
                      selectTag(tag.id, exclusive);
                    }}
                    onContextMenu={(tag, ev) => {
                      // console.log(tag);
                      ev.preventDefault();
                      ev.stopPropagation();

                      setContextMenuPosition({
                        x:
                          document.body.clientWidth - ev.pageX < 200
                            ? ev.pageX - 200
                            : ev.pageX,
                        y:
                          document.body.clientHeight - ev.pageY < 96
                            ? ev.pageY - 96
                            : ev.pageY,
                      });
                      setContextMenuShown(true);
                      setContextMenuTag(tag);
                    }}
                    textHighlighter={(tag) => {
                      return (
                        <>
                          {tag?.id && favoriteTags.includes(tag.id) && (
                            <span className={styles.favorite}>★</span>
                          )}{" "}
                          {tag?.id && defaultSelectedTags.includes(tag.id) && (
                            <span className={styles.decoration}>◆</span>
                          )}{" "}
                          {tag?.name || "NO NAME FOUND"}
                        </>
                      );
                    }}
                  />
                )}
                {contextMenuShown && contextMenuTag && (
                  <div
                    ref={contextMenuRef}
                    style={{
                      position: "absolute",
                      top: contextMenuPosition.y,
                      left: contextMenuPosition.x,
                    }}
                    className={styles.contextMenu}
                  >
                    <a
                      onClick={() => {
                        addTagToDefault(contextMenuTag.id, exclusive);
                      }}
                    >
                      {defaultSelectedTags.includes(contextMenuTag.id)
                        ? "Remove"
                        : "Add"}{" "}
                      {contextMenuTag.name || "NO NAME FOUND"} as a default tag
                    </a>
                    <a
                      onClick={() => {
                        setFavoriteTags((s) => {
                          return s.includes(contextMenuTag.id)
                            ? s.filter((t) => t != contextMenuTag.id)
                            : [...s, contextMenuTag.id];
                        });
                      }}
                    >
                      {favoriteTags.includes(contextMenuTag.id)
                        ? "Unfavorite"
                        : "Favorite"}{" "}
                      {contextMenuTag.name || "NO NAME FOUND"}
                    </a>
                  </div>
                )}
              </div>
            ))
          );
        })}
      </main>
    </div>
  );
};
