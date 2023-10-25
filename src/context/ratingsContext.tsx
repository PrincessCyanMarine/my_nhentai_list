import React, { useEffect, useMemo, useState } from "react";
import { RatingList } from "../models/RatingList";
import { getRatings } from "../helpers/chromeGetter";

export const RatingsContext = React.createContext(
  {}
) as React.Context<RatingList>;

export function RatingsContextComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [_ratings, setRatings] = useState<RatingList>({});
  const ratings = useMemo(() => _ratings, [_ratings]);

  useEffect(() => {
    getRatings().then(setRatings);
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes["list"]) setRatings(changes["list"].newValue);
    });
  }, []);

  return (
    <RatingsContext.Provider value={ratings}>
      {children}
    </RatingsContext.Provider>
  );
}
