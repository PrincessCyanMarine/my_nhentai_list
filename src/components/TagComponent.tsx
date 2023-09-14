import React, { useEffect, useState } from "react";
import { Tag } from "../models/HentaiInfo";

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
      onClick={(ev) => onClick && tag && onClick(tag, ev)}
      onContextMenu={(e) => onContextMenu && tag && onContextMenu(tag, e)}
      href={
        !onClick && tag
          ? `https://nhentai.net/${tag.type}/${tag.name.replace(/\s/, "-")}`
          : undefined
      }
      target="_blank"
      style={{
        animationDelay: `${animationDelay + 0.1}s`,
      }}
    >
      <span>{textHighlighter(tag)}</span>
    </a>
  );
};
