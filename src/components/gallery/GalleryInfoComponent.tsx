import React, { useEffect, useRef, useState } from "react";
import FallbackImage from "../FallbackImage";
import { getImageURL } from "../../helpers/HentaiInfoHelper";
import { HentaiInfo, Tag } from "../../models/HentaiInfo";
import styles from "../../sass/HentainInfo.module.scss";
import Fuse from "fuse.js";
import { MdOutlineExpandLess, MdOutlineExpandMore } from "react-icons/md";
import ButtonLink from "../ButtonLink";
import TagComponent from "../TagComponent";
import TagPresenter from "../TagPresenter";
import { MyNHentaiListConfiguration } from "../../pages/ConfigPage";

export default ({
  rating,
  //   allTags,
  CONFIG,
  _tags,
  image,
  id,
  info,
  favorites,
}: {
  _tags: Tag[];
  id: number | string;
  info?: HentaiInfo;
  rating?: number;
  favorites?: number[];
  //   match?: Fuse.FuseResult<HentaiInfo>;
  //   select: (id: number | string) => void;
  //   selected: boolean;
  //   allTags: Record<number, Tag>;
  //   setRef?: React.Dispatch<
  //     React.SetStateAction<React.RefObject<HTMLDivElement | null> | null>
  //   >;
  CONFIG: Partial<MyNHentaiListConfiguration>;

  image: {
    src: string;
    width: number;
    height: number;
  };
}) => {
  const [groups, setGroups] = useState<Tag[]>([]);
  const [artists, setArtists] = useState<Tag[]>([]);
  const [languages, setLanguages] = useState<Tag[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [extraInfoShown, setExtraInfoShown] = useState(false);

  // const [_tags, _setTags] = useState<Tag[]>([]);

  // useEffect(() => {
  //   let __tags: Tag[] = [];
  //   for (let t of info?.tags || []) {
  //     let _tag = allTags[t];
  //     if (_tag) __tags.push(_tag);
  //   }
  //   _setTags(__tags);
  // }, [info, allTags]);

  // useEffect(() => {
  //   console.log(extraInfoShown);
  // }, [extraInfoShown]);

  useEffect(() => {
    if (_tags) {
      // console.log(info.tags);
      // console.log(_tags);
      setGroups(_tags.filter((tag) => tag.type == "group"));
      setArtists(_tags.filter((tag) => tag.type == "artist"));
      setLanguages(_tags.filter((tag) => tag.type == "language"));
      setTags(
        _tags.filter(
          (tag) => !["artist", "group", "language"].includes(tag.type)
        )
      );
    }
  }, [_tags]);

  //   function textHighlighter(text: string, key: string) {
  //     const matches = match?.matches?.filter((m) => m.key == key);
  //     if (!matches || matches.length == 0) return text;
  //     let result = "";
  //     let last = 0;
  //     for (const match of matches) {
  //       if (match.value != text) continue;
  //       for (const index of match.indices) {
  //         result += text.slice(last, index[0]);
  //         result += `<span class="${styles.highlight}">`;
  //         result += text.slice(index[0], index[1] + 1);
  //         result += "</span>";
  //         last = index[1] + 1;
  //       }
  //     }
  //     result += text.slice(last);
  //     return result;
  //   }

  //   function tagHighlighter(tag?: Tag): JSX.Element {
  //     let text = tag?.name || "NO NAME FOUND";
  //     const matches = match?.matches;
  //     if (!matches || matches.length == 0) return <>{text}</>;
  //     let result = "";
  //     let last = 0;
  //     for (const match of matches) {
  //       if (match.value != text) continue;
  //       for (const index of match.indices) {
  //         result += text.slice(last, index[0]);
  //         result += `<span class="${styles.highlight}">`;
  //         result += text.slice(index[0], index[1] + 1);
  //         result += "</span>";
  //         last = index[1] + 1;
  //       }
  //     }
  //     result += text.slice(last);
  //     return <span dangerouslySetInnerHTML={{ __html: result }} />;
  //   }

  //   const ref = useRef<HTMLDivElement | null>(null);

  //   useEffect(() => {
  //     if (setRef) setRef(ref);
  //   }, [ref]);

  return (
    <div
      // style={
      //   setRef && {
      //     border: "5px solid #ff0000",
      //   }
      // }
      className={`${styles.item}${
        extraInfoShown ? ` ${styles.extraInfoShown}` : ""
      }${/* selected ? ` ${styles.selected}` : "" */ ""}`}
      onClick={() => {
        // chrome.tabs.create({ url: `https://nhentai.net/g/${id}` });
      }}
    >
      <div className={`${styles.image}`}>
        <FallbackImage
          //   onClick={() => {
          //     select(id);
          //   }}
          src={/* getImageURL(info, info?.images?.cover) */ image.src}
          className={CONFIG.censorImages ? styles.censored : ""}
          alt="cover"
          fallbackSrc={chrome.runtime.getURL("assets/unavailable.png")}
        />
      </div>

      <span
        onClick={() => {
          let newRating = prompt("Type new rating", rating?.toString() || "0");
          if (newRating) {
            // console.log(newRating);
            chrome.storage.local.get("list", (data) => {
              let _list = data["list"] || {};
              _list[id] = Math.min(Math.max(parseFloat(newRating!), -1), 10);
              if (_list[id] < 0) delete _list[id];
              chrome.storage.local.set({ list: _list });
            });
          }
        }}
      >
        {(rating && rating >= 0) || rating == 0 ? (
          <p
            className={`${styles.rating} ${
              rating >= 6
                ? styles.good
                : rating >= 4
                ? styles.average
                : styles.bad
            }`}
          >
            &#9733; {rating.toFixed(2)}
          </p>
        ) : (
          <p className={styles.rating}>NOT RATED</p>
        )}
      </span>
      <div className={styles.readDate}>
        <span>
          {info?.first_read
            ? new Date(info.first_read).toLocaleDateString() +
              " " +
              new Date(info.first_read).toLocaleTimeString()
            : "NO DATE INFORMATION"}
        </span>
        <span>
          {info?.last_read
            ? new Date(info.last_read).toLocaleDateString() +
              " " +
              new Date(info.last_read).toLocaleTimeString()
            : "NO DATE INFORMATION"}
        </span>
      </div>
      <p
        className={styles.id}
        onClick={(ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          //   select(id);
        }}
      >
        <span
        //   dangerouslySetInnerHTML={{
        //     __html: textHighlighter(id.toString(), "id"),
        //   }}
        >
          {id.toString()}
        </span>
      </p>
      {info?.title?.pretty ? (
        <p className={styles.title}>
          <span
          // dangerouslySetInnerHTML={{
          //   __html: textHighlighter(info.title.pretty, "title.pretty"),
          // }}
          >
            {info.title.pretty}
          </span>
        </p>
      ) : (
        <p className={styles.title}>NO TITLE INFORMATION</p>
      )}
      <div className={styles.read}>
        <ButtonLink href={`https://nhentai.net/g/${id}`} target="_blank">
          READ
        </ButtonLink>
      </div>
      {info?.num_pages ? (
        <p className={styles.pages}>
          {info.num_pages} {info.num_pages > 1 ? "pages" : "page"}
        </p>
      ) : (
        <p className={styles.pages}>NO PAGE INFORMATION</p>
      )}
      {languages && (
        <p className={styles.language}>
          <TagComponent
            // textHighlighter={tagHighlighter}
            textHighlighter={(tag) => <>{tag?.name || "NO NAME FOUND"}</>}
            className={`${styles.tag} ${
              /* match ? styles.notHighlighted : */ ""
            }`}
            tag={languages.find(
              (tag) => tag.type == "language" && tag.name != "translated"
            )}
          />
        </p>
      )}

      {extraInfoShown ? (
        <div className={styles.extraInfo}>
          {artists.length > 0 && (
            <div className={styles.artist}>
              <h3>Artists:</h3>
              <TagPresenter
                favorites={favorites}
                favoriteClassName={styles.favorite}
                // textHighlighter={tagHighlighter}
                textHighlighter={(tag) => <>{tag?.name || "NO NAME FOUND"}</>}
                tagClassName={`${styles.tag} ${
                  /* match ? styles.notHighlighted : */ ""
                }`}
                presenterClassName={styles.tag_presenter}
                tags={artists}
              />
            </div>
          )}
          {groups.length > 0 && (
            <div className={styles.groups}>
              <h3>Groups:</h3>
              <TagPresenter
                favorites={favorites}
                favoriteClassName={styles.favorite}
                // textHighlighter={tagHighlighter}
                textHighlighter={(tag) => <>{tag?.name || "NO NAME FOUND"}</>}
                tagClassName={`${styles.tag} ${
                  /* match ? styles.notHighlighted : */ ""
                }`}
                presenterClassName={styles.tag_presenter}
                tags={groups}
              />
            </div>
          )}
          {tags.length > 0 && (
            <div className={styles.tags}>
              <h3>Tags:</h3>
              <TagPresenter
                favorites={favorites}
                favoriteClassName={styles.favorite}
                // textHighlighter={tagHighlighter}
                textHighlighter={(tag) => <>{tag?.name || "NO NAME FOUND"}</>}
                tagClassName={`${styles.tag} ${
                  /*  match ? styles.notHighlighted : */ ""
                }`}
                presenterClassName={styles.tag_presenter}
                tags={tags.filter(
                  (tag) => !["artist", "group", "language"].includes(tag.type)
                )}
              />
            </div>
          )}
          <p
            className={styles.remove}
            style={{
              animationDelay: `${
                0.1 * Math.ceil((tags.length + 1) / 2) + 0.1
              }s`,
            }}
            onClick={(ev) => {
              ev.stopPropagation();
              ev.preventDefault();
              if (
                confirm(
                  "Are you sure you want to delete this hentai's information?"
                )
              ) {
                chrome.storage.local.get("info", (data) => {
                  let _info = data["info"] || {};
                  delete _info[id];
                  chrome.storage.local.set({ info: _info });
                });
                chrome.storage.local.get("list", (data) => {
                  let _list = data["list"] || {};
                  delete _list[id];
                  chrome.storage.local.set({ list: _list });
                });
              }
            }}
          >
            DELETE
          </p>
          <div
            onClick={(ev) => {
              ev.stopPropagation();
              ev.preventDefault();
              setExtraInfoShown(false);
            }}
            className={styles.showLess}
          >
            <a>
              <MdOutlineExpandLess />
            </a>
          </div>
        </div>
      ) : (
        <div
          onClick={(ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            setExtraInfoShown(true);
          }}
          className={styles.showMore}
        >
          <a>
            <MdOutlineExpandMore />
          </a>
        </div>
      )}
    </div>
  );
};
