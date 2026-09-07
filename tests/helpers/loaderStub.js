import { readFileSync } from "node:fs";
import vm from "node:vm";

export const loaderSource = readFileSync(
  new URL("../../public/loader.js", import.meta.url),
  "utf8"
);

// ---------------------------------------------------------------------------
// 최소 DOM 스텁 (loader.js 가 사용하는 API 만 구현)
// ---------------------------------------------------------------------------

export class EventTargetStub {
  listeners = new Map();

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((c) => c !== handler)
    );
  }

  dispatchEvent(event) {
    for (const handler of [...(this.listeners.get(event.type) ?? [])]) {
      handler(event);
    }
  }
}

function createStyle() {
  const style = {};
  Object.defineProperty(style, "cssText", {
    set(value) {
      for (const declaration of value.split(";")) {
        const separator = declaration.indexOf(":");
        if (separator === -1) continue;
        const property = declaration.slice(0, separator).trim();
        const propertyValue = declaration.slice(separator + 1).trim();
        if (!property) continue;
        const camel = property.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
        style[camel] = propertyValue;
      }
    },
  });
  style.setProperty = (name, value) => {
    style[name] = value;
  };
  return style;
}

export class ElementStub extends EventTargetStub {
  constructor(tagName, doc) {
    super();
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = doc;
    this.style = createStyle();
    this.children = [];
    this.attributes = {};
    this.parentNode = null;
    this.innerHTML = "";
    this.textContent = "";
    this.contentWindow = { postMessage() {} };
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((c) => c !== child);
    child.parentNode = null;
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  hasAttribute(name) {
    return name in this.attributes;
  }

  // 런처 라벨 조회용: 자식 요소를 하나 만들어 돌려준다
  querySelector(selector) {
    if (selector === ".cbw-label") {
      if (!this._label) this._label = new ElementStub("span", this.ownerDocument);
      return this._label;
    }
    return null;
  }

  // 트리거 위임용: 자신 또는 부모 중 selector 의 속성 하나라도 가진 요소
  closest(selector) {
    const attrs = [...selector.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
    let node = this;
    while (node) {
      if (attrs.some((a) => node.hasAttribute?.(a))) return node;
      node = node.parentNode;
    }
    return null;
  }
}

export class DocumentStub extends EventTargetStub {
  constructor() {
    super();
    this.body = new ElementStub("body", this);
    this.currentScript = null;
    this.pageElements = []; // 호스트 페이지가 가진 (커스텀 트리거) 요소들
  }

  createElement(tagName) {
    return new ElementStub(tagName, this);
  }

  querySelectorAll(selector) {
    const attrs = [...selector.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
    return this.pageElements.filter((el) => attrs.some((a) => el.hasAttribute(a)));
  }
}

class CustomEventStub {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
}

export function createEnv({ mobile = false } = {}) {
  const window = new EventTargetStub();
  const document = new DocumentStub();
  const mediaQuery = {
    matches: mobile,
    listeners: [],
    addEventListener(type, handler) {
      if (type === "change") this.listeners.push(handler);
    },
    removeEventListener(type, handler) {
      this.listeners = this.listeners.filter((h) => h !== handler);
    },
    setMatches(matches) {
      this.matches = matches;
      for (const handler of this.listeners) handler({ matches });
    },
  };

  Object.assign(window, {
    self: window,
    top: window,
    parent: window,
    location: {
      origin: "https://example.com",
      pathname: "/",
      href: "https://example.com/page",
    },
    matchMedia: () => mediaQuery,
  });

  return { window, document, mediaQuery };
}

export function runLoader(env, dataset = {}) {
  const { window, document } = env;
  const script = new ElementStub("script", document);
  script.dataset = dataset;
  script.src = "https://chatbot.gistory.me/loader.js";
  document.currentScript = script;

  vm.runInNewContext(loaderSource, {
    window,
    document,
    location: window.location,
    URL,
    CustomEvent: CustomEventStub,
    console: { log() {}, warn() {}, error() {} },
    requestAnimationFrame: (callback) => callback(),
    setTimeout: () => {}, // rAF 를 동기로 처리하므로 타임아웃 폴백은 불필요
  });
}

export function loadWidget(dataset = {}, options = {}) {
  const env = createEnv(options);
  runLoader(env, dataset);
  const [overlay, launcherHost, panel] = env.document.body.children;
  // launcherHost 의 shadow root 폴백: [style, wrap] → wrap.children[0] 이 버튼
  const launcher = launcherHost.children[1].children[0];
  const resizeHandle = panel.children[1];
  return { ...env, overlay, launcherHost, launcher, panel, resizeHandle };
}

// 페이지에 (커스텀 트리거) 요소를 하나 만들어 등록한 뒤 클릭 이벤트를 흘려보낸다
export function clickOn(document, attrs = {}, { parent = null } = {}) {
  const el = new ElementStub("button", document);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.appendChild(el);
  document.pageElements.push(el);
  document.dispatchEvent({ type: "click", target: el, preventDefault() {} });
  return el;
}
