import React, { useMemo } from "react";

import { VscArrowLeft } from "react-icons/vsc";
import { Routing } from "./Popup";
import { useSyncedDefault } from "../hooks/useStorage";

export type MyNHentaiListConfiguration = Partial<{
  noFavoriteChips: boolean;
  noRegularTagChips: boolean;
  hideRatingOnGallery: boolean;
  hideReadOnGallery: boolean;
  noFavoriteHighlight: boolean;
  noSearchingHighlight: boolean;
  noTagContextMenu: boolean;
  noDefaultAddToSearch: boolean;
  noFavoriteAddToSearch: boolean;
  noCurrentlySelectedAddToSearch: boolean;
  ignoreCurrentlyExcludedInAddToSearch: boolean;
  noRemoveFromSearch: boolean;
  censorImages: boolean;
  dontChangeTagURLs: boolean;
  dontChangeTagURLsDefaults: boolean;
  dontChangeTagURLsSelected: boolean;
  dontRedirectSearchToAdvanced: boolean;
  noExcludeFromSearch: boolean;
  customSearchMode: SEARCH_MODE;
  noCustomSearchBar: boolean;
  noCustomAutoComplete: boolean;
  showFullTagsListOnAutoComplete: boolean;
  enterToSearch: boolean;
  dontChangeTagURLsSorting: boolean;
}>;

export enum SEARCH_MODE {
  DEFAULT,
  SEARCH,
  MULTIPLE,
}

type KeysMatching<V> = {
  [K in keyof MyNHentaiListConfiguration]-?: MyNHentaiListConfiguration[K] extends
    | undefined
    | V
    ? K
    : never;
}[keyof MyNHentaiListConfiguration];

export default () => {
  const { _value: CONFIG, _setDefaultValue: _setConfig } = useSyncedDefault<
    Partial<MyNHentaiListConfiguration>
  >("configuration", {});

  function toggle(key: KeysMatching<boolean>) {
    _setConfig({
      ...CONFIG,
      [key]: !(CONFIG[key] ?? false),
    });
  }

  function Option({
    configKey: key,
    text,
    type,
    inverted,
  }: {
    configKey: KeysMatching<boolean>;
    text: string;
    type: 0;
    inverted?: boolean;
  }) {
    let state = !(CONFIG[key] ?? false);
    if (inverted) state = !state;
    return [
      <label key={key}>
        <p>
          <input
            onChange={(ev) => toggle(key)}
            type="checkbox"
            checked={state}
          />{" "}
          <a>{text}</a>
        </p>
      </label>,
    ][type];
  }

  function Options({
    options,
  }: {
    options: (
      | [KeysMatching<boolean>, string, 0]
      | [KeysMatching<boolean>, string, 0, boolean]
    )[];
  }) {
    return (
      <>
        <p
          style={{
            display: "flex",
            gap: "1em",
          }}
        >
          <button
            onClick={() => {
              _setConfig((s) => {
                let _s: Partial<Record<keyof MyNHentaiListConfiguration, any>> =
                  {};
                for (let [key, _, type] of options)
                  if (type == 0) _s[key] = true;
                return {
                  ...s,
                  ..._s,
                };
              });
            }}
          >
            NONE
          </button>
          <button
            onClick={() => {
              _setConfig((s) => {
                let _s: Partial<Record<keyof MyNHentaiListConfiguration, any>> =
                  {};
                for (let [key, _, type] of options)
                  if (type == 0) _s[key] = false;
                return {
                  ...s,
                  ..._s,
                };
              });
            }}
          >
            ALL
          </button>
        </p>
        {options.map(([key, text, type, inverted]) => {
          return (
            <Option
              configKey={key}
              text={text}
              type={type}
              inverted={inverted}
            />
          );
        })}
      </>
    );
  }

  return (
    <div>
      <div id="topbar">
        <button
          style={{
            width: "100%",
            textAlign: "left",
          }}
          onClick={() => {
            Routing.goTo("/");
          }}
        >
          <VscArrowLeft />
        </button>
      </div>
      <main>
        <h1>Config</h1>
        <button
          onClick={() => {
            _setConfig({});
          }}
        >
          RESTORE DEFAULT
        </button>
        <h2>Gallery</h2>
        <Options
          options={[
            ["noFavoriteChips", "Favorite tags chips", 0],
            ["noRegularTagChips", "Other tags chips", 0],
            ["hideRatingOnGallery", "Show rating", 0],
            ["hideReadOnGallery", "Show read marker", 0],
          ]}
        />
        <Option
          configKey="censorImages"
          text="Censor images"
          type={0}
          inverted
        />
        <h2>Search</h2>
        <Options
          options={[
            ["noDefaultAddToSearch", 'Include defaults on "add to search"', 0],
            [
              "noFavoriteAddToSearch",
              'Include favorites on "add to search"',
              0,
            ],
            [
              "noCurrentlySelectedAddToSearch",
              'Include currently selected on "add to search"',
              0,
            ],
            ["noExcludeFromSearch", 'Show "exclude from search" options', 0],
            ["noRemoveFromSearch", 'Show "remove from search" options', 0],
            [
              "dontRedirectSearchToAdvanced",
              "Redirect search to advanced search",
              0,
            ],
          ]}
        />
        <Option
          configKey="ignoreCurrentlyExcludedInAddToSearch"
          type={0}
          text="Show tags to add to search even if they are set as excluded"
          inverted
        />
        <h3>Autocomplete</h3>
        <Option
          configKey="noCustomSearchBar"
          type={0}
          text="Add autocomplete to search bar"
        />
        {!CONFIG["noCustomSearchBar"] && (
          <>
            <Option
              configKey="noCustomAutoComplete"
              type={0}
              text="Use default autocomplete"
              inverted
            />
            {!CONFIG["noCustomAutoComplete"] && (
              <>
                <p>
                  Search mode:{" "}
                  <button
                    // configKey="customSearchMode"
                    // type={1}
                    // text="Auto search on autocomplete select"
                    // inverted
                    onClick={() => {
                      _setConfig({
                        ...CONFIG,
                        customSearchMode:
                          ((CONFIG["customSearchMode"] || SEARCH_MODE.DEFAULT) +
                            1) %
                          3,
                      });
                    }}
                  >
                    {
                      {
                        [SEARCH_MODE.DEFAULT]: "Default",
                        [SEARCH_MODE.SEARCH]: "Search",
                        [SEARCH_MODE.MULTIPLE]: "Multiple",
                      }[CONFIG["customSearchMode"] ?? SEARCH_MODE.DEFAULT]
                    }
                  </button>
                </p>

                <Option
                  configKey="showFullTagsListOnAutoComplete"
                  type={0}
                  text="Performance mode"
                />
                <Option
                  configKey="enterToSearch"
                  type={0}
                  text="Press enter to search"
                  inverted
                />
              </>
            )}
          </>
        )}
        <h2>Information page</h2>
        <Options
          options={[
            ["noFavoriteHighlight", "Highlight favorite tags", 0],
            ["noSearchingHighlight", "Highlight tags being searched", 0],
            [
              "noTagContextMenu",
              "Show custom context menu when right clicking tag",
              0,
            ],
            ["dontChangeTagURLs", "Change tag urls", 0],
          ]}
        />
        {!CONFIG["dontChangeTagURLs"] && (
          <Options
            options={[
              [
                "dontChangeTagURLsDefaults",
                "Change tag urls to include tags selected by default",
                0,
              ],
              [
                "dontChangeTagURLsSelected",
                "Change tag urls to include currently selected tags",
                0,
              ],
              [
                "dontChangeTagURLsSorting",
                "Change tag urls to include sorting",
                0,
              ],
            ]}
          />
        )}
      </main>
    </div>
  );
};
