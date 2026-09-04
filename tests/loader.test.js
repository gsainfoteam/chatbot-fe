import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const loaderSource = readFileSync(
  new URL("../public/loader.js", import.meta.url),
  "utf8"
);

// ---------------------------------------------------------------------------
// 최소 DOM 스텁 (loader.js 가 사용하는 API 만 구현)
// ---------------------------------------------------------------------------

class EventTargetStub {
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

class ElementStub extends EventTargetStub {
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

class DocumentStub extends EventTargetStub {
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

function createEnv({ mobile = false } = {}) {
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

function runLoader(env, dataset = {}) {
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

function loadWidget(dataset = {}, options = {}) {
  const env = createEnv(options);
  runLoader(env, dataset);
  const [overlay, launcherHost, panel] = env.document.body.children;
  // launcherHost 의 shadow root 폴백: [style, wrap] → wrap.children[0] 이 버튼
  const launcher = launcherHost.children[1].children[0];
  const resizeHandle = panel.children[1];
  return { ...env, overlay, launcherHost, launcher, panel, resizeHandle };
}

// 페이지에 (커스텀 트리거) 요소를 하나 만들어 등록한 뒤 클릭 이벤트를 흘려보낸다
function clickOn(document, attrs = {}, { parent = null } = {}) {
  const el = new ElementStub("button", document);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (parent) parent.appendChild(el);
  document.pageElements.push(el);
  document.dispatchEvent({ type: "click", target: el, preventDefault() {} });
  return el;
}

// ---------------------------------------------------------------------------
// 기본 레이아웃 / 기존 옵션 호환
// ---------------------------------------------------------------------------

test("keeps the default launcher and panel layout", () => {
  const { window, launcherHost, launcher, panel, resizeHandle } = loadWidget();
  const config = window.ChatbotWidget.getConfig();

  assert.equal(launcherHost.style.display, "flex");
  assert.equal(launcher.getAttribute("data-variant"), "icon");
  assert.equal(launcher.getAttribute("aria-expanded"), "false");
  assert.equal(panel.style.width, "360px");
  assert.equal(panel.style.height, "520px");
  assert.equal(panel.style.bottom, "86px");
  assert.equal(config.launcher, "icon");
  assert.equal(config.mode, "corner");
  assert.equal(config.hideButton, false);
  assert.equal(config.resizable, true);
  assert.equal(resizeHandle.style.display, "block");
});

test("data-launcher=none and legacy data-hide-button both hide the launcher", () => {
  for (const dataset of [{ launcher: "none" }, { hideButton: "true" }]) {
    const { window, launcherHost, panel } = loadWidget(dataset);
    assert.equal(launcherHost.style.display, "none");
    assert.equal(panel.style.bottom, "18px");
    assert.equal(window.ChatbotWidget.getConfig().hideButton, true);
    assert.equal(window.ChatbotWidget.getState().launcherVisible, false);

    window.ChatbotWidget.showLauncher();
    assert.equal(launcherHost.style.display, "flex");
    assert.equal(panel.style.bottom, "86px");
  }
});

test("uses chat-sparkle as the default icon and resolves aliases", () => {
  const iconOf = (dataset) => loadWidget(dataset).window.ChatbotWidget.getConfig().buttonIcon;
  assert.equal(iconOf({}), "chat-sparkle");
  assert.equal(iconOf({ buttonIcon: "spark" }), "chat-sparkle");
  assert.equal(iconOf({ buttonIcon: "robot" }), "robot");
  assert.equal(iconOf({ buttonIcon: "bot" }), "robot");
  assert.equal(iconOf({ buttonIcon: "bubble" }), "chat");
  assert.equal(iconOf({ buttonIcon: "logo" }), "logo");
  assert.equal(iconOf({ buttonIcon: "chat-question" }), "chat-question");
  // 모르는 값이나 내부용 close 는 기본값으로
  assert.equal(iconOf({ buttonIcon: "nope" }), "chat-sparkle");
  assert.equal(iconOf({ buttonIcon: "close" }), "chat-sparkle");

  const { launcher } = loadWidget();
  assert.match(launcher.innerHTML, /data-icon="open"><svg viewBox="0 0 256 256"/);
  assert.match(launcher.innerHTML, /class="cbw-star"/);
  assert.match(launcher.innerHTML, /data-icon="close"><svg/);
});

test("points the bubble tail toward the launcher's corner", () => {
  const flip = 'transform="matrix(-1 0 0 1 256 0)"';
  assert.ok(loadWidget().launcher.innerHTML.includes(flip));
  assert.ok(loadWidget({ position: "right" }).launcher.innerHTML.includes(flip));
  assert.ok(!loadWidget({ position: "left" }).launcher.innerHTML.includes(flip));
  // 안쪽 기호(스파클)는 반전 그룹 밖에 있어 방향이 유지된다
  const html = loadWidget().launcher.innerHTML;
  assert.ok(html.indexOf("</g>") < html.indexOf('fill="var(--c)"'));
});

test("picks a dark foreground for light button colors", () => {
  assert.equal(loadWidget().launcherHost.style["--chatbot-button-fg"], "#ffffff");
  assert.equal(loadWidget({ buttonColor: "ffffff" }).launcherHost.style["--chatbot-button-fg"], "#1e293b");
  assert.equal(loadWidget({ buttonColor: "fde047" }).launcherHost.style["--chatbot-button-fg"], "#1e293b");

  const { window, launcherHost } = loadWidget();
  window.ChatbotWidget.updateColors({ button: "#f1f5f9" });
  assert.equal(launcherHost.style["--chatbot-button-fg"], "#1e293b");
});

test("reflects the widget's generating state on the launcher", () => {
  const { window, launcher } = loadWidget();
  const origin = "https://chatbot.gistory.me";
  const post = (data, from = origin) =>
    window.dispatchEvent({ type: "message", origin: from, data });

  assert.equal(launcher.getAttribute("data-generating"), "false");

  post({ type: "WM_GENERATING", active: true });
  assert.equal(launcher.getAttribute("data-generating"), "true");
  assert.equal(window.ChatbotWidget.getState().generating, true);

  post({ type: "WM_GENERATING", active: false });
  assert.equal(launcher.getAttribute("data-generating"), "false");

  // 구버전 위젯 폴백: SENT → 생성 중, RECEIVED → 종료
  post({ type: "WM_MESSAGE_SENT", message: "hi" });
  assert.equal(launcher.getAttribute("data-generating"), "true");
  post({ type: "WM_MESSAGE_RECEIVED", message: "hello" });
  assert.equal(launcher.getAttribute("data-generating"), "false");

  // 다른 origin 의 메시지는 무시
  post({ type: "WM_GENERATING", active: true }, "https://evil.example");
  assert.equal(launcher.getAttribute("data-generating"), "false");
});

test("data-launcher=pill renders the label variant", () => {
  const { launcher } = loadWidget({ launcher: "pill", launcherLabel: "질문하기" });
  assert.equal(launcher.getAttribute("data-variant"), "pill");
  assert.equal(launcher.querySelector(".cbw-label").textContent, "질문하기");
});

test("resizes within the documented desktop bounds", () => {
  const { window, panel } = loadWidget({ resizable: "true" });

  // vm 컨텍스트에서 만들어진 객체는 프로토타입이 달라 spread 로 복사해 비교한다
  const resized = { ...window.ChatbotWidget.resize(450, 700) };
  assert.deepEqual(resized, { width: 450, height: 700 });
  assert.equal(panel.style.width, "450px");
  assert.equal(panel.style.height, "700px");

  assert.deepEqual({ ...window.ChatbotWidget.resize(100, 100) }, { width: 320, height: 420 });
  assert.deepEqual({ ...window.ChatbotWidget.resize(2000, 2000) }, { width: 640, height: 720 });
});

test("shows the resize handle only for resizable desktop layouts", () => {
  const { resizeHandle, mediaQuery } = loadWidget({}, { mobile: true });
  assert.equal(resizeHandle.style.display, "none");

  mediaQuery.setMatches(false);
  assert.equal(resizeHandle.style.display, "block");

  mediaQuery.setMatches(true);
  assert.equal(resizeHandle.style.display, "none");

  assert.equal(loadWidget({ resizable: "false" }).resizeHandle.style.display, "none");
});

// ---------------------------------------------------------------------------
// center 모드
// ---------------------------------------------------------------------------

test("center mode places the panel in the middle with a dimmed overlay", () => {
  const { window, overlay, panel, mediaQuery } = loadWidget({ mode: "center" });

  assert.equal(panel.style.left, "50%");
  assert.equal(panel.style.top, "50%");
  assert.equal(panel.style.bottom, "auto");
  assert.match(panel.style.transform, /^translate\(-50%, -50%\)/);
  assert.match(overlay.style.background, /rgba\(15,23,42/);

  window.ChatbotWidget.open();
  assert.equal(panel.style.transform, "translate(-50%, -50%) translateY(0) scale(1)");

  // 모바일에서는 모드와 무관하게 하단 시트
  mediaQuery.setMatches(true);
  assert.equal(panel.style.bottom, "12px");
  assert.equal(panel.style.transform, "translateY(0) scale(1)");
});

// ---------------------------------------------------------------------------
// 트리거
// ---------------------------------------------------------------------------

test("launcher click and API toggle the open state", () => {
  const { window, launcher, panel } = loadWidget();

  launcher.dispatchEvent({ type: "click" });
  assert.equal(window.ChatbotWidget.isOpen(), true);
  assert.equal(launcher.getAttribute("aria-expanded"), "true");
  assert.equal(panel.style.pointerEvents, "auto");

  window.ChatbotWidget.toggle();
  assert.equal(window.ChatbotWidget.isOpen(), false);
  assert.equal(launcher.getAttribute("aria-expanded"), "false");
  assert.equal(panel.style.pointerEvents, "none");
});

test("elements with data-chatbot-* attributes act as triggers via delegation", () => {
  const { window, document } = loadWidget({ launcher: "none" });
  const api = window.ChatbotWidget;

  const toggleBtn = clickOn(document, { "data-chatbot-toggle": "" });
  assert.equal(api.isOpen(), true);
  assert.equal(toggleBtn.getAttribute("aria-expanded"), "true");

  clickOn(document, { "data-chatbot-close": "" });
  assert.equal(api.isOpen(), false);
  assert.equal(toggleBtn.getAttribute("aria-expanded"), "false");

  clickOn(document, { "data-chatbot-open": "" });
  assert.equal(api.isOpen(), true);

  // 트리거 안쪽의 자식 요소를 클릭해도 동작 (closest)
  const parent = new ElementStub("a", document);
  parent.setAttribute("data-chatbot-close", "");
  clickOn(document, {}, { parent });
  assert.equal(api.isOpen(), false);

  // 관련 없는 클릭은 무시
  clickOn(document, { "data-other": "" });
  assert.equal(api.isOpen(), false);
});

test("Escape and overlay click close the panel", () => {
  const { window, overlay } = loadWidget();
  window.ChatbotWidget.open();
  window.dispatchEvent({ type: "keydown", key: "Escape" });
  assert.equal(window.ChatbotWidget.isOpen(), false);

  window.ChatbotWidget.open();
  overlay.dispatchEvent({ type: "click" });
  assert.equal(window.ChatbotWidget.isOpen(), false);
});

// ---------------------------------------------------------------------------
// 이벤트 / 준비 / 큐 / 정리
// ---------------------------------------------------------------------------

test("emits onLoad, onStateChange and CustomEvents on window", () => {
  const env = createEnv();
  const seen = [];
  env.window.addEventListener("chatbot:onLoad", (e) => seen.push(["load", e.detail]));
  env.window.addEventListener("chatbot:onStateChange", (e) =>
    seen.push(["state", e.detail.open])
  );
  runLoader(env, { widgetKey: "wk_test" });

  assert.equal(seen[0][0], "load");
  assert.equal(seen[0][1].widgetKey, "wk_test");

  const api = env.window.ChatbotWidget;
  const states = [];
  const unsubscribe = api.on("onStateChange", (d) => states.push(d.open));
  api.open();
  api.close();
  unsubscribe();
  api.open();

  assert.deepEqual(states, [true, false]);
  assert.deepEqual(seen.slice(1), [["state", true], ["state", false], ["state", true]]);
});

test("ready() invokes the callback immediately once loaded", () => {
  const { window } = loadWidget();
  let received = null;
  window.ChatbotWidget.ready((api) => (received = api));
  assert.equal(received, window.ChatbotWidget);
});

test("drains commands queued before the loader ran", () => {
  const env = createEnv();
  env.window.ChatbotWidget = [["hideLauncher"], ["open"], ["unknownCommand"]];
  runLoader(env);

  const api = env.window.ChatbotWidget;
  assert.equal(typeof api.open, "function");
  assert.equal(api.isOpen(), true);
  assert.equal(api.getState().launcherVisible, false);
});

test("destroy removes DOM, listeners and globals", () => {
  const { window, document } = loadWidget();
  assert.equal(document.body.children.length, 3);

  window.ChatbotWidget.destroy();
  assert.equal(document.body.children.length, 0);
  assert.equal(window.ChatbotWidget, undefined);
  assert.equal(window.updateWidgetColors, undefined);
  assert.equal((document.listeners.get("click") ?? []).length, 0);
  assert.equal((window.listeners.get("message") ?? []).length, 0);
});

test("loading twice replaces the previous instance instead of duplicating it", () => {
  const env = createEnv();
  runLoader(env, { launcher: "icon" });
  const first = env.window.ChatbotWidget;
  runLoader(env, { launcher: "pill" });

  assert.equal(env.document.body.children.length, 3);
  assert.notEqual(env.window.ChatbotWidget, first);
  assert.equal(env.window.ChatbotWidget.getConfig().launcher, "pill");
});

test("updateColors updates the launcher CSS variable and validates input", () => {
  const { window, launcherHost } = loadWidget();
  assert.equal(launcherHost.style["--chatbot-button-color"], "#df3326");

  window.ChatbotWidget.updateColors({ button: "#123abc", primary: "nope" });
  assert.equal(launcherHost.style["--chatbot-button-color"], "#123abc");
  assert.equal(window.ChatbotWidget.getConfig().primaryColor, "df3326");
});
