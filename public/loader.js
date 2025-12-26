(function () {
  const scriptEl = document.currentScript;
  if (!scriptEl) return;

  const WIDGET_ORIGIN = "http://localhost:5173"; // TODO: 배포 시 변경
  const IFRAME_URL = WIDGET_ORIGIN + "/";

  const Z = 2147483647;

  // ---- utils ----
  function clampInt(v, fallback, min, max) {
    const n = Number.parseInt(String(v ?? ""), 10);
    const val = Number.isFinite(n) ? n : fallback;
    return Math.min(max, Math.max(min, val));
  }

  // ---- 1) data-* 옵션 읽기 ----
  const ds = scriptEl.dataset;

  const config = {
    widgetKey: ds.widgetKey || "dev",
    position: ds.position === "left" ? "left" : "right",
    offset: clampInt(ds.offset, 18, 0, 80),
    width: clampInt(ds.width, 360, 280, 520),
    height: clampInt(ds.height, 520, 360, 860),
    theme: ds.theme || "light",
    backgroundColor: ds.backgroundColor || "ff4500",
  };

  const BTN_SIZE = 56;

  // ---- 2) launcher button ----
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "챗봇 열기");
  btn.style.cssText = `
    position:fixed;
    ${config.position}:${config.offset}px;
    bottom:${config.offset}px;

    width:${BTN_SIZE}px; height:${BTN_SIZE}px;
    border-radius:999px;
    border:none;

    cursor:pointer;
    background:#${config.backgroundColor};
    box-shadow:0 12px 30px rgba(0,0,0,.18);
    z-index:${Z};

    display:flex;
    align-items:center;
    justify-content:center;

    transition: transform 160ms ease;
  `;

  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="26" height="26">
      <path d="M8 12H8.009M11.991 12H12M15.991 12H16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="white" stroke-width="1.5"></path>
    </svg>
  `;

  // hover/press 효과
  btn.addEventListener(
    "mouseenter",
    () => (btn.style.transform = "scale(1.05)")
  );
  btn.addEventListener("mouseleave", () => (btn.style.transform = "scale(1)"));
  btn.addEventListener(
    "mousedown",
    () => (btn.style.transform = "scale(0.96)")
  );
  btn.addEventListener("mouseup", () => (btn.style.transform = "scale(1.05)"));

  // ---- 3) overlay (바깥 클릭 닫기) ----
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed;
    inset:0;

    background: rgba(15,23,42,0.18);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);

    opacity:0;
    pointer-events:none;
    transition: opacity 180ms ease;

    z-index:${Z - 1};
  `;

  // ---- 4) wrap + iframe ----
  const wrap = document.createElement("div");
  wrap.style.cssText = `
    position:fixed;
    ${config.position}:${config.offset}px;
    bottom:${config.offset + BTN_SIZE + 12}px;

    width:${config.width}px;
    height:${config.height}px;

    border-radius:18px;
    overflow:hidden;

    z-index:${Z};
    box-shadow:0 16px 40px rgba(0,0,0,.22);
    background:transparent;

    opacity:0;
    transform: translateY(8px) scale(0.98);
    pointer-events:none;
    transition: opacity 180ms ease, transform 180ms ease;
  `;

  // 모바일 풀스크린
  const mq = window.matchMedia("(max-width: 480px)");
  function applyResponsive() {
    if (mq.matches) {
      wrap.style.left = "0";
      wrap.style.right = "0";
      wrap.style.bottom = "0";
      wrap.style.width = "100vw";
      wrap.style.height = "100vh";
      wrap.style.borderRadius = "0";
    } else {
      wrap.style.left = "";
      wrap.style.right = "";
      wrap.style.borderRadius = "18px";
      wrap.style.width = config.width + "px";
      wrap.style.height = config.height + "px";
      wrap.style.bottom = config.offset + BTN_SIZE + 12 + "px";
      wrap.style[config.position] = config.offset + "px";
    }
  }
  applyResponsive();
  mq.addEventListener?.("change", applyResponsive);

  const iframe = document.createElement("iframe");
  iframe.src = IFRAME_URL;
  iframe.title = "Chatbot";
  iframe.style.cssText = `width:100%; height:100%; border:0; background:transparent;`;
  iframe.allow = "clipboard-read; clipboard-write";
  wrap.appendChild(iframe);

  // ---- 상태 ----
  let isOpen = false;
  let inited = false;

  function safePost(payload) {
    iframe.contentWindow?.postMessage(payload, WIDGET_ORIGIN);
  }

  function sendInit() {
    safePost({
      type: "WM_INIT",
      widgetKey: config.widgetKey,
      pageUrl: location.href,
      theme: config.theme,
      position: config.position,
    });
  }

  function applyClosed() {
    wrap.style.opacity = "0";
    wrap.style.transform = "translateY(8px) scale(0.98)";
    wrap.style.pointerEvents = "none";

    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  }

  function applyOpen() {
    wrap.style.opacity = "1";
    wrap.style.transform = "translateY(0) scale(1)";
    wrap.style.pointerEvents = "auto";

    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
  }

  // 초기 확정
  applyClosed();

  function open() {
    if (isOpen) return;
    isOpen = true;

    // ✅ transition 강제 발동: 2프레임 적용
    applyClosed();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyOpen();
        if (inited) sendInit();
      });
    });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    applyClosed();
    safePost({ type: "WM_CLOSE" });
  }

  function toggle() {
    isOpen ? close() : open();
  }

  btn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // ---- postMessage (origin 검증) ----
  window.addEventListener("message", (e) => {
    if (e.origin !== WIDGET_ORIGIN) return;

    const data = e.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "WM_WIDGET_READY") {
      inited = true;
      if (isOpen) sendInit();
    }

    if (data.type === "WM_REQUEST_CLOSE") close();
  });

  document.body.appendChild(overlay);
  document.body.appendChild(btn);
  document.body.appendChild(wrap);
})();
