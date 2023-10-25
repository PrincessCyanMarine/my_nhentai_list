import React, {
  KeyboardEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TagsContext, TagsContextComponent } from "../context/tagsContext";
import {
  RatingsContext,
  RatingsContextComponent,
} from "../context/ratingsContext";
import { InfoContext, InfoContextComponent } from "../context/infoContext";
import { useDebug } from "../helpers/useDebug";
import { Tag } from "../models/HentaiInfo";
import { MyNHentaiListConfiguration, SEARCH_MODE } from "../pages/ConfigPage";
function useSubscription<T>(
  defaultValue: T,
  type: "sync" | "local",
  key: string
) {
  const [value, setValue] = useState(defaultValue);
  // useDebug(value);
  useEffect(() => {
    chrome.storage[type].get(key).then((result) => {
      setValue(result[key] || defaultValue);
      chrome.storage[type].onChanged.addListener((changes) => {
        if (changes[key]) setValue(changes[key].newValue || defaultValue);
      });
    });
  }, []);
  return value;
}

const SHOWN_SKIP = 10;

export default () => {
  const [shift, setShift] = useState(false);
  const [multipleSelected, setMultipleSelected] = useState<Tag[]>([]);

  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(SHOWN_SKIP);
  const searchParams = new URLSearchParams(location.search);
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
    let searchingFor = searchParams
      .get("q")
      ?.match(/[\S]+?:".+?"|[\S]+?:[\S]+|\"[\S\s]+\"|[\S]+/g)
      ?.map((s) =>
        s.match(/.+\:.+/)
          ? s.split(":").map((s) => s.replace(/"/g, ""))
          : [undefined, s.replace(/"/g, "")]
      )
      .map(([type, name]) => {
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

  useEffect(() => {
    if (CONFIG["noCustomAutoComplete"]) {
      setFilteredTags([]);
      return;
    }
    setFilteredTags(() => {
      let filtered = tagArray;
      if (inputValue.trim())
        if (inputValue.match(/^[^:]*:[^:]*$/)) {
          let [type, name] = inputValue.split(":");
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
            inputValue.startsWith('"')
              ? t.name.startsWith(inputValue.replace(/"/g, "")) ||
                t.type.startsWith(inputValue.replace(/"/g, ""))
              : t.name
                  .toLowerCase()
                  .includes(
                    inputValue.trim().toLowerCase().replace(/"/g, "")
                  ) ||
                t.type
                  .toLowerCase()
                  .includes(inputValue.trim().toLowerCase().replace(/"/g, ""))
          );

      return filtered;
    });
  }, [tagArray, inputValue]);

  function navigate(newURL: string) {
    history.pushState(null, "", location.href);
    location.replace(newURL);
  }
  const addToSearch = (tag: (Tag | string)[] | (Tag | string)) => {
    let newQ: string;
    newQ = (searchParams.get("q") || "").trim();

    const proccessTag = (tag: Tag | string) => {
      let shouldExclude = false;
      if (typeof tag != "string" && (tag.id < 0 || tag.name.startsWith("-"))) {
        if (tag.name.startsWith("-")) tag.name = tag.name.slice(1);
        shouldExclude = true;
      } else if (typeof tag == "string" && tag.match(/.+?\:\"\-.+?\"/))
        shouldExclude = true;
      console.log(shouldExclude);

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
      console.log(newQ);
      return newQ;
    };

    console.log(tag);
    if (Array.isArray(tag)) for (let t of tag) newQ = proccessTag(t);
    else newQ = proccessTag(tag);
    console.log(newQ);

    if (!newQ) {
      if (confirm("Removing all search params will send you to the homepage")) {
        navigate("/");
      }
      return;
    }

    searchParams.delete("q");
    searchParams.append("q", newQ.trim());
    if (location.href.match("[?&]q=")) navigate("?" + searchParams.toString());
    else navigate("/search/?" + searchParams.toString());
  };

  useDebug(multipleSelected);

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
          console.log(s.find((t) => t.id == tag.id));
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
    console.log(observerdElementRef.current);
    if (CONFIG["showFullTagsListOnAutoComplete"]) {
      if (shown != filteredTags.length) setShown(filteredTags.length);
      return;
    }
    console.log(observerdElementRef.current);
    if (!observerdElementRef.current) return;
    console.log("B");
    if (shown >= filteredTags.length) return;
    console.log("C");
    let observer = new IntersectionObserver(
      (entries) => {
        console.log(entries);
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
            case "ArrowDown":
              setSelected((selected + 1) % filteredTags.length);
              break;
            case "ArrowUp":
              setSelected(
                (selected - 1 + filteredTags.length) % filteredTags.length
              );
              break;
            case "Enter":
              let search = () => {
                switch (CONFIG["customSearchMode"]) {
                  case 1:
                    addToSearch(filteredTags[selected]);
                    break;
                  case 2:
                    addToSearch(multipleSelected);
                    break;
                  default:
                    addToSearch(inputValue);
                    break;
                }
              };
              if (CONFIG["enterToSearch"]) search();
              else if (shift) search();
              else acceptSelected();
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
          filteredTags.length > 0 && (
            <div className="autocomplete" ref={autoCompleteRef}>
              {filteredTags.slice(0, shown).map(({ id, name, type }, i) => (
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
          )
        ))}
    </>
  );
};
