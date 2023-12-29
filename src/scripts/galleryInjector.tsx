import React from "react";
import ReactDOM from "react-dom";
import { ElementBuilder } from "../helpers/ElementBuilder";
import { getInfo, getRatings, getTags } from "../helpers/chromeGetter";
import { HentaiInfo, Tag } from "../models/HentaiInfo";
import { InfoList, RatingList } from "../models/RatingList";
import { MyNHentaiListConfiguration } from "../pages/ConfigPage";
import "../sass/galleryInjector.scss";
import CustomSearchBar from "../components/gallery/CustomSearchBar";
import CustomGallery from "../components/gallery/CustomGallery";
import CustomContainer, {
  GalleryItem,
} from "../components/gallery/CustomContainer";
var CONFIG: Partial<MyNHentaiListConfiguration>;
// console.log(localStorage.getItem("censorImages"));

declare global {
  interface Window {
    reader: any;
    addedPageCounter: boolean;
  }
}

var customBarAdded = false;

function navigate(newURL: string) {
  history.pushState(null, "", location.href);
  location.replace(newURL);
}

function isMobile() {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent);
  return check;
}

var info: InfoList | undefined = {};
var ratings: RatingList | undefined = {};
var tags: Record<number, Tag> | undefined = {};
var favoriteTags: number[] | undefined = [];
var defaultSelected: number[] | undefined = [];
var currentlySelected: number[] | undefined = [];
var currentlyExcluded: number[] | undefined = [];
var defaultSorting: number = 0;

const forAll = (selector: string, callback: (element: Element) => void) => {
  let elements = document.querySelectorAll(selector);
  for (let i = 0; i < elements.length; i++) callback(elements[i]);
};

// if (localStorage.getItem("customSearchBar") == "true") {
//   let searchBar = document.getElementsByClassName("search")[0].children[0] as
//     | HTMLInputElement
//     | undefined;
//   if (searchBar) searchBar.value = "";
// }
function inject() {
  {
    let comments = document.getElementById("comment-container");
    let comment_post = document.getElementById("comment-post-container");
    if (comments) {
      if (!CONFIG["showComments"]) comments.style.display = "none";
      else comments.style.display = "";
    }
    if (comment_post) {
      if (!CONFIG["showComments"]) comment_post.style.display = "none";
      else comment_post.style.display = "";
    }
  }

  let containerClasses = document.getElementsByClassName(
    "container index-container"
  );
  let containers = [] as Element[];
  for (let i = 0; i < containerClasses.length; i++)
    if (containerClasses[i]) containers.push(containerClasses[i]);
  let related_container = document.getElementById("related-container");
  if (related_container) containers.push(related_container);
  let recent_favorites = document.getElementById("recent-favorites-container");
  if (recent_favorites) containers.push(recent_favorites);
  let fav_container = document.getElementById("favcontainer");
  if (fav_container) containers.push(fav_container);

  for (let container of containers) {
    injectOnContainer(container as HTMLDivElement);
  }

  if (!CONFIG["dontRedirectSearchToAdvanced"]) {
    let transferMatch = location.href.match(
      /nhentai.net\/(tag|artist|character|parody|group|language|category)\/(.+?)\/?$/
    );
    if (transferMatch) {
      let [_, type, name] = transferMatch;
      navigate(
        `https://nhentai.net/search/?q=${type}%3A"${name.replace(/ |-/g, "+")}"`
      );
      return;
    }
  }
  let searchingFor:
    | {
        id: number;
        type: string | undefined;
        name: string | undefined;
      }[]
    | undefined = undefined;
  let searchParams = new URLSearchParams(location.search);

  let addToSearch = (idOrName: number | string, shouldExclude: boolean) => {
    let newQ;
    if (typeof idOrName == "string")
      newQ = `${searchParams.get("q") || ""} ${
        shouldExclude ? "-" : ""
      } ${idOrName}`;
    else {
      newQ = `${searchParams.get("q") || ""} ${shouldExclude ? "-" : ""}${
        tags?.[idOrName]?.type || ""
      }:"${tags?.[idOrName]?.name}"`;
    }
    searchParams.delete("q");
    searchParams.append("q", newQ.trim());
    if (location.href.match("[?&]q=")) navigate("?" + searchParams.toString());
    else navigate("/search/?" + searchParams.toString());
  };
  let _tags = Object.values(tags ?? []);
  if (location.href.match("[?&]q=")) {
    // console.log("ADDING ADDERS");
    let _adders = document.getElementsByClassName("search-buttons");
    while (_adders[0]) {
      // console.log("REMOVING " + _adders[0]);
      _adders[0].remove();
    }

    // console.log(_tags);
    searchingFor = searchParams
      .get("q")
      ?.match(/[\S]+?:".+?"|[\S]+?:[\S]+|\"[\S\s]+\"|[\S]+/g)
      ?.map((s) => {
        if (s?.match(/[\S]+?:[\S]+/)) return s;
        let m = s?.match(/".+?"|\S+/g);
        if (!m) return s;
        return m;
      })
      .flat()
      ?.map((s) =>
        s.match(/.+\:.+/)
          ? s.split(":").map((s) => s.replace(/"/g, ""))
          : [undefined, s.replace(/"/g, "")]
      )

      .map(([type, name]) => {
        let res = _tags.findIndex(
          (tag) => tag.type == type && tag.name == name
        );
        // console.log("Searching for", res);
        if (res > -1) return { ..._tags[res] };
        res = _tags.findIndex(
          (tag) => "-" + tag.type == type && tag.name == name
        );
        // console.log("Searching for -", res);
        if (res > -1) {
          let tag = { ..._tags[res] };
          tag.id = -tag.id;
          return tag;
        }
        return {
          id: 0,
          type,
          name,
        };
      });

    let searchUtils = new ElementBuilder("div")
      .addClass("search-utils")
      .build();
    let buttons = new ElementBuilder("div").addClass("search-buttons").build();
    let adders = new ElementBuilder("div").addClass("add-buttons").build();
    let removers = new ElementBuilder("div").addClass("remove-buttons").build();
    buttons.append(adders);
    buttons.append(removers);
    searchUtils.append(buttons);
    let sort = document.getElementsByClassName("sort");
    for (let i = 0; i < sort.length; i++) sort[i].prepend(searchUtils);

    let toTestFor: number[] = [];
    if (!CONFIG["noDefaultAddToSearch"])
      toTestFor = toTestFor.concat(defaultSelected ?? []);
    if (!CONFIG["noCurrentlySelectedAddToSearch"])
      toTestFor = toTestFor.concat(
        (currentlySelected ?? []).filter((t) => !currentlyExcluded?.includes(t))
      );
    if (!CONFIG["noFavoriteAddToSearch"])
      toTestFor = toTestFor.concat(favoriteTags ?? []);
    if (!CONFIG["ignoreCurrentlyExcludedInAddToSearch"])
      toTestFor = toTestFor.filter((t) => !currentlyExcluded?.includes(t));
    toTestFor = toTestFor.filter(
      (id) => !searchingFor?.find((t) => t.id == -id)
    );

    if (!CONFIG["noExcludeFromSearch"])
      toTestFor = toTestFor.concat(
        (currentlyExcluded ?? [])
          .filter((id) => !searchingFor?.find((t) => t.id == id))
          .map((t) => -t)
      );
    toTestFor = toTestFor.filter((t, i, a) => a.indexOf(t) === i);
    for (let defaultS of toTestFor) {
      if (document.getElementById("adder-for-" + defaultS)) continue;
      let shouldExclude = false;
      if (defaultS < 0) {
        // defaultS = -defaultS;
        shouldExclude = true;
      }
      if (!searchingFor?.find((t) => t?.id == defaultS)) {
        if (defaultS < 0) defaultS = -defaultS;
        if (tags?.[defaultS])
          adders.append(
            new ElementBuilder("button")
              .setHtml(
                `${
                  shouldExclude ? "Exclude" : "Add"
                } <span style="color:#570000;">${
                  tags[defaultS]?.type || ""
                }</span> <span style="color:#00003f;">${
                  tags[defaultS]?.name
                }</span> ${shouldExclude ? "to" : "from"} search`
              )
              .addClass("btn")
              .addClass("btn-secondary")
              .setId("adder-for-" + defaultS)
              .addEventListener("click", () => {
                addToSearch(defaultS, shouldExclude);
              })
              .build()
          );
        // break;
      }
    }

    if (!CONFIG["noRemoveFromSearch"] && searchingFor)
      for (let searching of searchingFor) {
        if (!searching) continue;
        let { id, type, name } = searching;
        // console.log(searching);
        if (!name) continue;
        // console.log(document.getElementById("remover-for-" + (id || name)));
        if (document.getElementById("remover-for-" + (id || name))) continue;
        removers.append(
          new ElementBuilder("button")
            .addClass("btn")
            .addClass("btn-primary")
            .setId("remover-for-" + (id || name))
            .setHtml(
              `Remove <span style="color:#f4ff00;">${id < 0 ? "-" : ""}${
                type || ""
              }</span> <span style="color:#00003f;">${name}</span> from search`
            )
            .addEventListener("click", () => {
              // console.log(id, searchingFor);
              let newQ = searchingFor
                ?.filter((t) => (id != 0 ? t?.id != id : t?.name != name))
                .map((s) =>
                  s?.type
                    ? `${s.id < 0 ? "-" : ""}${s.type}:"${s.name}"`
                    : s.name
                )
                .join(" ");
              // console.log(newQ);
              if (!newQ) {
                if (
                  confirm(
                    "Removing all search params will send you to the homepage"
                  )
                ) {
                  navigate("/");
                }
                return;
              }
              searchParams.delete("q");
              searchParams.append("q", newQ);
              navigate("?" + searchParams.toString());
            })
            .build()
        );
      }
  }
  // localStorage.setItem(
  //   "customSearchBar",
  //   `${!(CONFIG["noCustomSearchBar"] ?? false)}`
  // );

  if (!CONFIG["noCustomSearchBar"]) {
    if (customBarAdded) return;
    customBarAdded = true;
    let searchForm = document.getElementsByClassName("search")[0] as
      | HTMLFormElement
      | undefined;
    if (searchForm) searchForm.style.position = "relative";

    // @ts-ignore
    const root = ReactDOM.createRoot(searchForm);
    const render = () => {
      // console.log("Rendering React");
      root.render(<CustomSearchBar />);
    };

    render();

    // searchBar.addEventListener("focus", (ev) => {
    //   if (document.getElementsByClassName("autocomplete")[0]) return;
    //   ev.preventDefault();
    //   ev.stopPropagation();

    //   let autocomplete = new ElementBuilder("div")
    //     .addClass("autocomplete")
    //     .build();
    //   searchForm.appendChild(autocomplete);

    //   let autoCompleteItems = [] as HTMLAnchorElement[];
    //   // let currentTags = [] as Tag[];
    //   let selected = 0;
    //   // let shown = 10;
    //   // let setShown = (value: number) => {
    //   //   // if (shown == value) return;
    //   //   shown = value;
    //   //   removeClass("autocomplete-item");
    //   //   autoCompleteItems = [];
    //   //   for (let i = 0; i < shown; i++) {
    //   //     autoCompleteItems[i] = createAutoCompleteItem(currentTags[i], i);
    //   //     console.log(autoCompleteItems[i]);
    //   //     autocomplete.append(autoCompleteItems[i]);
    //   //   }
    //   // };
    //   let select = (index: number) => {
    //     autoCompleteItems[selected]?.classList.remove("selected");
    //     selected = index;
    //     // setShown(((selected % 10) + 1) * 10);
    //     autoCompleteItems[selected]?.classList.add("selected");
    //     if (autoCompleteItems[selected].offsetTop < autocomplete.scrollTop)
    //       autocomplete.scrollTop = autoCompleteItems[selected].offsetTop - 8;
    //     else if (
    //       autoCompleteItems[selected].offsetTop +
    //         autoCompleteItems[selected].clientHeight >
    //       autocomplete.scrollTop + autocomplete.clientHeight
    //     )
    //       autocomplete.scrollTop =
    //         autoCompleteItems[selected].offsetTop +
    //         autoCompleteItems[selected].clientHeight -
    //         autocomplete.clientHeight +
    //         8;
    //   };

    //   let createAutoCompleteItem = (tag: Tag, index: number) =>
    //     new ElementBuilder("a")
    //       .addClass("autocomplete-item")
    //       .setText(tag.name)
    //       .setId("autocomplete-item-" + tag.id)
    //       .addEventListener("mouseenter", () => {
    //         select(index);
    //       })
    //       .appendChildren(
    //         new ElementBuilder("span")
    //           .addClass("autocomplete-item-type")
    //           .setText(tag.type)
    //           .build()
    //       )
    //       .addEventListener("click", (ev) => {
    //         ev.preventDefault();
    //         ev.stopPropagation();
    //         if (CONFIG["autoSearchOnSelect"]) addToSearch(tag.id, tag.id < 0);
    //         else {
    //           if (searchBar.value == `${tag.type}:"${tag.name}"`)
    //             addToSearch(tag.id, tag.id < 0);
    //           else {
    //             searchBar.value = `${tag.type}:"${tag.name}"`;
    //             searchBar.focus();
    //             testInput();
    //           }
    //         }
    //       })
    //       .setAttribute("data-text", `${tag.type}:"${tag.name}"`)
    //       .setAttribute("data-id", tag.id.toString())
    //       .build();
    //   let __tags = _tags
    //     .sort((a, b) => a.name.localeCompare(b.name))
    //     .sort((a, b) => {
    //       if (a.type == b.type) return 0;
    //       let dict = [
    //         "category",
    //         "language",
    //         "tag",
    //         "parody",
    //         "character",
    //         "group",
    //         "artist",
    //       ];
    //       let value = (c: Tag) => dict.findIndex((s) => s == c.type) + 1 || 8;
    //       return value(a) - value(b);
    //     });
    //   let setAutocomplete = (tags: Tag[]) => {
    //     if (tags.length == 0) {
    //       autocomplete.style.display = "none";
    //     } else {
    //       autocomplete.style.display = "block";
    //     }
    //     autocomplete.innerHTML = "";
    //     autoCompleteItems = tags.map(createAutoCompleteItem);
    //     for (let tag of autoCompleteItems) autocomplete.append(tag);
    //     // currentTags = tags;
    //     select(0);
    //   };
    //   setAutocomplete(__tags);

    //   let fuseName = new Fuse(__tags, {
    //     keys: ["name"],
    //     useExtendedSearch: true,
    //     isCaseSensitive: false,
    //   });
    //   let fuseType = new Fuse(
    //     __tags.map((t) => t.type).filter((t, i, a) => a.indexOf(t) == i),
    //     {
    //       threshold: 0.1,
    //       isCaseSensitive: false,
    //       useExtendedSearch: true,
    //     }
    //   );
    //   let fuse = new Fuse(__tags, {
    //     keys: ["name", "type"],
    //     isCaseSensitive: false,
    //     useExtendedSearch: true,
    //   });

    //   let testInput = () => {
    //     let value = searchBar.value;
    //     if (!value) {
    //       setAutocomplete(__tags);
    //       return;
    //     }
    //     let results: { item: Tag }[];

    //     if (value.includes(":")) {
    //       let [type, name] = value.split(":");
    //       let _types = fuseType.search(type);
    //       if (name)
    //         results = fuseName.search(name).filter((r) => {
    //           return _types.find((t) => t.item == r.item.type);
    //         });
    //       else
    //         results = __tags
    //           .filter((t) => _types.find((_t) => _t.item == t.type))
    //           .map((t) => ({ item: t }));
    //     } else results = fuse.search(value);
    //     setAutocomplete(results.map((r) => r.item));
    //   };
    //   let onKeyDown = (ev: KeyboardEvent) => {
    //     if (ev.key == "ArrowDown") {
    //       ev.preventDefault();
    //       ev.stopPropagation();
    //       select((selected + 1) % autoCompleteItems.length);
    //       // select((selected + 1) % currentTags.length);
    //     } else if (ev.key == "ArrowUp") {
    //       ev.preventDefault();
    //       ev.stopPropagation();
    //       select(
    //         (selected - 1 + autoCompleteItems.length) % autoCompleteItems.length
    //       );
    //       // select((selected - 1 + currentTags.length) % currentTags.length);
    //     } else if (ev.key == "Enter") {
    //       ev.preventDefault();
    //       ev.stopPropagation();
    //       if (CONFIG["autoSearchOnSelect"]) {
    //         addToSearch(
    //           parseInt(
    //             autoCompleteItems[selected].getAttribute("data-id") || ""
    //           ),
    //           false
    //         );
    //       } else {
    //         let newValue =
    //           autoCompleteItems[selected]?.getAttribute("data-text") || "";
    //         if (newValue || autoCompleteItems.length == 0) {
    //           if (newValue == searchBar.value) {
    //             if (autoCompleteItems.length == 0)
    //               addToSearch(searchBar.value, false);

    //             let id = parseInt(
    //               autoCompleteItems[selected].getAttribute("data-id") || ""
    //             );

    //             if (!id || isNaN(id)) alert("Something went wrong...");
    //             if (searchingFor?.find((t) => t.id == id)) {
    //               alert("You already have that tag in your search");
    //               return;
    //             }

    //             addToSearch(id, id < 0);
    //           } else searchBar.value = newValue;
    //         }
    //         select(0);
    //         searchBar.focus();
    //         testInput();
    //       }
    //     }
    //   };

    //   searchBar.addEventListener("input", testInput);
    //   searchBar.addEventListener("keydown", onKeyDown);

    //   (searchForm[1] as HTMLButtonElement).addEventListener("click", (ev) => {
    //     ev.preventDefault();
    //     ev.stopPropagation();
    //     addToSearch(searchBar.value, false);
    //   });

    //   searchForm.addEventListener("submit", (ev) => {
    //     ev.preventDefault();
    //     ev.stopPropagation();
    //   });

    //   let removeAutocomplete = (ev: MouseEvent) => {
    //     if (searchBar == document.activeElement) return;
    //     removeClass("autocomplete");
    //     window.removeEventListener("click", removeAutocomplete);
    //     searchBar.removeEventListener("input", testInput);
    //     searchBar.removeEventListener("keydown", onKeyDown);
    //   };
    //   window.addEventListener("click", removeAutocomplete);
    // });
  }
}

function injectOnContainer(container: HTMLDivElement) {
  if (container.classList.contains("custom-gallery-container")) return;
  container.classList.add("custom-gallery-container");
  // console.log(container);
  let children = container.children;
  let _title = children[0];
  let title = "";
  if (_title instanceof HTMLHeadingElement) title = _title.innerText;
  let galleries = [] as HTMLDivElement[];
  for (let i = title ? 1 : 0; i < children.length; i++) {
    let child = children[i] as HTMLDivElement;
    if (child.classList.contains("gallery-favorite")) {
      child = child.children[1] as HTMLDivElement;
    }
    if (child.classList.contains("gallery")) galleries.push(child);
  }
  // console.log(_title, title, galleries);
  // @ts-ignore
  let root = ReactDOM.createRoot(container);
  let galleryInfo = [] as GalleryItem[];
  for (let gallery of galleries) {
    // console.log(gallery);
    let anchor = gallery.children[0] as HTMLAnchorElement;
    let img = anchor.children[0] as HTMLImageElement;
    let title = anchor.children[2] as HTMLDivElement;
    // console.log(img, img.src, img.getAttribute("data-src"));
    let id = anchor.href?.match(/\/g\/([0-9]+)/)?.[1];
    if (!id) continue;

    let info: GalleryItem = {
      dataTags:
        gallery
          .getAttribute("data-tags")
          ?.split(" ")
          .map((a) => parseInt(a)) || [],
      link: anchor.href,
      image: {
        src: img.getAttribute("data-src")!,
        width: img.width,
        height: img.height,
      },
      id,
      title: title.innerText,
      anchorPadding: anchor.style.padding,
    };
    galleryInfo.push(info);
    // console.log(info);
  }
  let render = () => {
    root.render(
      <CustomContainer
        title={title}
        // galleries={galleries}
        galleryInfo={galleryInfo}
      />
    );
  };
  render();
}

// let roots = {} as Record<string, any>;
// function injectItem(item: HTMLDivElement, id?: string, datatags?: number[]) {
//   let cover = item.children[0] as HTMLAnchorElement;
//   if (!id) {
//     id = cover.href.match(/g\/([0-9]+)/)?.[1];
//     if (!id) return;
//   }
//   let reactDiv;
//   let root: any;
//   if (!item.classList.contains("custom-gallery")) {
//     item.classList.add("custom-gallery");

//     reactDiv = document.createElement("div");
//     reactDiv.classList.add("custom-gallery-root");
//     item.appendChild(reactDiv);
//     // @ts-ignore
//     root = ReactDOM.createRoot(reactDiv);
//     roots[id] = root;
//   } else {
//     reactDiv = item.getElementsByClassName("custom-gallery-root")[0];
//     root = roots[id];
//   }

//   if (!datatags)
//     datatags = item
//       .getAttribute("data-tags")
//       ?.split(" ")
//       ?.map((i) => parseInt(i));
//   if (CONFIG.useReactGalleries) {
//     let render = () => {
//       root.render(
//         <CustomGallery
//           defaultSorting={defaultSorting}
//           defaultTags={defaultSelected}
//           excludedTags={currentlyExcluded}
//           id={id}
//           dataTags={datatags}
//           tags={tags}
//           info={info}
//           CONFIG={CONFIG}
//           ratings={ratings}
//           currentlySelected={currentlySelected}
//           favoriteTags={favoriteTags}
//         />
//       );
//     };
//     render();
//     return;
//   }
//   if (reactDiv) reactDiv.remove();

//   if (id) {
//     if (CONFIG["censorImages"])
//       (cover.children[0] as HTMLImageElement).classList.add("censored");

//     if (!CONFIG["hideRatingOnGallery"]) {
//       let rating = ratings[id];
//       let ratingDiv = document.createElement("div");
//       ratingDiv.classList.add("rating");
//       if (rating || rating == 0)
//         if (rating >= 6) ratingDiv.classList.add("rating--positive");
//         else if (rating >= 4) ratingDiv.classList.add("rating--neutral");
//         else ratingDiv.classList.add("rating--negative");
//       ratingDiv.innerText =
//         rating == 0 || (rating && rating >= 0)
//           ? rating.toFixed(2)
//           : "NOT RATED";
//       item.appendChild(ratingDiv);
//     }

//     if (!CONFIG["hideReadOnGallery"]) {
//       let readDiv = document.createElement("div");
//       readDiv.classList.add("read-indicator");
//       readDiv.classList.add(info[id] ? "read" : "unread");
//       // check or x
//       readDiv.innerText = info[id] ? "✓" : "✗";
//       item.appendChild(readDiv);
//     }
//   }

//   let addTagsDiv = (dataTags: number[], tagsContainerClassName: string) => {
//     let tagsDiv = document.createElement("div");
//     tagsDiv.className = tagsContainerClassName;
//     if (dataTags) {
//       // console.log(dataTags);
//       for (let tagId of dataTags) {
//         let tagDiv = document.createElement("div");
//         tagDiv.classList.add("gallery-tag");
//         tagDiv.innerText =
//           tags[tagId]?.name || `UNKNOWN TAG (${tagId.toString()})`;
//         if (favoriteTags.includes(tagId))
//           tagDiv.classList.add("gallery-tag--favorite");
//         if (currentlySelected.includes(tagId))
//           tagDiv.classList.add("gallery-tag--selected");
//         tagsDiv.appendChild(tagDiv);
//       }
//     }
//     item.appendChild(tagsDiv);
//     let children = tagsDiv.children;
//     let totalWidth = 0;
//     for (let i = 0; i < children.length; i++)
//       totalWidth += children[i].clientWidth;
//     totalWidth += 8 * (children.length - 1) + 12;
//     if (totalWidth > tagsDiv.clientWidth) {
//       tagsDiv.setAttribute("data-total-width", totalWidth.toString());
//       let intersectionObserver = new IntersectionObserver(
//         (entries, observer) => {
//           let entry = entries[0];
//           if (entry.isIntersecting) {
//             if (!tagsDiv.classList.contains("animating"))
//               tagsDiv.classList.add("animating");
//           } else if (tagsDiv.classList.contains("animating"))
//             tagsDiv.classList.remove("animating");
//         }
//       );
//       intersectionObserver.observe(tagsDiv);
//     }
//   };

//   let dataTags = item
//     .getAttribute("data-tags")
//     ?.split(" ")
//     ?.map((i) => parseInt(i));

//   if (!dataTags) return;
//   if (!CONFIG["noFavoriteChips"])
//     addTagsDiv(
//       dataTags.filter((id) => {
//         return favoriteTags.includes(id);
//       }),
//       "gallery-tags" + (CONFIG["noRegularTagChips"] ? "" : " favorite-tags")
//     );
//   if (!CONFIG["noRegularTagChips"])
//     addTagsDiv(
//       dataTags.filter((id) => {
//         return !favoriteTags.includes(id);
//       }),
//       "gallery-tags"
//     );
// }

Promise.all([chrome.storage.local.get(), chrome.storage.sync.get()]).then(
  ([local, sync]) => {
    if (!local) local = {};
    if (!local["info"]) local["info"] = {};
    if (!local["list"]) local["list"] = {};
    if (!local["tags"]) local["tags"] = {};
    if (!sync["configuration"]) sync["configuration"] = {};
    if (!sync["favoriteTags"]) sync["favoriteTags"] = [];
    if (!sync["defaultSelectedTags"]) sync["defaultSelectedTags"] = [];
    if (!sync["currentlySelectedTags"]) sync["currentlySelectedTags"] = [];
    if (!sync["currentlyExcludedTags"]) sync["currentlyExcludedTags"] = [];
    if (!sync["defaultTagSorting"]) sync["defaultTagSorting"] = 0;

    info = local["info"];
    ratings = local["list"];
    tags = local["tags"];
    favoriteTags = sync["favoriteTags"];
    CONFIG = sync["configuration"];
    defaultSelected = sync["defaultSelectedTags"];
    currentlySelected = sync["currentlySelectedTags"];
    currentlyExcluded = sync["currentlyExcludedTags"];
    defaultSorting = sync["defaultTagSorting"];
    // console.log(CONFIG);

    inject();
    const mutationObserver = new MutationObserver((mutations) => {
      inject();
    });

    mutationObserver.observe(document.body, {
      childList: true,
    });

    chrome.storage.local.onChanged.addListener((changes) => {
      let changed = false;
      if (changes["info"]) {
        info = changes["info"].newValue || {};
        changed = true;
      }
      if (changes["list"]) {
        ratings = changes["list"].newValue || {};
        changed = true;
      }
      if (changes["tags"]) {
        tags = changes["tags"].newValue || {};
        changed = true;
      }
      if (changed) inject();
      highlightFavorite();
    });

    chrome.storage.sync.onChanged.addListener((changes) => {
      if (
        changes["favoriteTags"]?.newValue &&
        Array.isArray(changes["favoriteTags"]?.newValue)
      ) {
        favoriteTags = changes["favoriteTags"].newValue || [];
        inject();
      }
      if (changes["configuration"]?.newValue) {
        let testAnimate = false;
        if (CONFIG["noFavoriteChips"] && CONFIG["noRegularTagChips"])
          testAnimate = true;
        CONFIG = changes["configuration"].newValue || {};
        if (
          testAnimate &&
          !(CONFIG["noFavoriteChips"] && CONFIG["noRegularTagChips"])
        )
          animate();
        inject();
        highlightFavorite();
      }
      if (
        changes["defaultSelectedTags"]?.newValue &&
        Array.isArray(changes["defaultSelectedTags"]?.newValue)
      ) {
        defaultSelected = changes["defaultSelectedTags"].newValue || [];
        inject();
      }
      if (
        changes["currentlySelectedTags"]?.newValue &&
        Array.isArray(changes["currentlySelectedTags"]?.newValue)
      ) {
        currentlySelected = changes["currentlySelectedTags"].newValue || [];
        inject();
        highlightFavorite();
      }
      if (
        changes["currentlyExcludedTags"]?.newValue &&
        Array.isArray(changes["currentlyExcludedTags"]?.newValue)
      ) {
        currentlyExcluded = changes["currentlyExcludedTags"].newValue || [];
        inject();
      }
    });
    animate();
  }
);

function animate() {
  if (CONFIG && CONFIG["noFavoriteChips"] && CONFIG["noRegularTagChips"])
    return;
  forAll(".animating", (div) => {
    let scrollDirection = parseFloat(
      div.getAttribute("data-scroll-direction") || "1"
    );
    let totalWidth = parseInt(div.getAttribute("data-total-width") || "0");
    if (div.scrollLeft <= 0) scrollDirection = 1;
    else if (div.scrollLeft + div.clientWidth >= totalWidth)
      scrollDirection = -0.5;
    div.scrollLeft += scrollDirection;
    div.setAttribute("data-scroll-direction", scrollDirection.toString());
  });

  requestAnimationFrame(animate);
}

const highlightFavorite = async () => {
  // console.log("HIGHLIGHTING FAVORITES");
  // console.log(CONFIG);

  const highlight = (
    array: number[],
    className: string,
    ruleKey: keyof MyNHentaiListConfiguration
  ) => {
    let fT = document.getElementsByClassName(className);
    while (fT[0]) fT[0].classList.remove(className);

    if (!CONFIG || CONFIG[ruleKey]) return;

    for (let tag of array) {
      let tags = document.getElementsByClassName("tag-" + tag);
      // console.log(tags);
      for (let i = 0; i < tags.length; i++) {
        let tagHtml = tags[i] as HTMLAnchorElement;
        for (let j = 0; j < tagHtml.children.length; j++) {
          let child = tagHtml.children[j];
          if (
            child instanceof HTMLSpanElement &&
            child.classList.contains("name")
          )
            child.classList.add(className);
        }
      }
    }
  };
  highlight(favoriteTags ?? [], "favorite-tag", "noFavoriteHighlight");
  highlight(currentlySelected ?? [], "selected-tag", "noSearchingHighlight");
};

let removeClass = (className: string) => {
  let contextMenus = document.getElementsByClassName(className);
  while (contextMenus[0]) contextMenus[0].remove();
};

let htmlTagCollection = document.getElementsByClassName("tag");
let removeContextMenus = () => {
  document.body.style.overflow = "auto";
  removeClass("context-menu-container");
  removeClass("context-menu");
};

export const getSearchForTagURL = async (tagId: number) => {
  let knownTags = await getTags();
  if (!knownTags[tagId]) {
    let newKnown = await getToKnow(tagId);
    if (!newKnown) return null;
    knownTags = newKnown;
  }
  let sorting = 0;
  let researchTags = [];
  if (!CONFIG["dontChangeTagURLsSorting"]) {
    let defaultSorting = (await chrome.storage.sync.get("defaultTagSorting"))?.[
      "defaultTagSorting"
    ];
    if (defaultSorting) sorting = defaultSorting;
  }
  if (!CONFIG["dontChangeTagURLsDefaults"]) {
    let defaultTags =
      ((await chrome.storage.sync.get("defaultSelectedTags"))?.[
        "defaultSelectedTags"
      ] as undefined | number[]) || [];
    researchTags.push(...defaultTags);
  }
  let excludedTags = ((
    await chrome.storage.sync.get("currentlyExcludedTags")
  )?.["currentlyExcludedTags"] || []) as number[];

  if (!CONFIG["dontChangeTagURLsSelected"]) {
    let selectedTags =
      ((await chrome.storage.sync.get("currentlySelectedTags"))?.[
        "currentlySelectedTags"
      ] as undefined | number[]) ?? [];
    researchTags.push(
      ...selectedTags.filter((t) => {
        return !excludedTags.includes(t);
      })
    );
  }
  if (!CONFIG["dontChangeTagURLsExcluded"]) {
    researchTags.push(...excludedTags.map((t) => -t));
  }
  if (!researchTags.includes(tagId)) researchTags.push(tagId);
  let url = `https://nhentai.net/search/?q=${researchTags
    .map((id) => {
      let exclude = false;
      if (id < 0) {
        id = -id;
        exclude = true;
      }
      let tag = knownTags[id];
      if (!tag) {
        // alert("SOMETHING WENT WRONG WITH TAG " + id);
        return "";
      }
      return `${exclude ? "-" : ""}${tag.type}%3A"${tag.name}"`;
    })
    .join("+")
    .replace(/ /g, "+")}${
    sorting == 0 ? "" : `&sort=popular${["-today", "-week", ""][sorting - 1]}`
  }`;
  return url;
};
async function getToKnow(tagId: number) {
  let elm = document.getElementsByClassName(
    `tag-${tagId}`
  )[0] as HTMLAnchorElement;
  if (!elm) return;
  if (elm.classList.contains("modified-href")) return;
  let [_, type, name] = elm.href.match(/([^\/]+?)\/([^\/]+?)\/?$/) || [];
  if (!type || !name) {
    alert("SOMETHING WENT WRONG WITH TAG " + tagId);
    return;
  }
  let knownTags = await getTags();
  knownTags[tagId] = { id: tagId, type, name: name.replace(/[-+]/g, " ") };
  await chrome.storage.local.set({ tags: knownTags });
  return knownTags;
}
for (let i = 0; i < htmlTagCollection.length; i++) {
  let tag = htmlTagCollection[i] as HTMLAnchorElement;
  let tagId = Number(tag.className.match(/tag-([0-9]+)/)?.[1]);
  if (!tagId || isNaN(tagId)) continue;

  // console.log(tagId);
  tag.addEventListener("contextmenu", (ev) => {
    removeContextMenus();
    if (CONFIG["noTagContextMenu"]) return;
    ev.preventDefault();
    // console.log("contextmenu");
    ev.stopPropagation();
    chrome.storage.sync.get("favoriteTags", async (fT) => {
      let knownTags = await getTags();
      if (!knownTags[tagId]) {
        let newKnown = await getToKnow(tagId);
        if (!newKnown) return;
        knownTags = newKnown;
      }

      let favoriteTags = fT["favoriteTags"] as number[] | undefined;

      let mobile = isMobile();

      const createItem = (
        text: string | (() => string),
        onclick: (ev: MouseEvent) => any
      ) => {
        return new ElementBuilder("a")
          .addClass("context-menu-item")
          .setText(text)
          .addEventListener("click", onclick)
          .addEventListener("contextmenu", (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
          })
          .addEventListener("touchstart", (ev) => {
            if (mobile)
              (ev.target as HTMLAnchorElement).classList.add("highlighted");
          })
          .addEventListener("touchmove", (ev) => {
            if (mobile)
              (ev.target as HTMLAnchorElement).classList.remove("highlighted");
          })
          .build();
      };

      let contextMenu = new ElementBuilder("div")
        .addClass("context-menu")
        .addClass(mobile ? "mobile" : "desktop")
        .appendChildren(
          createItem(
            () => {
              return `${
                favoriteTags?.includes(tagId) ? "Unfavorite" : "Favorite"
              } ${knownTags[tagId]?.type || ""} ${
                knownTags[tagId]?.name ||
                document.getElementsByClassName("tag-" + tagId)[0]?.children[0]
                  ?.innerHTML ||
                tagId
              }`;
            },
            async (ev) => {
              if (favoriteTags?.includes(tagId))
                favoriteTags.splice(favoriteTags.indexOf(tagId), 1);
              else {
                if (!favoriteTags) favoriteTags = [];
                favoriteTags.push(tagId);
              }

              await chrome.storage.sync.set({ favoriteTags });
              // highlightFavorite();
            }
          ),
          createItem(
            `Search for ${knownTags[tagId]?.name || tagId} on this tab`,
            async (ev) => {
              let newURL = await getSearchForTagURL(tagId);
              if (!newURL) {
                alert("SOMETHING WENT WRONG WITH TAG " + tagId);
                return;
              }
              window.location.href = newURL;
            }
          ),
          createItem(
            `Search for ${knownTags[tagId]?.name || tagId} on new tab`,
            async (ev) => {
              let newURL = await getSearchForTagURL(tagId);
              if (!newURL) {
                alert("SOMETHING WENT WRONG WITH TAG " + tagId);
                return;
              }
              // let anchor = new ElementBuilder("a")
              //   .setAttribute("href", newURL)
              //   .setAttribute("target", "_blank")
              //   // .setAttribute("target", "_blank")
              //   .build();
              // anchor.style.display = "none";
              // document.body.appendChild(anchor);
              // anchor.click();
              // anchor.remove();

              // Open new tab on tab group
              chrome.runtime.sendMessage({
                type: "openTab",
                url: newURL,
              });
            }
          ),
          createItem(
            `${currentlySelected?.includes(tagId) ? "Remove" : "Add"} ${
              knownTags[tagId]?.name || tagId
            } ${currentlySelected?.includes(tagId) ? "from" : "to"} tag search`,
            async (ev) => {
              chrome.storage.sync.get("currentlySelectedTags", (cST) => {
                let currentlySelectedTags = cST["currentlySelectedTags"] || [];
                if (currentlySelectedTags.includes(tagId))
                  currentlySelectedTags.splice(
                    currentlySelectedTags.indexOf(tagId),
                    1
                  );
                else currentlySelectedTags.push(tagId);
                chrome.storage.sync.set({ currentlySelectedTags });
              });
            }
          )
        )
        .build();
      if (mobile) {
        let contextMenuContainer = new ElementBuilder("div")
          .addClass("context-menu-container")
          .appendChildren(contextMenu)
          .addEventListener("click", (ev) => {
            // ev.stopPropagation();
            // ev.preventDefault();
            removeContextMenus();
          })
          .build();
        document.body.style.overflow = "hidden";

        document.body.appendChild(contextMenuContainer);
      } else document.body.appendChild(contextMenu);
      if (!mobile) {
        if (
          (ev as MouseEvent).pageY + contextMenu.clientHeight >
          window.innerHeight - 4
        )
          contextMenu.style.top =
            (ev as MouseEvent).pageY - contextMenu.clientHeight + "px";
        else contextMenu.style.top = (ev as MouseEvent).pageY + "px";
        if (
          (ev as MouseEvent).pageX + contextMenu.clientWidth >
          window.innerWidth - 24
        )
          contextMenu.style.left =
            (ev as MouseEvent).pageX - contextMenu.clientWidth + "px";
        else contextMenu.style.left = (ev as MouseEvent).pageX + "px";
      }
    });
  });
}
window.addEventListener("click", removeContextMenus);
window.addEventListener("contextmenu", removeContextMenus);

let changeURL = async () => {
  htmlTagCollection = document.getElementsByClassName("tag");
  let s = new URLSearchParams(location.search);
  if (s.get("dontclose")) {
    if (htmlTagCollection.length == 0) return;
    let knownTags = await getTags();
    for (let i = 0; i < htmlTagCollection.length; i++) {
      let tagId = Number(
        (htmlTagCollection[i] as HTMLAnchorElement).className.match(
          /tag-([0-9]+)/
        )?.[1]
      );

      let elm = document.getElementsByClassName(
        `tag-${tagId}`
      )[0] as HTMLAnchorElement;
      if (!elm) {
        console.error(`No tag-${tagId}`);
        continue;
      }
      if (elm.classList.contains("modified-href")) return;
      let [_, type, name] = elm.href.match(/([^\/]+?)\/([^\/]+?)\/?$/) || [];
      if (!type || !name) {
        alert("SOMETHING WENT WRONG WITH TAG " + tagId);
        return;
      }
      knownTags[tagId] = { id: tagId, type, name: name.replace(/[-+]/g, " ") };
    }
    await chrome.storage.local.set({ tags: knownTags });
    // console.log("Tags updated");
    let searchParams = new URLSearchParams(location.search);
    let firstPage = parseInt(searchParams.get("page") || "0");

    let wait = (millis: number) =>
      new Promise((resolve) => setTimeout(resolve, millis));
    await wait(1500);

    let getNextPage = (currentPage: number, nextPage: number) =>
      currentPage > 0
        ? location.href.replace("page=" + currentPage, "page=" + nextPage)
        : location.href +
          "&page=" +
          nextPage; /* .replace(/&?dontclose=.+?(&|$)/gi, (a, g1) => g1) */

    let open = (...args: any[]) => {
      // let a = document.createElement("a");
      // a.href = args[0];
      // a.target = args[1];
      // a.click();
      window.location.replace(args[0]);
    };

    open(getNextPage(firstPage, firstPage + 1));
    return;
  }
  if (CONFIG && CONFIG["dontChangeTagURLs"]) {
    let htmlTagCollection = document.getElementsByClassName("tag");
    for (let i = 0; i < htmlTagCollection.length; i++) {
      let tag = htmlTagCollection[i] as HTMLAnchorElement;
      tag.classList.remove("modified-href");
      tag.href = tag.getAttribute("oldHref") || tag.href;
    }
    return;
  }
  for (let i = 0; i < htmlTagCollection.length; i++) {
    let tag = htmlTagCollection[i] as HTMLAnchorElement;
    let tagId = Number(tag.className.match(/tag-([0-9]+)/)?.[1]);
    if (!tagId || isNaN(tagId)) continue;
    let newURL = await getSearchForTagURL(tagId);
    if (!newURL) return;
    tag.classList.add("modified-href");
    if (!tag.getAttribute("oldHref")) tag.setAttribute("oldHref", tag.href);
    tag.href = newURL;
  }
};
changeURL();

chrome.storage.sync.get("favoriteTags").then((fT) => {
  chrome.storage.sync.get("configuration").then((cg) => {
    if (!fT || !fT["favoriteTags"]) return;
    favoriteTags = fT["favoriteTags"];
    CONFIG = cg["configuration"] ?? {};
    highlightFavorite();
  });
});

chrome.storage.sync.onChanged.addListener((changes) => {
  let _newFavoriteTags = changes["favoriteTags"]?.newValue;
  if (_newFavoriteTags && Array.isArray(_newFavoriteTags))
    favoriteTags = _newFavoriteTags;
  let _newConfig = changes["configuration"]?.newValue as
    | Partial<MyNHentaiListConfiguration>
    | undefined;
  if (_newConfig && Object.keys(_newConfig).length > 0) {
    // if (
    //   CONFIG["autoSearchOnSelect"] != _newConfig["autoSearchOnSelect"] ||
    //   (!CONFIG["noCustomSearchBar"] && _newConfig["noCustomSearchBar"])
    // )
    //   location.reload();

    CONFIG = _newConfig;
  }

  highlightFavorite();
  changeURL();
  inject();
});

let lastPage = 0;
let id = location.pathname.match(/\/g\/([0-9]+)/)?.[1];

if (id) {
  window.addEventListener("message", async (event) => {
    if (!id) return;
    let { data } = event;
    if (!data.type || data.type != "PAGE_CHANGE") return;
    let { page } = data;
    let info = await getInfo();
    if (!info[id]) return;

    if (
      (info[id].status != "reading" && info[id].status != "rereading") ||
      page > (info[id].last_page || -1)
    ) {
      let oldStatus = info[id].status;
      let lastPage = info[id].last_page || -1;
      let pages = info[id].num_pages || 0;
      let percent = pages > 0 ? page / pages : 0;

      let save = () => {
        if (!id) return;
        // if (oldStatus != info[id].status)
        //   console.log("NEW STATUS", info[id].status);
        // if (info[id].last_page != page)
        //   console.log(`${page} - ${info[id].last_page}`);

        info[id].last_page = page;
        info[id].last_read = Date.now();

        chrome.storage.local.set({ info });
      };
      let setStatus = (status: HentaiInfo["status"]) => {
        info[id!].status = status;
        if (status == "completed") {
          info[id!].times_read = (info[id!].times_read || 0) + 1;
          askRating(id!);
        }
        save();
      };
      let isStatus = (status: HentaiInfo["status"][]) =>
        status.includes(info[id!].status);

      if (!isStatus(["completed"])) {
        if (percent > 0.9) {
          setStatus("completed");
          return;
        }
      }
      if (
        (page == 1 && !isStatus(["reading", "rereading"])) ||
        (!isStatus(["completed", "reading", "rereading"]) && percent > 0.1)
      ) {
        if ((info[id].times_read || 0) > 0) setStatus("rereading");
        else setStatus("reading");
        return;
      }
      if (page > lastPage) save();
    }
  });

  getInfo().then((info) => {
    let _lp = info[id!]?.last_page;
    if (_lp) lastPage = _lp;
  });
}

async function askRating(id: string | number) {
  let ratings = await getRatings();
  let rating = ratings[id] ?? -1;
  if (document.getElementById("rating-asker")) return;
  let close = () => {
    document.getElementById("rating-asker")?.remove();
  };
  let save = async () => {
    let input = document.getElementById(
      "rating-asker-input"
    ) as HTMLInputElement;
    if (!input) {
      alert("Something went wrong...");
      return;
    }
    let newRating = parseFloat(input.value);
    if (
      (!newRating && newRating != 0) ||
      isNaN(newRating) ||
      newRating < 0 ||
      newRating > 10
    ) {
      alert("Invalid rating");
      return;
    }
    ratings[id] = newRating;
    await chrome.storage.local.set({ list: ratings });
    close();
  };
  let asker = new ElementBuilder("div")
    .setId("rating-asker")
    .addClass("rating-asker")
    .appendChildren(
      new ElementBuilder("div")
        .addClass("rating-asker-foreground")
        .appendChildren(
          new ElementBuilder("div")
            .addClass("rating-asker-text")
            .setText("Rate this doujin"),
          new ElementBuilder("div")
            .addClass("rating-asker-input-container")
            .appendChildren(
              new ElementBuilder("input")
                .addClass("rating-asker-input")
                .setId("rating-asker-input")
                .setAttribute("type", "number")
                .setAttribute("min", "0")
                .setAttribute("max", "10")
                .setAttribute("step", "0.1")
                .setAttribute(
                  "value",
                  rating == 0 || (rating && rating >= 0)
                    ? rating.toFixed(2)
                    : undefined
                )
                .setAttribute("placeholder", "0.0")
                .addEventListener("keydown", (ev) => {
                  if (ev.key == "Enter") save();
                })
            ),
          new ElementBuilder("div")
            .addClass("rating-asker-buttons")
            .appendChildren(
              new ElementBuilder("button")
                .addClass("rating-asker-button")
                .addClass("btn")
                .addClass("btn-primary")
                .setText("SAVE")
                .addEventListener("click", save),
              new ElementBuilder("button")
                .addClass("rating-asker-button")
                .addClass("btn")
                .addClass("btn-secondary")
                .setText("CLOSE")
                .addEventListener("click", close)
            )
        )
    );

  document.body.append(asker.build());
}
