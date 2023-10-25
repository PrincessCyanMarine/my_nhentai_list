import React, { useEffect, useMemo, useState } from "react";
import { Tag } from "../models/HentaiInfo";
import { getTags } from "../helpers/chromeGetter";

export const TagsContext = React.createContext({}) as React.Context<
  Record<number, Tag>
>;

export function TagsContextComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [_tags, setTags] = useState<Record<number, Tag>>({});
  const tags = useMemo(() => _tags, [_tags]);

  // const setTags = (tags: any) => {
  //   let _tags: Record<number, Tag> = {};
  //   for (let t in tags) _tags[tags[t].id] = tags[t];
  //   _setTags(_tags);
  //   chrome.storage.local.set({ tags: _tags });
  // };
  useEffect(() => {
    getTags().then(setTags);
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes["tags"]) setTags(changes["tags"].newValue);
    });
  }, []);

  return <TagsContext.Provider value={tags}>{children}</TagsContext.Provider>;
}
