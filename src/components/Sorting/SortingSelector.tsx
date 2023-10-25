import React, { useEffect, useState } from "react";
import { SORTING_FUNCTIONS, SortingFunction } from "./Definitions";
import styles from "./SortingSelector.module.scss";

export default ({
  setSortingFunction,
  sortingFunction,
  setIsSortingFunctionReverse,
  isSortingFunctionReverse,
}: {
  setSortingFunction: (func: SortingFunction) => void;
  sortingFunction: SortingFunction;
  setIsSortingFunctionReverse: React.Dispatch<React.SetStateAction<boolean>>;
  isSortingFunctionReverse: boolean;
}) => {
  function Direction({ value, text }: { value: boolean; text: string }) {
    return (
      <div
        className="button"
        style={{
          fontWeight: isSortingFunctionReverse == value ? "bold" : "normal",
          cursor: "pointer",
          padding: "16px",
          backgroundColor: isSortingFunctionReverse == value ? "#333" : "#444",
          color: "#fff",
          borderRadius: "8px",
        }}
        onClick={() => {
          setIsSortingFunctionReverse(() => value);
        }}
      >
        {text}
      </div>
    );
  }

  return (
    <div className={styles.sortingOptions} id="sorting-options">
      <div className={styles.options}>
        {SORTING_FUNCTIONS.map((_sortingFunction, index) => {
          return (
            <div
              key={index}
              className={`${styles.sortingOption}${
                sortingFunction.title == _sortingFunction.title
                  ? ` ${styles.active}`
                  : ""
              }`}
              onClick={() => {
                setSortingFunction(_sortingFunction);
              }}
            >
              {_sortingFunction.title}
            </div>
          );
        })}
      </div>
      {sortingFunction && sortingFunction.reversable && (
        <div className={styles.options}>
          <Direction text={sortingFunction.text.regular} value={false} />
          <Direction text={sortingFunction.text.reversed} value={true} />
        </div>
      )}
    </div>
  );
};
