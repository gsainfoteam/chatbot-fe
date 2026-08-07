import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const loaderSource = readFileSync(new URL("../public/loader.js", import.meta.url), "utf8");

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
      (this.listeners.get(type) ?? []).filter((candidate) => candidate !== handler),
    );
  }

  dispatchEvent(event) {
    for (const handler of this.listeners.get(event.type) ?? []) handler(event);
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
        const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        style[camelCase] = propertyValue;
      }
    },
  });
  return style;
}

class ElementStub extends EventTargetStub {
  constructor(tagName) {
    super();
    this.tagName = tagName.toUpperCase();
    this.style = createStyle();
    this.children = [];
    this.attributes = {};
    this.contentWindow = { postMessage() {} };
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

function loadWidget(dataset = {}) {
  const window = new EventTargetStub();
  const body = new ElementStub("body");
  const script = new ElementStub("script");
  script.dataset = dataset;
  script.src = "https://chatbot.gistory.me/loader.js";

  const document = {
    currentScript: script,
    body,
    createElement: (tagName) => new ElementStub(tagName),
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
    matchMedia: () => ({ matches: false, addEventListener() {} }),
  });

  class CustomEventStub {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  }

  vm.runInNewContext(loaderSource, {
    window,
    document,
    location: window.location,
    URL,
    CustomEvent: CustomEventStub,
    console: { log() {}, warn() {}, error() {} },
    requestAnimationFrame: (callback) => callback(),
  });

  const [overlay, launcher, panel] = body.children;
  return { window, overlay, launcher, panel };
}

test("keeps the existing launcher and panel layout by default", () => {
  const { window, launcher, panel } = loadWidget();

  assert.equal(launcher.style.display, "flex");
  assert.equal(panel.style.width, "360px");
  assert.equal(panel.style.height, "520px");
  assert.equal(panel.style.bottom, "86px");
  assert.equal(window.ChatbotWidget.getConfig().hideButton, false);
});

test("supports a custom trigger without reserving space for the launcher", () => {
  const { window, launcher, panel } = loadWidget({ hideButton: "true" });

  assert.equal(launcher.style.display, "none");
  assert.equal(panel.style.bottom, "18px");

  window.ChatbotWidget.open();
  assert.equal(window.ChatbotWidget.isOpen(), true);
  window.ChatbotWidget.close();
  assert.equal(window.ChatbotWidget.isOpen(), false);

  window.ChatbotWidget.showLauncher();
  assert.equal(launcher.style.display, "flex");
  assert.equal(panel.style.bottom, "86px");
});

test("resizes within the documented desktop bounds", () => {
  const { window, panel } = loadWidget({ resizable: "true" });

  const resized = window.ChatbotWidget.resize(450, 700);
  assert.equal(resized.width, 450);
  assert.equal(resized.height, 700);
  assert.equal(panel.style.width, "450px");
  assert.equal(panel.style.height, "700px");

  const clamped = window.ChatbotWidget.resize(100, 2000);
  assert.equal(clamped.width, 280);
  assert.equal(clamped.height, 860);
});
