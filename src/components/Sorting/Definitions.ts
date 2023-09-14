import { InfoList, RatingList } from "../../models/RatingList";
import { IconType } from "react-icons/lib";

const _sortByNumber = (a?: number | null, b?: number | null) => {
  if (a && b) {
    return b - a;
  } else if (a) {
    return -1;
  } else if (b) {
    return 1;
  } else {
    return 0;
  }
};

const _sortByString = (a?: string | null, b?: string | null) => {
  if (a && b) {
    return a.localeCompare(b);
  } else if (a) {
    return -1;
  } else if (b) {
    return 1;
  } else {
    return 0;
  }
};

export type SortingFunction = {
  name: string;
  title: string;
  fun: (props: {
    a: string;
    b: string;
    info: InfoList | null;
    ratings: RatingList | null;
    reversed: boolean;
  }) => number;
  forceSort?: boolean;
} & (
  | {
      reversable: true;
      text: {
        regular: string;
        reversed: string;
      };
    }
  | {
      reversable: false;
    }
);

export const SORTING_FUNCTIONS: SortingFunction[] = [
  {
    name: "sortByScore",
    title: "Score",
    fun: ({ a, b, ratings }) => _sortByNumber(ratings?.[a], ratings?.[b]),
    reversable: true,
    text: {
      regular: "9 -> 1",
      reversed: "1 -> 9",
    },
  },
  {
    name: "sortById",
    title: "Id",
    fun: ({ a, b }) => _sortByNumber(Number(a), Number(b)) * -1,
    reversable: true,
    text: {
      regular: "1 -> 9",
      reversed: "9 -> 1",
    },
  },
  {
    name: "sortByTitle",
    title: "Title",
    fun: ({ a, b, info }) =>
      _sortByString(
        info?.[a]?.title.pretty ?? "NO TITLE INFORMATION",
        info?.[b]?.title.pretty ?? "NO TITLE INFORMATION"
      ),
    reversable: true,
    text: {
      regular: "A -> Z",
      reversed: "Z -> A",
    },
  },
  {
    name: "sortByPages",
    title: "Pages",
    fun: ({ a, b, info, reversed }) => {
      let _f = reversed ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      return (
        _sortByNumber(info?.[a]?.num_pages ?? _f, info?.[b]?.num_pages ?? _f) *
        -1
      );
    },
    reversable: true,
    text: {
      regular: "1 -> 9",
      reversed: "9 -> 1",
    },
  },
  {
    name: "sortByLastRead",
    title: "Last Read",
    reversable: true,
    fun: ({ a, b, info, reversed }) => {
      let _f = reversed ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
      return _sortByNumber(
        info?.[a]?.last_read ?? _f,
        info?.[b]?.last_read ?? _f
      );
    },
    text: {
      regular: "1 -> 9",
      reversed: "9 -> 1",
    },
  },
  {
    name: "sortByFirstRead",
    title: "First Read",
    reversable: true,
    fun: ({ a, b, info, reversed }) => {
      let _f = reversed ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
      return _sortByNumber(
        info?.[a]?.first_read ?? _f,
        info?.[b]?.first_read ?? _f
      );
    },
    text: {
      regular: "1 -> 9",
      reversed: "9 -> 1",
    },
  },
  {
    name: "sortByRandom",
    title: "Random",
    fun: () => Math.random() - 0.5,
    reversable: false,
    forceSort: true,
  },
];
