import React, { useEffect, useState } from "react";
import FallbackImage from "./FallbackImage";
import { getImageURL } from "../helpers/HentaiInfoHelper";
import { HentaiInfo, Tag } from "../models/HentaiInfo";
import styles from "../sass/HentainInfo.module.scss";
import Fuse from "fuse.js";

export default ({
  info,
  rating,
  id,
  match,
}: {
  id: number | string;
  info?: HentaiInfo;
  rating?: number;
  match?: Fuse.FuseResult<HentaiInfo>;
}) => {
  const [groups, setGroups] = useState<Tag[]>([]);
  const [artists, setArtists] = useState<Tag[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (info) {
      setGroups(info?.tags.filter((tag) => tag.type == "group"));
      setArtists(info?.tags.filter((tag) => tag.type == "artist"));
      setTags(
        info?.tags.filter((tag) => !["artist", "group"].includes(tag.type))
      );
    }
  }, [info]);

  const Tag = ({ tag }: { tag: Tag }) => {
    return (
      <a
        key={tag.id}
        className={styles.tag}
        onClick={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          chrome.tabs.create({
            url: `https://nhentai.net/${tag.type}/${tag.name.replace(
              /\s/,
              "-"
            )}`,
          });
        }}
      >
        <span
          dangerouslySetInnerHTML={{
            __html: textHighlighter(tag.name, "tags.name"),
          }}
        ></span>
      </a>
    );
  };

  const TagPresenter = ({ tags }: { tags?: Tag[] }) => {
    return (
      <div className={styles.tag_presenter}>
        {tags?.map((tag) => (
          <Tag tag={tag} key={tag.id} />
        ))}
      </div>
    );
  };

  function textHighlighter(text: string, key: string) {
    const matches = match?.matches?.filter((m) => m.key == key);
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
    return result;
  }

  return (
    <div
      className={styles.item}
      onClick={() => {
        chrome.tabs.create({ url: `https://nhentai.net/g/${id}` });
      }}
    >
      <div className={styles.image}>
        <FallbackImage
          src={getImageURL(info, info?.images?.cover)}
          alt="cover"
          fallbackSrc={chrome.runtime.getURL("assets/unavailable.png")}
        />
      </div>

      {rating ? (
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
      <p className={styles.id}>
        <span
          dangerouslySetInnerHTML={{
            __html: textHighlighter(id.toString(), "id"),
          }}
        ></span>
      </p>
      {info?.title?.pretty ? (
        <p className={styles.title}>
          <span
            dangerouslySetInnerHTML={{
              __html: textHighlighter(info.title.pretty, "title.pretty"),
            }}
          ></span>
        </p>
      ) : (
        <p className={styles.title}>NO TITLE INFORMATION</p>
      )}
      {info?.num_pages ? (
        <p className={styles.pages}>
          {info.num_pages} {info.num_pages > 1 ? "pages" : "page"}
        </p>
      ) : (
        <p className={styles.pages}>NO PAGE INFORMATION</p>
      )}
      {info?.tags?.find((tag) => tag.type == "language") && (
        <p className={styles.language}>
          <Tag tag={info!.tags!.find((tag) => tag.type == "language")!} />
        </p>
      )}
      {artists.length > 0 && (
        <div className={styles.artist}>
          <h3>Artists:</h3>
          <TagPresenter
            tags={info?.tags.filter((tag) => tag.type == "artist")}
          />
        </div>
      )}
      {groups.length > 0 && (
        <div className={styles.group}>
          <h3>Groups:</h3>
          <TagPresenter tags={groups} />
        </div>
      )}
      {tags.length > 0 && (
        <div className={styles.tags}>
          <h3>Tags:</h3>
          <TagPresenter
            tags={info?.tags.filter(
              (tag) => !["artist", "group", "language"].includes(tag.type)
            )}
          />
        </div>
      )}

      <button
        className={styles.remove}
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
            chrome.storage.sync.get("list", (data) => {
              let _list = data["list"] || {};
              delete _list[id];
              chrome.storage.sync.set({ list: _list });
            });
          }
        }}
      >
        DELETE
      </button>
    </div>
  );
};
