import React from "react";
import { HentaiInfo, STATUS_NAME } from "../models/HentaiInfo";

export default ({
  className,
  onChange,
  selected,
  extra,
}: {
  className?: string;
  onChange?: (status: string) => void | undefined;
  selected?: string;
  extra?: [string, string][];
}) => {
  return (
    <select
      className={className}
      onChange={(ev) => onChange?.(ev.target.value)}
    >
      {[
        undefined,
        "reading",
        "completed",
        "on_hold",
        "dropped",
        "plan_to_read",
        "rereading",
        ...(extra || []),
      ].map((value) => {
        let text;
        if (value) {
          if (Array.isArray(value)) {
            text = value[1];
            value = value[0];
          } else {
            text = STATUS_NAME(value);
          }
        }
        return (
          <option value={value} selected={selected == value ? true : undefined}>
            {text}
          </option>
        );
      })}
    </select>
  );
};
