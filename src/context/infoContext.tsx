import React, { useContext, useEffect, useMemo, useState } from "react";
import { InfoList } from "../models/RatingList";
import { getInfo, getTags } from "../helpers/chromeGetter";
import { TagsContext } from "./tagsContext";

export const InfoContext = React.createContext({}) as React.Context<InfoList>;

export function InfoContextComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [_info, setInfo] = useState<InfoList>({});
  const info = useMemo(() => _info, [_info]);

  useEffect(() => {
    getInfo().then(setInfo);
    chrome.storage.local.onChanged.addListener(async (changes) => {
      if (changes["info"]) setInfo(changes["info"].newValue);
    });
  }, []);

  return <InfoContext.Provider value={info}>{children}</InfoContext.Provider>;
}
