import React, { ImgHTMLAttributes } from "react";
type RegularProps = React.DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;
type Props = RegularProps & {
  fallbackSrc: string;
};

export default (props: Props) => {
  let { fallbackSrc } = props;
  return props.src?.trim() ? (
    <img
      {...props}
      onError={(ev) => {
        ev.currentTarget.src = fallbackSrc || ev.currentTarget.src;
      }}
    />
  ) : (
    <img {...props} src={fallbackSrc} />
  );
};
