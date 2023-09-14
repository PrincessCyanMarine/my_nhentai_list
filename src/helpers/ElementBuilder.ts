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

  addText(text: string) {
    this.element.innerText = text;
    return this;
  }

  addHtml(html: string) {
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

  appendChildren(...children: HTMLElement[]) {
    for (let child of children) this.element.appendChild(child);
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
