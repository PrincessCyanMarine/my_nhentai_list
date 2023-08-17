import React, { ImgHTMLAttributes } from "react";
type RegularProps = React.DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;
type Props = RegularProps & {
  fallbackSrc: string;
};

export default (props: Props) => {
  let regularProps: RegularProps & { fallbackSrc?: string } = { ...props };
  delete regularProps.fallbackSrc;
  return props.src?.trim() ? (
    <img
      {...regularProps}
      onError={(ev) => {
        ev.currentTarget.src = props.fallbackSrc;
      }}
    />
  ) : (
    <img {...regularProps} src={props.fallbackSrc} />
  );
};
