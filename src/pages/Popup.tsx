import React, { useEffect, useState } from "react";
import Main from "./Main";
import "../sass/popup.scss";
import TagSearcher from "./TagSearcher";
import { InfoContextComponent } from "../context/infoContext";
import { RatingsContextComponent } from "../context/ratingsContext";
import { TagsContextComponent } from "../context/tagsContext";
import {
  SortingContext,
  SortingContextComponent,
} from "../context/sortingContext";
import ConfigPage from "./ConfigPage";

let event = new EventTarget();

export const Routing = {
  goTo(route: keyof typeof routes) {
    event.dispatchEvent(
      new CustomEvent("changeRoute", {
        detail: {
          route,
        },
      })
    );
  },
};

const routes = {
  "/": <Main />,
  "/tags": <TagSearcher />,
  "/config": <ConfigPage />,
} as const;

export default () => {
  const [route, setRoute] = useState<keyof typeof routes>("/");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("lastRoute", route);
  }, [route, loaded]);

  useEffect(() => {
    let lastRoute = localStorage.getItem("lastRoute");
    if (lastRoute && lastRoute in routes)
      setRoute(lastRoute as keyof typeof routes);
    const listener = (ev: CustomEvent<{ route: keyof typeof routes }>) =>
      setRoute(ev.detail.route);
    event.addEventListener("changeRoute", listener as any);
    setLoaded(true);
  }, []);

  return (
    <TagsContextComponent>
      <RatingsContextComponent>
        <InfoContextComponent>
          <SortingContextComponent>{routes[route]}</SortingContextComponent>
        </InfoContextComponent>
      </RatingsContextComponent>
    </TagsContextComponent>
  );
};
