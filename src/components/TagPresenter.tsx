import React from "react";
import { Tag } from "../models/HentaiInfo";
import TagComponent from "./TagComponent";

export default ({
  tags,
  tagClassName,
  presenterClassName,
  textHighlighter,
  onClick,
  selected,
  selectedClassName,
  onContextMenu,
}: {
  tags?: Tag[];
  tagClassName?: string;
  presenterClassName?: string;
  textHighlighter?: (tag?: Tag) => JSX.Element;
  onClick?: (
    tag: Tag,
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
  onContextMenu?: (
    tag: Tag,
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
  selected?: number[];
  selectedClassName?: string | ((tag: Tag) => string);
}) => {
  return (
    <div className={presenterClassName}>
      {tags?.map((tag, i) => {
        let _delay = 0.1 * Math.ceil((i + 1) / 2);
        return (
          <TagComponent
            textHighlighter={
              textHighlighter ?? (() => <>{tag?.name || "NO NAME FOUND"}</>)
            }
            className={`${tagClassName}${
              selected?.includes(tag.id) && selectedClassName
                ? ` ${
                    typeof selectedClassName == "string"
                      ? selectedClassName
                      : selectedClassName(tag)
                  }`
                : ""
            }`}
            tag={tag}
            key={tag.id}
            animationDelay={_delay}
            onClick={onClick}
            onContextMenu={onContextMenu}
          />
        );
      })}
    </div>
  );
};
