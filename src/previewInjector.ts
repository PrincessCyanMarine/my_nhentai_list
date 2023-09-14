// import { ElementBuilder } from "../helpers/ElementBuilder";
// import { getImageURL } from "../helpers/HentaiInfoHelper";
// import { HentaiInfo } from "../models/HentaiInfo";
// import "../sass/previewInjector.scss";

// const ELEMENT_ID = "nhentai-doujinshi-preview-element";
// const rgx = /(https?:\/\/nhentai\.net\/g\/)?([0-9]{5,7})/g;
// var info!: Record<string, HentaiInfo>;

// var preview = new ElementBuilder("div")
//   .setId(ELEMENT_ID)
//   .appendChildren(
//     new ElementBuilder("div")
//       .setId(ELEMENT_ID + "-content")
//       .addText("test")
//       .build()
//   )
//   .build();

// chrome.storage.local.get("info", (data) => {
//   if (!data || !data["info"]) return;
//   info = data["info"];
//   if (!info) return;
//   document.body.appendChild(preview);
//   setDetectors();
//   activateDetectors();

//   //   let observer = new MutationObserver((mutations) => {
//   //     setDetectors();
//   //     activateDetectors();
//   //   });

//   //   observer.observe(document.body, {
//   //     childList: true,
//   //     subtree: true,
//   //   });
// });

// function setDetectors(root = document.body) {
//   for (let [elem, matches] of getElements(root)) {
//     if (elem.innerHTML.includes(ELEMENT_ID + "-hover")) continue;
//     for (let match of matches) {
//       //   console.log(elem, match);
//       let id = match.match(/[0-9]{5,7}/)?.[0];
//       if (!id) continue;

//       if (!info[id]) continue;
//       //   console.log(elem, id);

//       let onHoverElem = new ElementBuilder("span")
//         .setId(id)
//         .addText(match)
//         .addClass(ELEMENT_ID + "-hover")
//         .build();
//       //   console.log(onHoverElem);
//       elem.innerHTML = elem.innerHTML.replace(
//         new RegExp(match),
//         onHoverElem.outerHTML
//       );
//     }
//   }
// }

// function activateDetectors() {
//   let hoverDetectors = document.getElementsByClassName(ELEMENT_ID + "-hover");
//   for (let i = 0; i < hoverDetectors.length; i++) {
//     let onHover = hoverDetectors.item(i);
//     if (!onHover || !(onHover instanceof HTMLSpanElement)) continue;
//     if (onHover.classList.contains(ELEMENT_ID + "-detecting")) continue;
//     console.log(onHover);
//     onHover.classList.add(ELEMENT_ID + "-detecting");

//     // onHover.removeEventListener("mousemove", onmousemove);
//     onHover.addEventListener("mousemove", (ev: MouseEvent) => {
//       console.log("mousemove");
//       //   ev.preventDefault();
//       //   ev.stopPropagation();
//       let id = (onHover! as HTMLSpanElement).id;
//       //   console.log(info[id]);

//       if (preview.clientWidth + ev.clientX > window.innerWidth)
//         preview.style.left = window.innerWidth - preview.clientWidth + "px";
//       else preview.style.left = ev.clientX + "px";

//       if (preview.clientHeight + ev.clientY > window.innerHeight)
//         preview.style.top = window.innerHeight - preview.clientHeight + "px";
//       else preview.style.top = ev.clientY + "px";
//       //   preview.style.display = "block";
//       preview.style.opacity = "1";

//       let content = document.getElementById(ELEMENT_ID + "-content");
//       if (!content) return;
//       content.innerHTML = "";
//       let contentContainer = new ElementBuilder("div")
//         .addClass("content-container")
//         .appendChildren(
//           new ElementBuilder("p").addText(info[id]?.title.pretty).build(),
//           new ElementBuilder("img")
//             .setAttribute(
//               "src",
//               getImageURL(info[id], info[id]?.images.cover) || ""
//             )
//             .addClass(ELEMENT_ID + "-cover")
//             .build(),
//           new ElementBuilder("div")
//             .addClass("tags")
//             .appendChildren(
//               ...info[id]?.tags.map((tag) =>
//                 new ElementBuilder("span")
//                   .addText(tag.name)
//                   .addClass("tag")
//                   .build()
//               )
//             )
//             .build()
//         );
//       content.innerHTML = contentContainer.build().outerHTML;
//     });
//     let onmouseleave = () => {
//       preview.style.opacity = "0";
//     };
//     // onHover.removeEventListener("mouseleave", onmouseleave);
//     onHover.addEventListener("mouseleave", onmouseleave);
//     let onclick = (ev: MouseEvent) => {
//       ev.preventDefault();
//       ev.stopPropagation();
//       let id = (onHover! as HTMLSpanElement).id;
//       window.open("https://nhentai.net/g/" + id, "_blank");
//     };
//     // onHover.removeEventListener("click", onclick);
//     onHover.addEventListener("click", onclick);
//   }
// }

// function getElements(elem = document.body) {
//   let _getChildren = (elem: HTMLElement) => {
//     let elements: [HTMLElement, RegExpMatchArray][] = [];
//     let children = Array.from(elem.children);
//     if (children.length == 0) return elements;
//     for (let child of children) {
//       if (
//         !(child instanceof HTMLElement) ||
//         child instanceof HTMLScriptElement ||
//         child instanceof HTMLStyleElement
//       )
//         continue;
//       let _e = _getChildren(child);
//       elements.push(..._e);
//       if (_e.length > 0) continue;
//       if (
//         child.className.includes(ELEMENT_ID) ||
//         child.classList.contains(ELEMENT_ID + "-detected")
//       )
//         continue;
//       let match = child.innerText.match(rgx);
//       if (match) {
//         elements.push([child, match]);
//         child.classList.add(ELEMENT_ID + "-detected");
//       }
//     }
//     return elements;
//   };
//   return _getChildren(elem);
// }
