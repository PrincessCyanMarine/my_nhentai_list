import React, { useEffect, useState } from "react";
import { Tag } from "../models/HentaiInfo";
import { createTabOnGroup } from "../helpers/tabHelper";

export default ({
  tag,
  animationDelay,
  className,
  textHighlighter,
  onClick,
  onContextMenu,
}: {
  tag?: Tag;
  animationDelay?: number;
  className: string;
  textHighlighter: (tag?: Tag) => JSX.Element;
  onClick?: (
    tag: Tag,
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
  onContextMenu?: (
    tag: Tag,
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
}) => {
  if (!animationDelay) animationDelay = 0;

  return (
    <a
      className={className}
      onClick={async (ev) => {
        if (onClick && tag) onClick(tag, ev);
        else {
          let url = tag
            ? `https://nhentai.net/${tag.type}/${tag.name.replace(/\s/, "-")}`
            : undefined;
          if (url)
            createTabOnGroup(
              { url, active: true },
              await chrome.tabs.getCurrent()
            );
        }
      }}
      onContextMenu={(e) => onContextMenu && tag && onContextMenu(tag, e)}
      style={{
        animationDelay: `${animationDelay + 0.1}s`,
      }}
    >
      <span>{textHighlighter(tag)}</span>
    </a>
  );
};
