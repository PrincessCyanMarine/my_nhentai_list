export class ElementBuilder<K extends keyof HTMLElementTagNameMap> {
  element: HTMLElementTagNameMap[K];
  constructor(tag: K) {
    this.element = document.createElement(tag);
  }

  static fromElement<K extends keyof HTMLElementTagNameMap>(
    element: HTMLElementTagNameMap[K]
  ) {
    let builder = new ElementBuilder<K>(element.tagName.toLowerCase() as K);
    builder.element = element;
    return builder;
  }

  addClass(className: string) {
    this.element.classList.add(className);
    return this;
  }

  removeClass(className: string) {
    this.element.classList.remove(className);
    return this;
  }

  setText(text: string | (() => string)) {
    if (typeof text === "function") text = text();
    this.element.innerText = text;
    return this;
  }

  setHtml(html: string) {
    this.element.innerHTML = html;
    return this;
  }

  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
  ) {
    this.element.addEventListener(type, listener as any);
    return this;
  }

  appendChildren(...children: (HTMLElement | Node)[]): ElementBuilder<K>;
  appendChildren(children: (HTMLElement | Node)[]): ElementBuilder<K>;
  appendChildren(
    first: (HTMLElement | Node)[] | (HTMLElement | Node),
    ...rest: (HTMLElement | Node)[]
  ): ElementBuilder<K> {
    if (!Array.isArray(first)) first = [first];
    for (let child of [...first, ...rest]) this.element.appendChild(child);
    return this;
  }

  build() {
    return this.element;
  }

  setAttribute(name: string, value: string) {
    this.element.setAttribute(name, value);
    return this;
  }

  setId(id: string) {
    this.element.id = id;
    return this;
  }
}
