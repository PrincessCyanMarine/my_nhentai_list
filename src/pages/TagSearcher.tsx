import React, { useEffect, useState } from "react";
import { VscArrowDown, VscArrowLeft, VscArrowUp } from "react-icons/vsc";
import { Routing } from "./Popup";
import { Tag } from "../models/HentaiInfo";
import { getInfo } from "../helpers/chromeGetter";
import TagPresenter from "../components/TagPresenter";
import styles from "../sass/TagSearcher.module.scss";
import { useSyncedDefault } from "../hooks/useStorage";

// let url = `https://nhentai.net/search/?q=${}`
type CountedTag = Tag & { count: number };

export default () => {
  const [tags, setTags] = useState<Record<number, CountedTag>>({});
  useEffect(() => {
    let _tags: Record<number, CountedTag> = {};
    getInfo().then((info) => {
      for (let id in info) {
        for (let tag of info[id].tags) {
          if (!_tags[tag.id]) {
            _tags[tag.id] = { ...tag, count: 1 };
            continue;
          }
          _tags[tag.id].count++;
        }
      }
      setTags(_tags);
    });
  }, []);

  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const {
    _defaultValue: defaultSelectedTags,
    _setDefaultValue: setDefaultSelected,
    _loaded: defaultSelectedLoaded,
  } = useSyncedDefault<number[]>("defaultSelectedTags", []);

  useEffect(() => {
    if (!defaultSelectedLoaded) return;
    setSelectedTags(defaultSelectedTags);
  }, [defaultSelectedLoaded]);

  const selectTag = (id: number, exclusive = false) => {
    let tag = tags[id];
    setSelectedTags((s) => {
      if (exclusive && !s.includes(id))
        s = s.filter((t) => tags[t].type != tag.type);
      return s.includes(id) ? s.filter((t) => t != id) : [...s, id];
    });
  };

  const addTagToDefault = (id: number, exclusive = false) => {
    let tag = tags[id];
    setDefaultSelected((s) => {
      if (s.includes(id) == selectedTags.includes(id)) selectTag(id, exclusive);

      if (exclusive && !s.includes(id))
        s = s.filter((t) => tags[t].type != tag.type);
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
            readOnly
            type="text"
            value={selectedTags
              .map((id) => {
                let tag = tags[id];
                return `${tag.type}:"${tag.name}"`;
              })
              .join(" ")}
          />

          <a
            href={`https://nhentai.net/search/?q=${selectedTags
              .map((id) => {
                let tag = tags[id];
                return `${tag.type}%3A"${tag.name}"`;
              })
              .join("+")
              .replace(/ /g, "+")}${
              sortingSelected == 0
                ? ""
                : `&sort=popular${["-today", "-week", ""][sortingSelected - 1]}`
            }`}
            target="_blank"
          >
            <button>Search</button>
          </a>
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
            filter: (
              value: CountedTag,
              index: number,
              array: CountedTag[]
            ) => unknown;
            exclusive?: boolean;
          }[]
        ).map(({ name, defaultShown, filter, exclusive }) => {
          const [shown, setShown] = useState<boolean>(defaultShown);

          return Object.values(tags)
            .filter(filter)
            .sort((a, b) => b.count - a.count).length == 0 ? (
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
                  tags={Object.values(tags)
                    .filter(filter)
                    .sort((a, b) => b.count - a.count)}
                  tagClassName={styles.tag}
                  presenterClassName={styles.tag_presenter}
                  selected={selectedTags}
                  selectedClassName={styles.selected}
                  onClick={(tag) => {
                    // console.log(tag);
                    selectTag(tag.id, exclusive);
                  }}
                  onContextMenu={(tag, ev) => {
                    console.log(tag);
                    ev.preventDefault();
                    ev.stopPropagation();
                    setContextMenuPosition({
                      x: ev.pageX,
                      y: ev.pageY,
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
                    Favorite {contextMenuTag.name || "NO NAME FOUND"}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
};
