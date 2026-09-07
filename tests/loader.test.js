import assert from "node:assert/strict";
import test from "node:test";
import {
  ElementStub,
  createEnv,
  runLoader,
  loadWidget,
  clickOn,
} from "./helpers/loaderStub.js";

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

test("uses logo as the default icon and resolves aliases", () => {
  const iconOf = (dataset) => loadWidget(dataset).window.ChatbotWidget.getConfig().buttonIcon;
  assert.equal(iconOf({}), "logo");
  assert.equal(iconOf({ buttonIcon: "spark" }), "chat-sparkle");
  assert.equal(iconOf({ buttonIcon: "robot" }), "robot");
  assert.equal(iconOf({ buttonIcon: "bot" }), "robot");
  assert.equal(iconOf({ buttonIcon: "bubble" }), "chat");
  assert.equal(iconOf({ buttonIcon: "logo" }), "logo");
  assert.equal(iconOf({ buttonIcon: "chat-question" }), "chat-question");
  assert.equal(iconOf({ buttonIcon: "popo" }), "popo-headset");
  assert.equal(iconOf({ buttonIcon: "popo-headset-chat" }), "popo-headset-chat");
  // 모르는 값이나 내부용 close 는 기본값으로
  assert.equal(iconOf({ buttonIcon: "nope" }), "logo");
  assert.equal(iconOf({ buttonIcon: "close" }), "logo");

  const { launcher } = loadWidget({ buttonIcon: "chat-sparkle" });
  assert.match(launcher.innerHTML, /data-icon="open" data-key="chat-sparkle"><svg viewBox="0 0 256 256"/);
  assert.match(launcher.innerHTML, /class="cbw-star"/);
  assert.match(launcher.innerHTML, /data-icon="close"><svg/);
});

test("mascot icons keep their fixed colors and mark the slot with the icon key", () => {
  const { launcher } = loadWidget({ buttonIcon: "popo-headset" });
  assert.match(launcher.innerHTML, /data-icon="open" data-key="popo-headset"/);
  assert.match(launcher.innerHTML, /viewBox="150 140 673 700"/);
  assert.ok(!launcher.innerHTML.split('data-icon="close"')[0].includes("currentColor"));
});

test("points the bubble tail toward the launcher's corner", () => {
  const flip = 'transform="matrix(-1 0 0 1 256 0)"';
  const icon = "chat-sparkle"; // 말풍선 계열 아이콘 (기본 마스코트 아이콘은 반전 대상이 아님)
  assert.ok(loadWidget({ buttonIcon: icon }).launcher.innerHTML.includes(flip));
  assert.ok(loadWidget({ buttonIcon: icon, position: "right" }).launcher.innerHTML.includes(flip));
  assert.ok(!loadWidget({ buttonIcon: icon, position: "left" }).launcher.innerHTML.includes(flip));
  assert.ok(!loadWidget().launcher.innerHTML.includes(flip));
  // 안쪽 기호(스파클)는 반전 그룹 밖에 있어 방향이 유지된다
  const html = loadWidget({ buttonIcon: icon }).launcher.innerHTML;
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

test("hiding and showing the launcher restores the configured variant", () => {
  const { window, launcher, launcherHost } = loadWidget({ launcher: "pill" });
  const api = window.ChatbotWidget;

  api.hideLauncher();
  assert.equal(launcherHost.style.display, "none");
  assert.equal(api.getConfig().launcher, "none");
  assert.equal(api.getConfig().hideButton, true);

  api.showLauncher();
  assert.equal(launcherHost.style.display, "flex");
  assert.equal(api.getConfig().launcher, "pill");
  assert.equal(launcher.getAttribute("data-variant"), "pill");

  // none 으로 시작한 경우 표시하면 icon
  const hidden = loadWidget({ launcher: "none" });
  hidden.window.ChatbotWidget.showLauncher();
  assert.equal(hidden.window.ChatbotWidget.getConfig().launcher, "icon");
  assert.equal(hidden.launcher.getAttribute("data-variant"), "icon");
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

test("onLoad is a known event name for on()", () => {
  const { window } = loadWidget();
  const off = window.ChatbotWidget.on("onLoad", () => {});
  assert.equal(typeof off, "function");
  assert.equal(window.ChatbotWidget.getState().ready, false);
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
