import React, { HTMLAttributeAnchorTarget } from "react";

export default ({
  children,
  href,
  target,
}: {
  children: React.ReactNode;
  href: string;
  target: HTMLAttributeAnchorTarget | undefined;
}) => {
  return (
    <a
      href={href}
      target={target}
      style={{
        display: "contents",
      }}
    >
      <button>{children}</button>
    </a>
  );
};
