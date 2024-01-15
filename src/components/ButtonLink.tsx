import React, { HTMLAttributeAnchorTarget } from "react";
import { createTabOnGroup } from "../helpers/tabHelper";

export default ({
  children,
  href,
  target,
}: {
  children: React.ReactNode;
  href: string;
  target: HTMLAttributeAnchorTarget | undefined | "_background";
}) => {
  return (
    <a
      href={
        ["_blank", "_background"].includes(target as string) ? undefined : href
      }
      target={
        ["_blank", "_background"].includes(target as string)
          ? undefined
          : target
      }
      onClick={
        ["_blank", "_background"].includes(target as string)
          ? async () =>
              await createTabOnGroup(
                {
                  url: href,
                  active: target == "_blank",
                },
                await chrome.tabs.getCurrent()
              )
          : undefined
      }
      style={{
        display: "contents",
      }}
    >
      <button>{children}</button>
    </a>
  );
};
