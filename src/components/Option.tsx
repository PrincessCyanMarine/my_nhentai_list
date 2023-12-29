import React, { useEffect, useState } from "react";
import { KeysMatching, MyNHentaiListConfiguration } from "../pages/ConfigPage";

function self<T = boolean>(props: {
  text: string;
  CONFIG: Partial<MyNHentaiListConfiguration>;
  toggle: (key: KeysMatching<boolean>) => void;
  _setConfig: React.Dispatch<
    React.SetStateAction<Partial<MyNHentaiListConfiguration>>
  >;
  configKey: KeysMatching<boolean>;
  type: 0;
  inverted?: boolean;
}): JSX.Element;
function self<T = number>(props: {
  text: string;
  CONFIG: Partial<MyNHentaiListConfiguration>;
  toggle: (key: KeysMatching<boolean>) => void;
  _setConfig: React.Dispatch<
    React.SetStateAction<Partial<MyNHentaiListConfiguration>>
  >;

  type: 1;
  configKey: KeysMatching<number>;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}): JSX.Element;
function self<T extends Enumerator>(props: {
  text: string;
  CONFIG: Partial<MyNHentaiListConfiguration>;
  toggle: (key: KeysMatching<boolean>) => void;
  _setConfig: React.Dispatch<
    React.SetStateAction<Partial<MyNHentaiListConfiguration>>
  >;

  type: 2;
  configKey: KeysMatching<T>;
}): JSX.Element;
function self<T>(props: {
  text: string;
  CONFIG: Partial<MyNHentaiListConfiguration>;
  toggle: (key: KeysMatching<boolean>) => void;
  _setConfig: React.Dispatch<
    React.SetStateAction<Partial<MyNHentaiListConfiguration>>
  >;
  configKey: KeysMatching<T>;
  defaultValue?: number;
  inverted?: boolean;
  type: 0 | 1 | 2;
  min?: number;
  max?: number;
  step?: number;
}) {
  let { configKey: key, text, type, CONFIG, toggle, _setConfig } = props;
  switch (props.type) {
    case 0:
      let state = !(CONFIG[key] ?? false);
      let inverted = "inverted" in props ? props.inverted ?? false : false;
      if (inverted) state = !state;
      return (
        <label key={key}>
          <p>
            <input
              onChange={(ev) => toggle(key as KeysMatching<boolean>)}
              type="checkbox"
              checked={state}
            />{" "}
            <a>{text}</a>
          </p>
        </label>
      );
      break;
    case 1:
      const [defaultValue, setDefaultValue] = useState<number>(
        (props as any).defaultValue || 0
      );
      const id = `config-${key}`;
      useEffect(() => {
        let elm = document.getElementById(id);
        if (elm && elm.getAttribute("data-default-value"))
          setDefaultValue(Number(elm.getAttribute("data-default-value")));
        else {
          let _default = CONFIG[key as KeysMatching<number>];
          if (_default != undefined) {
            setDefaultValue(_default);
            elm?.setAttribute("data-default-value", _default.toString());
          } else {
            setDefaultValue(defaultValue);
          }
        }
      }, [CONFIG]);
      useEffect(() => setValue(defaultValue.toFixed(2)), [defaultValue]);
      let min = "min" in props ? props.min || 0 : 0;
      let max = "max" in props ? props.max || 100 : 100;
      let step = "step" in props ? props.step || 1 : 1;
      const [value, setValue] = useState(defaultValue.toFixed(2));
      useEffect(() => {
        if (CONFIG[key as KeysMatching<number>] != Number(value))
          _setConfig((c) => ({ ...c, [key]: Number(value) }));
      }, [value]);
      return (
        <label key={key} id={id}>
          <p
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <a>{text}</a>
            {`: ${CONFIG[key as KeysMatching<number>]
              ?.toFixed(2)
              .padStart(5, "0")} `}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(ev) => {
                setValue(Number(ev.target.value).toFixed(2));
              }}
            />
          </p>
        </label>
      );
      break;
  }

  return <></>;
}

export default self;
