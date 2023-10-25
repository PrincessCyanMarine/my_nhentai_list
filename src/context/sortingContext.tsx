import React, { useContext, useEffect, useState } from "react";
import { InfoList } from "../models/RatingList";
import { getInfo, getTags } from "../helpers/chromeGetter";
import { TagsContext } from "./tagsContext";
import {
  SORTING_FUNCTIONS,
  SortingFunction,
} from "../components/Sorting/Definitions";

type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;
type Concat<T> = T extends [infer A, ...infer Rest]
  ? A extends any[]
    ? [...A, ...Concat<Rest>]
    : A
  : T;

export const SortingContext = React.createContext<unknown>(
  {}
) as React.Context<{
  sortingFunction: SortingFunction;
  setSortingFunction: (func: SortingFunction) => void;
  isSortingFunctionReverse: boolean;
  setIsSortingFunctionReverse: StateSetter<boolean>;
  forceSort: boolean;
  setForceSort: StateSetter<boolean>;
}>;

export function SortingContextComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sortingFunction, _setSortingFunction] = useState<SortingFunction>(
    SORTING_FUNCTIONS[0]
  );
  const [isSortingFunctionReverse, setIsSortingFunctionReverse] =
    useState<boolean>(false);
  const [sortingFunctionLoaded, setSortingFunctionLoaded] =
    useState<boolean>(false);
  const [forceSort, setForceSort] = useState<boolean>(false);

  useEffect(() => {
    if (sortingFunctionLoaded) return;
    chrome.storage.local.get("sortingFunction", (data) => {
      setSortingFunctionLoaded(true);
      if (!data || !data["sortingFunction"]) return;

      let funcName = data["sortingFunction"];
      if (funcName.endsWith("Reverse")) {
        funcName = funcName.slice(0, -7);
        setIsSortingFunctionReverse(true);
      } else setIsSortingFunctionReverse(false);
      for (let func of SORTING_FUNCTIONS) {
        if (func.name == funcName) {
          setSortingFunction(func);
          return;
        }
      }
    });
  }, [sortingFunctionLoaded, isSortingFunctionReverse]);

  useEffect(() => {
    // console.log(sortingFunction.name);
    if (!sortingFunctionLoaded) return;
    let funcName =
      sortingFunction.name + (isSortingFunctionReverse ? "Reverse" : "");
    chrome.storage.local.set({ sortingFunction: funcName });
  }, [sortingFunction, sortingFunctionLoaded]);

  const setSortingFunction = (func: SortingFunction) => {
    _setSortingFunction(typeof func == "function" ? func : () => func);
    setIsSortingFunctionReverse(false);
    // setShowSortingOptions(false);
    if (func.forceSort) setForceSort(true);
  };

  return (
    <SortingContext.Provider
      value={{
        sortingFunction,
        setForceSort,
        forceSort,
        setSortingFunction,
        isSortingFunctionReverse,
        setIsSortingFunctionReverse,
      }}
    >
      {children}
    </SortingContext.Provider>
  );
}
