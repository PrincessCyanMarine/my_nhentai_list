import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tag } from "../../models/HentaiInfo";
import { MyNHentaiListConfiguration } from "../../pages/ConfigPage";
import { useSubscription } from "../../hooks/useSubscription";
import { Slider } from "@mui/material";

const SHOWN_SKIP = 10;
const MAX_PAGES = 800;

export default () => {
  const [shift, setShift] = useState(false);
  const [multipleSelected, setMultipleSelected] = useState<Tag[]>([]);

  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(SHOWN_SKIP);
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const [selected, setSelected] = useState(0);
  const [inputValue, setInputValue] = useState("");
  // useDebug(inputValue);

  const inputRef = useRef<HTMLInputElement>(null);
  const autoCompleteRef = useRef<HTMLDivElement>(null);
  const observerdElementRef = useRef<HTMLDivElement>(null);
  const tags = useSubscription<Record<number, Tag>>({}, "local", "tags");
  const CONFIG = useSubscription<Partial<MyNHentaiListConfiguration>>(
    {},
    "sync",
    "configuration"
  );
  const [filteredTags, setFilteredTags] = useState<Tag[]>(
    Object.values(tags).map((t) => t as Tag)
  );
  let getSearchingFor = () => {
    let tagArray = Object.values(tags);
    let searchingFor =
      (
        searchParams
          .get("q")
          ?.match(/[\S]+?:".+?"|[\S]+?:[\S]+|\"[\S\s]+\"|[\S]+/g)
          ?.map((s) =>
            s.match(/.+\:.+/)
              ? s.split(":").map((s) => s.replace(/"/g, ""))
              : [undefined, s.replace(/"/g, "")]
          ) as unknown as [string | undefined, string][]
      )?.map(([type, name]) => {
        let id = tagArray.find((t) => {
          if (!type) return false;
          return t.type == type && t.name == name;
        })?.id;
        return [type, name, id] as const;
      }) || [];

    return searchingFor;
  };
  const tagArray = useMemo<Tag[]>(() => {
    let tagArray = Object.values(tags)
      .map((t) => t)
      .sort((a, b) => {
        if (a.type == b.type) return 0;
        let dict = [
          "language",
          "tag",
          "artist",
          "category",
          "parody",
          "character",
          "group",
        ];
        let value = (c: Tag) => dict.findIndex((s) => s == c.type) + 1 || 8;
        return value(a) - value(b);
      });
    let searchingFor = getSearchingFor().map(([type, name]) => {
      let res = tagArray.findIndex(
        (tag) => tag.type == type && tag.name == name
      );
      // console.log("Searching for", res);
      if (res > -1) return { ...tagArray[res] };
      res = tagArray.findIndex(
        (tag) => "-" + tag.type == type && tag.name == name
      );
      // console.log("Searching for -", res);
      if (res > -1) {
        let tag = { ...tagArray[res] };
        tag.id = -tag.id;
        return tag;
      }
      return {
        id: 0,
        type,
        name,
      };
    });
    tagArray = tagArray.map((t) => {
      return !(
        searchingFor &&
        searchingFor.find(
          (s) =>
            s.id == t.id ||
            s.id == -t.id ||
            (s.name == t.name && s.type == t.type)
        )
      )
        ? t
        : {
            type: t.type,
            id: -t.id,
            name: "-" + t.name,
          };
    });
    return tagArray;
  }, [tags]);

  let searchForm = document.getElementsByClassName(
    "search"
  )[0] as HTMLFormElement;
  let searchBar = searchForm.children[0] as HTMLInputElement;
  // searchBar.value = "";
  // searchBar.placeholder = "Search for tags";
  // searchBar.autocomplete = "off";
  useEffect(() => {
    // console.log(
    //   !CONFIG,
    //   CONFIG["noCustomAutoComplete"],
    //   CONFIG["noCustomSearchBar"],
    //   CONFIG
    // );
    if (
      !CONFIG ||
      CONFIG["noCustomAutoComplete"] ||
      CONFIG["noCustomSearchBar"]
    )
      return;

    let preventer = (ev: Event) => {
      ev.preventDefault();
      ev.stopPropagation();
    };

    searchForm.addEventListener("submit", preventer);
    return () => searchForm.removeEventListener("submit", preventer);
  }, [CONFIG]);

  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [advancedOptionsFilter, setAdvancedOptionsFilter] = useState("");

  useEffect(() => {
    if (advancedSearch) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
  }, [advancedSearch]);

  useEffect(() => {
    if (CONFIG["noCustomAutoComplete"]) {
      setFilteredTags([]);
      return;
    }
    setFilteredTags(() => {
      let filtered = tagArray;
      let _inputValue = advancedSearch ? advancedOptionsFilter : inputValue;
      if (_inputValue.trim())
        if (_inputValue.match(/^[^:]*:[^:]*$/)) {
          let [type, name] = _inputValue.split(":");
          filtered = filtered.filter((t) => {
            return (
              (!name?.trim() || name?.startsWith('"')
                ? t.name.startsWith(name.replace(/"/g, ""))
                : t.name
                    .toLowerCase()
                    .includes(name.trim().toLowerCase().replace(/"/g, ""))) &&
              (!type?.trim() || type?.startsWith('"')
                ? t.type.startsWith(type.replace(/"/g, ""))
                : t.type
                    .toLowerCase()
                    .includes(type.trim().toLowerCase().replace(/"/g, "")))
            );
          });
        } else
          filtered = filtered.filter((t) =>
            _inputValue.startsWith('"')
              ? t.name.startsWith(_inputValue.replace(/"/g, "")) ||
                t.type.startsWith(_inputValue.replace(/"/g, ""))
              : t.name
                  .toLowerCase()
                  .includes(
                    _inputValue.trim().toLowerCase().replace(/"/g, "")
                  ) ||
                t.type
                  .toLowerCase()
                  .includes(_inputValue.trim().toLowerCase().replace(/"/g, ""))
          );

      return filtered;
    });
  }, [tagArray, inputValue, advancedOptionsFilter, advancedSearch]);

  function navigate(newURL: string) {
    history.pushState(null, "", location.href);
    location.replace(newURL);
  }
  const addToSearch = (tag: (Tag | string)[] | (Tag | string)) => {
    let newQ: string;
    newQ = (searchParams.get("q") || "").trim();
    let newSorting = undefined;

    const proccessTag = (tag: Tag | string) => {
      // console.log(tag);
      if (typeof tag == "string") {
        if (tag.startsWith("pages")) {
          let name = tag.split(":")[1].replace(/"/g, "");
          if (name.startsWith("-")) {
            if (name.includes("<")) {
              let max = parseInt(name.replace(/-<=?/, ""));
              if (max) {
                let regex = new RegExp(`\\s?pages:"?<=?${max}"?`, "g");
                newQ = newQ.replace(regex, "");
              }
            } else if (name.includes(">")) {
              let min = parseInt(name.replace(/->=?/, ""));
              if (min) {
                let regex = new RegExp(`\\s?pages:"?>=?${min}"?`, "g");
                newQ = newQ.replace(regex, "");
              }
            }
          } else {
            if (name.includes("<")) {
              let max = parseInt(name.replace(/<=?/, ""));
              if (max) {
                let regex = new RegExp(`\\s?pages:"?<=?[0-9]+"?`, "g");
                if (newQ.match(regex))
                  newQ = newQ.replace(regex, ` pages:<=${max}`);
                else newQ = `${newQ} pages:<=${max}`;
              }
            } else if (name.includes(">")) {
              let min = parseInt(name.replace(/>=?/, ""));
              if (min) {
                let regex = new RegExp(`\\s?pages:"?>=?[0-9]+"?`, "g");
                if (newQ.match(regex))
                  newQ = newQ.replace(regex, ` pages:>=${min}`);
                else newQ = `${newQ} pages:>=${min}`;
              }
            }
          }
          return newQ;
        }
        if (tag.startsWith("sort")) {
          let name = tag.split(":")[1].replace(/"/g, "");
          if (
            ["popular-today", "popular-week", "popular", "recent"].includes(
              name
            )
          )
            newSorting = name;

          return newQ;
        }
      }

      let shouldExclude = false;
      if (typeof tag != "string" && (tag.id < 0 || tag.name.startsWith("-"))) {
        if (tag.name.startsWith("-")) tag.name = tag.name.slice(1);
        shouldExclude = true;
      } else if (typeof tag == "string" && tag.match(/.+?\:\"\-.+?\"/))
        shouldExclude = true;
      // console.log(shouldExclude);

      if (shouldExclude) {
        let type, name;
        if (typeof tag != "string") {
          type = tag.type;
          name = tag.name;
        } else {
          [type, name] = tag.split(":");
          name = name.replace(/\-/g, "");
        }

        if (type && name) {
          let regex = new RegExp(`\s?-?${type}:"?${name}"?`, "g");
          newQ = newQ.replace(regex, "");
        }
        // console.log("oldQ", oldQ, regex, oldQ.match(regex));
      }
      if (!shouldExclude)
        newQ = `${newQ} ${
          typeof tag == "string" ? tag : `${tag.type}:"${tag.name}"`
        }`;

      newQ = newQ.trim();
      // console.log(tag, newQ);
      // console.log(newQ);
      return newQ;
    };

    // console.log(tag);
    if (Array.isArray(tag)) for (let t of tag) newQ = proccessTag(t);
    else newQ = proccessTag(tag);
    // console.log(newQ);

    if (!newQ) {
      if (confirm("Removing all search params will send you to the homepage")) {
        navigate("/");
      }
      return;
    }

    searchParams.delete("q");
    searchParams.append("q", newQ.trim());
    if (newSorting) {
      if (newSorting == "recent") searchParams.delete("sort");
      else searchParams.set("sort", newSorting);
    }
    // console.log("newQ", newQ, searchParams.toString());
    if (location.href.match("[?&]q=")) navigate("?" + searchParams.toString());
    else navigate("/search/?" + searchParams.toString());
  };

  // useDebug(multipleSelected);

  const acceptSelected = () => acceptIndex(selected);
  const acceptIndex = (index: number) => acceptTag(filteredTags[index]);
  const acceptTag = (tag?: Tag) => {
    if (!tag) return false;
    switch (CONFIG["customSearchMode"]) {
      case 1:
        addToSearch(tag);
        break;
      case 2:
        setMultipleSelected((s) => {
          // console.log(s.find((t) => t.id == tag.id));
          if (s.find((t) => t.id == tag.id))
            return s.filter((t) => t.id != tag.id);
          else return [...s, tag];
        });
        break;
      default:
        if (inputValue != `${tag.type}:"${tag.name}"`) {
          setInputValue(`${tag.type}:"${tag.name}"`);
          const input = inputRef.current;
          if (!input) return;
          input.focus();
          input.select();
        } else {
          addToSearch(tag);
        }
        break;
    }
    return true;
  };

  const [lastScrolled, setLastScrolled] = useState(0);
  useEffect(() => {
    if (lastScrolled == selected) return;
    if (CONFIG["noCustomAutoComplete"]) return;
    if (selected >= shown) return;
    let autoComplete = autoCompleteRef.current;
    if (!autoComplete) return;
    let htmlElement = autoComplete.children[selected] as HTMLElement;
    if (!htmlElement) return;

    if (htmlElement.offsetTop < autoComplete.scrollTop)
      autoComplete.scrollTop = htmlElement.offsetTop - 8;
    else if (
      htmlElement.offsetTop + htmlElement.clientHeight >
      autoComplete.scrollTop + autoComplete.clientHeight
    )
      autoComplete.scrollTop =
        htmlElement.offsetTop +
        htmlElement.clientHeight -
        autoComplete.clientHeight +
        8;

    // htmlElement.scrollIntoView({
    //   block: "nearest",
    //   inline: "nearest",
    // });
    setLastScrolled(selected);
  }, [selected, shown, lastScrolled]);

  useEffect(() => {
    setSelected(0);
    setShown(
      CONFIG["showFullTagsListOnAutoComplete"]
        ? filteredTags.length
        : SHOWN_SKIP
    );
  }, [filteredTags]);

  useEffect(() => {
    if (CONFIG["showFullTagsListOnAutoComplete"]) {
      setShown(filteredTags.length);
      return;
    }

    if (selected >= shown)
      setShown(selected - (selected % SHOWN_SKIP) + SHOWN_SKIP);
  }, [selected, CONFIG["showFullTagsListOnAutoComplete"]]);

  useEffect(() => {
    // console.log(observerdElementRef.current);
    if (CONFIG["showFullTagsListOnAutoComplete"]) {
      if (shown != filteredTags.length) setShown(filteredTags.length);
      return;
    }
    // console.log(observerdElementRef.current);
    if (!observerdElementRef.current) return;
    // console.log("B");
    if (shown >= filteredTags.length) return;
    // console.log("C");
    let observer = new IntersectionObserver(
      (entries) => {
        // console.log(entries);
        if (entries[0].isIntersecting) setShown(shown + SHOWN_SKIP);
      },
      { threshold: 0.01 }
    );
    observer.observe(observerdElementRef.current);
    return () => observer.disconnect();
  }, [visible, observerdElementRef, shown, filteredTags]);

  useEffect(() => {
    const hide = (ev: MouseEvent) => {
      // console.log("hide", ev.target, inputRef.current);
      if (!inputRef.current || inputRef.current.onfocus) return;
      if (ev.target == inputRef.current) return;
      setVisible(false);
    };
    window.addEventListener("click", hide);
    return () => window.removeEventListener("click", hide);
  }, [inputRef]);

  const [selectedForUnselection, setSelectedForUnselection] = useState<
    ReturnType<typeof getSearchingFor>
  >([]);
  const [selectedForRemoval, setSelectedForRemoval] = useState<
    ReturnType<typeof getSearchingFor>
  >([]);
  const [selectedForAddition, setSelectedForAddition] = useState<
    ReturnType<typeof getSearchingFor>
  >([]);
  const [pages, setPages] = useState([-1, -1]);
  const [sortType, setSortType] = useState<
    undefined | "popular-today" | "popular-week" | "popular"
  >(undefined);
  const [initialPages, setInitialPages] = useState([-1, -1]);
  useEffect(() => {
    let q = searchParams.get("q");
    let min = q?.match(/pages:"?>=?([0-9]+)"?/i)?.[1];
    let max = q?.match(/pages:"?<=?([0-9]+)"?/i)?.[1];
    setPages((p) => {
      if (min && max) return [parseInt(min), parseInt(max)];
      if (min) return [parseInt(min), p[1]];
      if (max) return [p[0], parseInt(max)];
      return p;
    });
    setInitialPages((p) => {
      if (min && max) return [parseInt(min), parseInt(max)];
      if (min) return [parseInt(min), p[1]];
      if (max) return [p[0], parseInt(max)];
      return p;
    });
    let sort = searchParams.get("sort");
    if (sort && ["popular-today", "popular-week", "popular"].includes(sort)) {
      setSortType(sort as any);
    } else setSortType(undefined);
  }, [searchParams]);

  return CONFIG["noCustomSearchBar"] ? (
    <>
      <input
        required
        type="search"
        name="q"
        autoCapitalize="none"
        placeholder="e.g. 110631"
      />
      <button type="submit" className="btn btn-primary btn-square">
        <i className="fa fa-search fa-lg"></i>
      </button>
    </>
  ) : (
    <>
      <input
        onClick={() => setVisible(true)}
        ref={inputRef}
        id="custom-search-bar"
        required
        autoComplete="off"
        type="search"
        name="q"
        value={inputValue}
        onInput={(ev) => {
          setInputValue(ev.currentTarget.value);
        }}
        onFocus={() => {
          setVisible(true);
        }}
        autoCapitalize="none"
        placeholder="Search for tags"
        list={CONFIG["noCustomAutoComplete"] ? "tags" : undefined}
        onKeyDown={(ev) => {
          if (CONFIG["noCustomAutoComplete"]) return;
          if (["ArrowDown", "ArrowUp", "Enter"].includes(ev.key)) {
            ev.preventDefault();
            ev.stopPropagation();
          }
          switch (ev.key) {
            case "Shift":
              setShift(true);
              break;
            case "ArrowDown": {
              let newValue = selected + 1;
              if (!CONFIG["noAutoSearchWrap"])
                newValue = newValue % filteredTags.length;
              else newValue = Math.min(newValue, filteredTags.length - 1);
              setSelected(newValue);
              break;
            }
            case "ArrowUp": {
              let newValue;
              if (!CONFIG["noAutoSearchWrap"])
                newValue =
                  (selected - 1 + filteredTags.length) % filteredTags.length;
              else newValue = Math.max(selected - 1, 0);
              setSelected(newValue);
              break;
            }
            case "Enter":
              let search = () => {
                if (CONFIG["customSearchMode"] == 2 && multipleSelected.length)
                  addToSearch(multipleSelected);
                else addToSearch(inputValue);
              };
              if (CONFIG["enterToSearch"]) search();
              else if (shift) search();
              else if (!acceptSelected()) search();
              break;
          }
        }}
        onKeyUp={(ev) => {
          switch (ev.key) {
            case "Shift":
              setShift(false);
              break;
          }
        }}
      />
      <button
        type={CONFIG["noCustomAutoComplete"] ? "submit" : "button"}
        className="btn btn-primary btn-square"
        onClick={(ev) => {
          if (CONFIG["noCustomAutoComplete"]) return;
          ev.preventDefault();

          if (CONFIG["customSearchMode"] == 2 && multipleSelected.length) {
            addToSearch(multipleSelected);
            return;
          }
          addToSearch(inputValue);
        }}
      >
        <i className="fa fa-search fa-lg"></i>
      </button>

      {visible &&
        (CONFIG["noCustomAutoComplete"] ? (
          <datalist id="tags">
            {filteredTags.map(({ id, name, type }) => (
              <option key={id} value={`${type}:${name}`} />
            ))}
          </datalist>
        ) : (
          <div className="autocomplete" ref={autoCompleteRef}>
            <div
              className={`autocomplete-item advanced-options`}
              onMouseMove={() => setSelected(-1)}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                setAdvancedSearch(true);
              }}
            >
              ADVANCED OPTIONS
            </div>
            {filteredTags.length > 0 &&
              filteredTags.slice(0, shown).map(({ id, name, type }, i) => (
                <div
                  ref={
                    shown < filteredTags.length && i == shown - 1
                      ? observerdElementRef
                      : undefined
                  }
                  // style={
                  //   shown < filteredTags.length && i == shown - 1
                  //     ? {
                  //         backgroundColor: "rgb(255,0,0)",
                  //       }
                  //     : undefined
                  // }
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    acceptTag({
                      id,
                      name,
                      type,
                    });
                    document.getElementById("custom-search-bar")?.focus();
                  }}
                  onMouseMove={() => setSelected(i)}
                  //   onMouseEnter={() => setSelected(i)}
                  className={`autocomplete-item${
                    i === selected ? " selected" : ""
                  }${
                    multipleSelected.find((t) => t.id == id)
                      ? " autocomplete-item-selected"
                      : ""
                  }`}
                  id={`autocomplete-item-${id}`}
                  key={id}
                >
                  <span>{name}</span>
                  <span className="autocomplete-item-type">{type}</span>
                </div>
              ))}
          </div>
        ))}
      {advancedSearch &&
        (() => {
          return (
            <div className="advanced-search">
              <div className="foreground">
                <h1>ADVANCED OPTIONS</h1>
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    let tags: (Tag | string)[] = [];
                    let q = searchParams.get("q");
                    if (q) {
                      if (pages[0] == -1) {
                        let min = q.match(/pages:"?>=?([0-9]+)"?/i)?.[1];
                        if (min) tags.push(`pages:"->=${min}"`);
                      }
                      if (pages[1] == -1) {
                        let max = q.match(/pages:"?<=?([0-9]+)"?/i)?.[1];
                        if (max) tags.push(`pages:"-<=${max}"`);
                      }
                    }
                    if (
                      pages[0] > 0 &&
                      pages[0] != -1 &&
                      pages[0] != initialPages[0] &&
                      !selectedForUnselection.find(
                        ([type, name, id]) =>
                          type == "pages" && name == `>=${pages[0]}`
                      )
                    )
                      tags.push(`pages:>=${pages[0]}`);

                    if (
                      pages[1] > 0 &&
                      pages[1] != -1 &&
                      pages[1] != initialPages[1] &&
                      !selectedForUnselection.find(
                        ([type, name, id]) =>
                          type == "pages" && name == `<=${pages[1]}`
                      )
                    )
                      tags.push(`pages:<=${pages[1]}`);
                    let searchingFor = getSearchingFor();
                    tags.push(
                      ...selectedForUnselection
                        .map(([type, name, id]) =>
                          searchingFor.find(
                            ([ttype, tname, tid]) =>
                              ttype == type && tname == name && tid == id
                          )
                            ? [type, `-${name}`, id ? -id : id]
                            : type
                            ? [`-${type}`, name, id]
                            : [undefined, `-${name}`, id]
                        )
                        .concat(selectedForAddition as any)
                        .concat(
                          selectedForRemoval.map(([type, name, id]) =>
                            type
                              ? [`-${type}`, name, id]
                              : [undefined, `-${name}`, id]
                          )
                        )
                        .map(
                          ([type, name, id]) =>
                            (id
                              ? ({
                                  id,
                                  name,
                                  type,
                                } as Tag)
                              : type
                              ? `${type}:"${name}"`
                              : name || "") as Tag | string
                        )
                    );
                    tags.push(`sort:${sortType || "recent"}`);
                    // console.log("tags", tags);
                    addToSearch(tags);
                  }}
                  className="btn btn-primary"
                >
                  SEARCH
                </button>
                {getSearchingFor().length > 0 && <h2>CURRENT SEARCH</h2>}
                <div className="advanced-search-options-tags">
                  {getSearchingFor().map(([type, name, id]) => {
                    return (
                      <div
                        className={`${
                          selectedForUnselection.findIndex(
                            ([ttype, tname, tid]) =>
                              ttype == type && tname == name && tid == id
                          ) > -1
                            ? "selected red"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedForUnselection(
                            selectedForUnselection.find(
                              ([ttype, tname, tid]) =>
                                ttype == type && tname == name && tid == id
                            )
                              ? selectedForUnselection.filter(
                                  ([ttype, tname, tid]) =>
                                    ttype != type || tname != name || tid != id
                                )
                              : [...selectedForUnselection, [type, name, id]]
                          );
                        }}
                      >
                        {type && name ? (
                          <>
                            {type}:"{name}"
                          </>
                        ) : (
                          <>{name}</>
                        )}
                      </div>
                    );
                  })}
                </div>
                <h2>PAGES</h2>

                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "90%",
                    }}
                  >
                    <Slider
                      getAriaLabel={() => "Temperature range"}
                      value={[
                        pages[0] == -1 ? 0 : pages[0],
                        pages[1] == -1 ? 800 : pages[1],
                      ]}
                      onChange={(event, newValue) => {
                        if (!Array.isArray(newValue)) return;
                        if (newValue[0] == 0) newValue[0] = -1;
                        if (newValue[1] == MAX_PAGES) newValue[1] = -1;
                        setPages(newValue as number[]);
                      }}
                      valueLabelDisplay="auto"
                      getAriaValueText={(value) => value.toString()}
                      min={0}
                      max={MAX_PAGES}
                    />
                  </div>
                </div>
                <div className="pages-inputs">
                  <input
                    type="number"
                    value={pages[0]}
                    onChange={(ev) => {
                      let value = parseInt(ev.currentTarget.value);
                      if (isNaN(value)) value = 0;
                      setPages((p) => [value, p[1]]);
                    }}
                  />
                  <input
                    type="number"
                    value={pages[1]}
                    onChange={(ev) => {
                      let value = parseInt(ev.currentTarget.value);
                      if (isNaN(value)) value = MAX_PAGES;
                      setPages((p) => [p[0], value]);
                    }}
                  />
                </div>
                <h2>SORTING</h2>
                <div className="sort">
                  <div className="sort-type">
                    <a
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        setSortType(undefined);
                      }}
                      className={`advanced-sorting ${
                        sortType == undefined ? " current" : ""
                      }`}
                    >
                      Recent
                    </a>
                  </div>
                  <div className="sort-type">
                    <span className="sort-name">Popular:</span>
                    <a
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        setSortType("popular-today");
                      }}
                      className={`advanced-sorting ${
                        sortType == "popular-today" ? " current" : ""
                      }`}
                    >
                      Today
                    </a>
                    <a
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        setSortType("popular-week");
                      }}
                      className={`advanced-sorting ${
                        sortType == "popular-week" ? " current" : ""
                      }`}
                    >
                      Week
                    </a>
                    <a
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        setSortType("popular");
                      }}
                      className={`advanced-sorting ${
                        sortType == "popular" ? " current" : ""
                      }`}
                    >
                      All Time
                    </a>
                  </div>
                </div>
                <h2>TAGS</h2>
                <div
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search for tags"
                    value={advancedOptionsFilter}
                    onChange={(ev) => {
                      setAdvancedOptionsFilter(ev.currentTarget.value);
                    }}
                  />
                </div>
                {filteredTags.length > 0 ? (
                  filteredTags.length < 100 ? (
                    <div className="advanced-search-options-tags">
                      {filteredTags
                        .map((tag) =>
                          tag.id < 0
                            ? {
                                ...tag,
                                id: -tag.id,
                                name: tag.name.slice(1),
                              }
                            : tag
                        )
                        .map(({ id, name, type }, i) => (
                          <div
                            className={`${
                              !!selectedForAddition.find(
                                ([ttype, tname, tid]) =>
                                  ttype == type && tname == name && tid == id
                              )
                                ? "selected"
                                : !!selectedForRemoval.find(
                                    ([ttype, tname, tid]) =>
                                      ttype == type &&
                                      tname == name &&
                                      tid == id
                                  )
                                ? "selected red"
                                : ""
                            }`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              ev.preventDefault();
                              let sAIndex = selectedForAddition.findIndex(
                                ([ttype, tname, tid]) =>
                                  ttype == type && tname == name && tid == id
                              );
                              let sRIndex = selectedForRemoval.findIndex(
                                ([ttype, tname, tid]) =>
                                  ttype == type && tname == name && tid == id
                              );
                              if (sAIndex == -1 && sRIndex == -1)
                                setSelectedForAddition((s) => [
                                  ...s,
                                  [type, name, id],
                                ]);
                              if (sAIndex != -1) {
                                setSelectedForAddition((s) =>
                                  s.filter((_, i) => i != sAIndex)
                                );
                                if (sRIndex == -1) {
                                  setSelectedForRemoval((s) => [
                                    ...s,
                                    [type, name, id],
                                  ]);
                                }
                              }
                              if (sRIndex != -1)
                                setSelectedForRemoval((s) =>
                                  s.filter((_, i) => i != sRIndex)
                                );
                            }}
                          >
                            {type && name ? (
                              <>
                                {type}:"{name}"
                              </>
                            ) : (
                              <>{name}</>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div>TOO MANY TAGS</div>
                  )
                ) : (
                  <div>NOTHING FOUND</div>
                )}
              </div>
              <div
                className="background"
                onClick={(ev) => {
                  ev.stopPropagation();
                  ev.preventDefault();
                  setAdvancedSearch(false);
                }}
              ></div>
            </div>
          );
        })()}
    </>
  );
};
