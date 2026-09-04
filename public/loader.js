(function () {
  // ---------------------------------------------------------------------------
  // GIST 챗봇 위젯 로더
  //
  // 구조
  //   1. 설정 파싱      : <script data-*> 속성 → config
  //   2. 런처 버튼      : Shadow DOM 기반 기본 트리거 (icon | pill | none)
  //   3. 패널 + 오버레이: iframe 을 감싸는 카드 (corner | center 모드)
  //   4. 트리거 위임    : [data-chatbot-open|close|toggle] 요소 자동 연결
  //   5. 전역 API       : window.ChatbotWidget
  // ---------------------------------------------------------------------------

  const scriptEl =
    document.currentScript ||
    (function () {
      // type="module" 또는 동적 로딩 등 currentScript 가 없는 경우의 폴백
      const candidates = document.querySelectorAll
        ? document.querySelectorAll("script[data-widget-key]")
        : [];
      return candidates[candidates.length - 1] || null;
    })();
  if (!scriptEl) return;

  // ---- utils ----------------------------------------------------------------
  function clampInt(v, fallback, min, max) {
    const n = Number.parseInt(String(v ?? ""), 10);
    const val = Number.isFinite(n) ? n : fallback;
    return Math.min(max, Math.max(min, val));
  }

  function parseBoolean(v, fallback = false) {
    if (v == null || v === "") return fallback;
    return !["false", "0", "no", "off"].includes(String(v).toLowerCase());
  }

  function pickEnum(v, allowed, fallback) {
    const s = String(v ?? "").toLowerCase();
    return allowed.includes(s) ? s : fallback;
  }

  // hex 색상 검증 (3자리 또는 6자리, # 유무 무관)
  function validateColor(color, fallback) {
    if (!color) return fallback;
    const cleaned = String(color).replace(/^#/, "");
    if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleaned)) return cleaned;
    return fallback;
  }

  function setCssVar(el, name, value) {
    if (el.style.setProperty) el.style.setProperty(name, value);
    else el.style[name] = value;
  }

  // ---- origin / 실행 가드 ----------------------------------------------------
  // 위젯 origin 은 스크립트가 로드된 origin 기반으로 결정 (data-* 로 조작 불가)
  const scriptOrigin = scriptEl.src ? new URL(scriptEl.src).origin : null;
  const isLocalDev =
    scriptOrigin &&
    (scriptOrigin === "http://localhost:5173" ||
      scriptOrigin === "http://127.0.0.1:5173");

  const WIDGET_ORIGIN =
    isLocalDev && scriptOrigin ? scriptOrigin : "https://chatbot.gistory.me";
  const IFRAME_URL = WIDGET_ORIGIN + "/widget/";

  // iframe 내부이거나 위젯 origin 의 /widget/ 경로에서는 실행하지 않음 (무한 루프 방지)
  const isInIframe = window.self !== window.top;
  const isWidgetOrigin = window.location.origin === WIDGET_ORIGIN;
  if (
    isInIframe ||
    (isWidgetOrigin && window.location.pathname.startsWith("/widget"))
  ) {
    return;
  }

  // 로더 중복 실행 방지: 이미 마운트된 인스턴스가 있으면 정리 후 다시 생성
  // (React StrictMode / 라우트 재마운트 등으로 스크립트가 두 번 삽입되는 경우)
  const previous = window.ChatbotWidget;
  const pendingCommands = Array.isArray(previous) ? previous.slice() : [];
  if (previous && typeof previous.destroy === "function") {
    previous.destroy();
  }

  const Z = 2147483647;
  const BTN_SIZE = 56;
  const PANEL_GAP = 12;
  const PANEL_ID = "chatbot-widget-panel";

  // ---- 1) 설정 파싱 ----------------------------------------------------------
  const ds = scriptEl.dataset || {};
  const debug = parseBoolean(ds.debug);
  const log = debug ? (...args) => console.log("[ChatbotWidget]", ...args) : () => {};

  // 예전 옵션 값 / 자연스러운 별칭
  const ICON_ALIASES = {
    spark: "chat-sparkle",
    ai: "chat-sparkle",
    bubble: "chat",
    dots: "chat",
    bot: "robot",
    "magnifying-glass": "search",
    help: "question",
    g: "logo",
  };
  const DEFAULT_ICON = "chat-sparkle";

  // 런처 버튼 아이콘 (ICONS 키 또는 별칭, 기본 spark). 유효성은 런처 생성 시 ICONS 기준으로 보정
  const rawButtonIcon = String(ds.buttonIcon || DEFAULT_ICON).toLowerCase().trim();
  const buttonIcon = ICON_ALIASES[rawButtonIcon] || rawButtonIcon;

  // 런처 형태: icon(기본) | pill(아이콘+문구) | none(기본 런처 없음, 커스텀 트리거 전용)
  // data-hide-button="true" 는 data-launcher="none" 과 동일 (하위 호환)
  const hideButton = parseBoolean(ds.hideButton);
  const launcher = hideButton
    ? "none"
    : pickEnum(ds.launcher, ["icon", "pill", "none"], "icon");

  const config = {
    widgetKey: ds.widgetKey || "dev",
    position: ds.position === "left" ? "left" : "right",
    offset: clampInt(ds.offset, 18, 0, 80),
    width: clampInt(ds.width, 360, 320, 640),
    height: clampInt(ds.height, 520, 420, 720),
    // 패널 모드: corner(기본, 런처 위 카드) | center(화면 중앙 모달)
    mode: pickEnum(ds.mode, ["corner", "center"], "corner"),
    launcher: launcher,
    launcherLabel: ds.launcherLabel || "무엇이든 물어보세요",
    hideButton: launcher === "none",
    resizable: parseBoolean(ds.resizable, true),
    theme: ds.theme || "light",
    buttonIcon: buttonIcon,
    // 색상 옵션들
    primaryColor: validateColor(ds.primaryColor, "df3326"),
    buttonColor: validateColor(ds.buttonColor, ds.primaryColor || "df3326"),
    backgroundColor: validateColor(ds.backgroundColor, "ffffff"),
    textColor: validateColor(ds.textColor, "1e293b"),
    textSecondaryColor: validateColor(ds.textSecondaryColor, "64748b"),
    borderColor: validateColor(ds.borderColor, "e2e8f0"),
    userMessageBg: validateColor(ds.userMessageBg, ds.primaryColor || "df3326"),
    assistantMessageBg: validateColor(ds.assistantMessageBg, "ffffff"),
  };

  log("config", config);

  const mq = window.matchMedia("(max-width: 640px)");
  const isMobile = () => mq.matches;

  function colorsPayload() {
    return {
      primary: config.primaryColor,
      button: config.buttonColor,
      background: config.backgroundColor,
      text: config.textColor,
      textSecondary: config.textSecondaryColor,
      border: config.borderColor,
      userMessageBg: config.userMessageBg,
      assistantMessageBg: config.assistantMessageBg,
    };
  }

  // 버튼 배경이 밝으면 아이콘/라벨을 어둡게 (WCAG 상대 휘도 기준)
  function readableForeground(hex) {
    const h = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const [r, g, b] = [0, 2, 4].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.55 ? "#1e293b" : "#ffffff";
  }

  function applyLauncherColors() {
    setCssVar(launcherHost, "--chatbot-button-color", "#" + config.buttonColor);
    setCssVar(launcherHost, "--chatbot-button-fg", readableForeground(config.buttonColor));
  }

  // 데스크톱 corner 모드에서 패널 하단 위치: 런처가 있으면 그 위에, 없으면 offset 만큼
  function desktopPanelBottom() {
    return config.offset + (config.hideButton ? 0 : BTN_SIZE + PANEL_GAP);
  }

  // ---- 2) 런처 버튼 ----------------------------------------------------------
  // 런처 아이콘: Phosphor Icons (Fill) 원본 지오메트리. MIT License, https://phosphoricons.com
  const PH = {
    "chat-circle":
      '<path d="M232,128A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Z"/>',
    "chat-circle-dots":
      '<path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24ZM84,140a12,12,0,1,1,12-12A12,12,0,0,1,84,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,172,140Z"/>',
    "chat-circle-text":
      '<path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm32,128H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm0-32H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Z"/>',
    "chats-circle":
      '<path d="M232.07,186.76a80,80,0,0,0-62.5-114.17A80,80,0,1,0,23.93,138.76l-7.27,24.71a16,16,0,0,0,19.87,19.87l24.71-7.27a80.39,80.39,0,0,0,25.18,7.35,80,80,0,0,0,108.34,40.65l24.71,7.27a16,16,0,0,0,19.87-19.86Zm-16.25,1.47L224,216l-27.76-8.17a8,8,0,0,0-6,.63,64.05,64.05,0,0,1-85.87-24.88A79.93,79.93,0,0,0,174.7,89.71a64,64,0,0,1,41.75,92.48A8,8,0,0,0,215.82,188.23Z"/>',
    "sparkle":
      '<path d="M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z"/>',
    "magnifying-glass":
      '<path d="M168,112a56,56,0,1,1-56-56A56,56,0,0,1,168,112Zm61.66,117.66a8,8,0,0,1-11.32,0l-50.06-50.07a88,88,0,1,1,11.32-11.31l50.06,50.06A8,8,0,0,1,229.66,229.66ZM112,184a72,72,0,1,0-72-72A72.08,72.08,0,0,0,112,184Z"/>',
    "question":
      '<path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,168a12,12,0,1,1,12-12A12,12,0,0,1,128,192Zm8-48.72V144a8,8,0,0,1-16,0v-8a8,8,0,0,1,8-8c13.23,0,24-9,24-20s-10.77-20-24-20-24,9-24,20v4a8,8,0,0,1-16,0v-4c0-19.85,17.94-36,40-36s40,16.15,40,36C168,125.38,154.24,139.93,136,143.28Z"/>',
    "robot":
      '<path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48ZM172,96a12,12,0,1,1-12,12A12,12,0,0,1,172,96ZM96,184H80a16,16,0,0,1,0-32H96ZM84,120a12,12,0,1,1,12-12A12,12,0,0,1,84,120Zm60,64H112V152h32Zm32,0H160V152h16a16,16,0,0,1,0,32Z"/>',
    "headset":
      '<path d="M232,128v80a40,40,0,0,1-40,40H136a8,8,0,0,1,0-16h56a24,24,0,0,0,24-24H192a24,24,0,0,1-24-24V144a24,24,0,0,1,24-24h23.65A88,88,0,0,0,66,65.54,87.29,87.29,0,0,0,40.36,120H64a24,24,0,0,1,24,24v40a24,24,0,0,1-24,24H48a24,24,0,0,1-24-24V128A104.11,104.11,0,0,1,201.89,54.66,103.41,103.41,0,0,1,232,128Z"/>',
  };
  const PH_VIEWBOX = "0 0 256 256";

  function phSvg(body) {
    return (
      '<svg viewBox="' + PH_VIEWBOX + '" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      body +
      "</svg>"
    );
  }
  // 말풍선 꼬리는 런처가 놓인 쪽 모서리(오른쪽 배치 → 우측 하단)를 향하도록 몸통만 좌우 반전한다
  const TAIL_OPEN = config.position === "right" ? '<g transform="matrix(-1 0 0 1 256 0)">' : "<g>";
  function bubble(body, inset) {
    return phSvg(TAIL_OPEN + body + "</g>" + (inset || ""));
  }
  // 말풍선 안에 다른 글리프를 버튼색으로 파 넣는다 (반전하지 않아 기호 방향 유지)
  function inset(name, x, y, size, cls) {
    return (
      '<svg x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" viewBox="' + PH_VIEWBOX + '" fill="var(--c)">' +
      '<g class="' + (cls || "") + '">' + PH[name] + "</g></svg>"
    );
  }

  const ICONS = {
    "chat-sparkle": bubble(PH["chat-circle"], inset("sparkle", 62, 58, 132, "cbw-star")),
    chat: bubble(PH["chat-circle-dots"]),
    "chat-text": bubble(PH["chat-circle-text"]),
    chats: bubble(PH["chats-circle"]),
    "chat-search": bubble(PH["chat-circle"], inset("magnifying-glass", 66, 62, 124)),
    "chat-question": bubble(PH["chat-circle"], inset("question", 40, 36, 176)),
    sparkle: phSvg('<g class="cbw-star">' + PH.sparkle + "</g>"),
    search: phSvg(PH["magnifying-glass"]),
    question: phSvg(PH.question),
    robot: phSvg(PH.robot),
    headset: phSvg(PH.headset),
    logo:
      '<svg viewBox="0 0 173 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M83.7427 87.1014L109.873 87.108V114.663H78.4867C56.3773 114.663 38.456 96.74 38.456 74.632C38.456 52.524 56.3773 34.6014 78.4867 34.6014H137.464L172.871 4.57764e-05H74.632C33.4147 4.57764e-05 0 33.4134 0 74.632C0 115.849 33.4147 149.264 74.632 149.264H112.308H147.541H147.544V58.7254H147.541H112.779L83.7427 87.1014Z" fill="currentColor"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6.5 9.5L12 15l5.5-5.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  // 런처 스타일은 Shadow DOM 안에 두어 호스트 페이지의 button/svg 전역 스타일과 격리한다.
  // (Shadow DOM 미지원 환경에서는 같은 스타일이 light DOM 에 삽입되며, 클래스 접두어로 충돌을 피한다)
  const LAUNCHER_CSS = `
    .cbw-wrap {
      transform-origin: center;
      animation: cbw-in 420ms cubic-bezier(.22,1,.36,1) both;
    }
    .cbw-launcher {
      --c: var(--chatbot-button-color, #df3326);
      --fg: var(--chatbot-button-fg, #ffffff);
      --size: ${BTN_SIZE}px;
      --radius: 22px;
      all: unset;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      height: var(--size);
      min-width: var(--size);
      border-radius: var(--radius);
      background: var(--c);
      color: var(--fg);
      /* 채우기보다 살짝 밝은 얇은 링(안쪽으로 그려 가장자리와 틈이 없음) + 부드러운 그림자 */
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,.14),
        0 2px 4px rgba(15,23,42,.10),
        0 10px 24px -8px rgba(15,23,42,.30),
        0 18px 36px -14px rgba(15,23,42,.28);
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      font: 600 15px/1 -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
      letter-spacing: -0.01em;
      transition:
        transform 180ms cubic-bezier(.2,.8,.2,1),
        box-shadow 180ms ease,
        filter 180ms ease,
        border-radius 300ms cubic-bezier(.4,0,.2,1);
    }
    /* 열림/닫힘 전환 시 살짝 눌렸다 튀어나오는 펄스 (JS 에서 cbw-pop 클래스를 다시 붙여 재생) */
    .cbw-launcher.cbw-pop { animation: cbw-pop 360ms cubic-bezier(.2,.8,.2,1); }
    /* 입체감: 위→아래 그라디언트 + 브랜드색이 섞인 근접 그림자 (color-mix 지원 브라우저) */
    @supports (background: color-mix(in srgb, red 50%, blue)) {
      .cbw-launcher {
        /* 중간 정지점 없는 2단계 그라디언트라 띠가 생기지 않는다 */
        background: linear-gradient(180deg,
          color-mix(in srgb, var(--c) 82%, #fff) 0%,
          color-mix(in srgb, var(--c) 93%, #000) 100%);
        box-shadow:
          inset 0 0 0 1px color-mix(in srgb, var(--c) 86%, #fff),
          0 2px 4px rgba(15,23,42,.10),
          0 10px 24px -8px color-mix(in srgb, var(--c) 45%, transparent),
          0 18px 36px -14px rgba(15,23,42,.28);
      }
      .cbw-launcher:hover {
        box-shadow:
          inset 0 0 0 1px color-mix(in srgb, var(--c) 80%, #fff),
          0 3px 6px rgba(15,23,42,.10),
          0 14px 30px -8px color-mix(in srgb, var(--c) 50%, transparent),
          0 24px 44px -14px rgba(15,23,42,.30);
      }
    }
    .cbw-launcher:hover { filter: brightness(1.07); }
    .cbw-launcher:active { transform: translateY(0) scale(.96); }
    .cbw-launcher:focus-visible {
      box-shadow:
        0 0 0 3px #fff,
        0 0 0 6px var(--c),
        0 18px 36px -14px rgba(15,23,42,.38);
    }
    /* 열리면 스퀘클 → 원형으로 모핑, 아이콘은 아래 화살표(접기)로 교체.
       999px 로 두면 보간 대부분이 원형 구간에서 낭비되다 끝에서 급변하므로 실제 반지름으로 보간한다 */
    .cbw-launcher[aria-expanded="true"] { border-radius: calc(var(--size) / 2); }

    .cbw-slot {
      position: relative;
      flex: none;
      width: var(--size);
      height: var(--size);
    }
    .cbw-ic {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 200ms ease, transform 280ms cubic-bezier(.2,.8,.2,1);
    }
    .cbw-ic svg { display: block; width: 30px; height: 30px; }
    .cbw-ic[data-icon="logo"] svg { width: 28px; height: 28px; }
    .cbw-ic[data-icon="close"] { opacity: 0; transform: translateY(8px) scale(.6); }
    .cbw-launcher[aria-expanded="true"] .cbw-ic[data-icon="open"] { opacity: 0; transform: translateY(-8px) scale(.6); }
    .cbw-launcher[aria-expanded="true"] .cbw-ic[data-icon="close"] { opacity: 1; transform: none; }

    .cbw-label {
      display: none;
      padding-right: 22px;
      white-space: nowrap;
    }
    .cbw-launcher[data-variant="pill"] .cbw-label { display: block; }
    .cbw-launcher[data-variant="pill"][aria-expanded="true"] .cbw-label { display: none; }

    /* 답변 생성 중: 스파클 반짝임 */
    .cbw-launcher[data-generating="true"] .cbw-star {
      animation: cbw-twinkle 1.2s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }

    @keyframes cbw-in {
      from { opacity: 0; transform: scale(.3); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes cbw-pop {
      0%   { transform: scale(1); }
      35%  { transform: scale(.9); }
      100% { transform: scale(1); }
    }
    @keyframes cbw-twinkle {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(.5); opacity: .4; }
    }

    @media (max-width: 640px) {
      .cbw-launcher { --size: 50px; --radius: 19px; }
      .cbw-ic svg { width: 27px; height: 27px; }
      .cbw-ic[data-icon="logo"] svg { width: 25px; height: 25px; }
      .cbw-launcher[data-variant="pill"] .cbw-label { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .cbw-wrap, .cbw-launcher, .cbw-launcher.cbw-pop, .cbw-ic, .cbw-star {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  if (!ICONS[config.buttonIcon] || config.buttonIcon === "close") {
    config.buttonIcon = DEFAULT_ICON;
  }

  const launcherHost = document.createElement("div");
  launcherHost.setAttribute("data-chatbot-widget", "launcher");
  launcherHost.style.cssText = `
    position:fixed;
    ${config.position}:${config.offset}px;
    bottom:${config.offset}px;
    z-index:${Z};
    display:${config.hideButton ? "none" : "flex"};
    margin:0; padding:0; border:0;
    line-height:0;
  `;
  applyLauncherColors();

  const launcherRoot = launcherHost.attachShadow
    ? launcherHost.attachShadow({ mode: "open" })
    : launcherHost;

  const launcherStyle = document.createElement("style");
  launcherStyle.textContent = LAUNCHER_CSS;
  launcherRoot.appendChild(launcherStyle);

  const launcherWrap = document.createElement("div");
  launcherWrap.className = "cbw-wrap";
  launcherRoot.appendChild(launcherWrap);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cbw-launcher";
  btn.setAttribute("aria-label", "챗봇 열기");
  btn.setAttribute("aria-haspopup", "dialog");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", PANEL_ID);
  btn.setAttribute("data-variant", config.launcher === "pill" ? "pill" : "icon");
  btn.setAttribute("data-generating", "false");
  btn.innerHTML =
    '<span class="cbw-slot">' +
    '<span class="cbw-ic" data-icon="open">' + ICONS[config.buttonIcon] + "</span>" +
    '<span class="cbw-ic" data-icon="close">' + ICONS.close + "</span>" +
    "</span>" +
    '<span class="cbw-label"></span>';
  launcherWrap.appendChild(btn);

  // 라벨은 textContent 로 넣어 HTML 인젝션을 막는다
  const labelEl = btn.querySelector ? btn.querySelector(".cbw-label") : null;
  if (labelEl) labelEl.textContent = config.launcherLabel;

  // ---- 3) 오버레이 + 패널 ----------------------------------------------------
  // 오버레이: corner 모드에서는 투명(바깥 클릭 닫기용), center 모드에서는 어둡게 깔림
  const overlay = document.createElement("div");
  overlay.setAttribute("data-chatbot-widget", "overlay");
  overlay.style.cssText = `
    position:fixed;
    inset:0;
    background:${config.mode === "center" ? "rgba(15,23,42,.45)" : "transparent"};
    opacity:0;
    pointer-events:none;
    transition: opacity 180ms ease;
    z-index:${Z - 1};
  `;

  const wrap = document.createElement("div");
  wrap.id = PANEL_ID;
  wrap.setAttribute("data-chatbot-widget", "panel");
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-label", "챗봇");
  wrap.style.cssText = `
    position:fixed;
    border-radius:18px;
    overflow:hidden;
    z-index:${Z};
    box-shadow:0 16px 40px rgba(0,0,0,.22);
    background:transparent;
    opacity:0;
    pointer-events:none;
    transition: opacity 180ms ease, transform 180ms ease;
  `;

  // 닫힘/열림 transform 은 레이아웃(모바일 시트 / corner / center)에 따라 다르다
  function baseTransform() {
    return !isMobile() && config.mode === "center" ? "translate(-50%, -50%) " : "";
  }
  function closedTransform() {
    return baseTransform() + "translateY(8px) scale(0.98)";
  }
  function openTransform() {
    return baseTransform() + "translateY(0) scale(1)";
  }

  // 모바일: 하단 시트 / 데스크톱 corner: 런처 위 카드 / 데스크톱 center: 중앙 모달
  function applyResponsive() {
    const s = wrap.style;
    if (isMobile()) {
      s.left = "12px";
      s.right = "12px";
      s.top = "auto";
      s.bottom = "12px";
      s.width = "calc(100vw - 24px)";
      s.height = "85vh";
      s.maxHeight = "85vh";
      s.borderRadius = "20px 20px 0 0";
    } else if (config.mode === "center") {
      s.left = "50%";
      s.right = "auto";
      s.top = "50%";
      s.bottom = "auto";
      s.width = config.width + "px";
      s.height = config.height + "px";
      s.maxHeight = "calc(100vh - 48px)";
      s.borderRadius = "18px";
    } else {
      s.left = "";
      s.right = "";
      s.top = "auto";
      s.borderRadius = "18px";
      s.width = config.width + "px";
      s.height = config.height + "px";
      s.maxHeight = "";
      s.bottom = desktopPanelBottom() + "px";
      s[config.position] = config.offset + "px";
    }
    s.transform = isOpen ? openTransform() : closedTransform();
    resizeHandle.style.display = !isMobile() && config.resizable ? "block" : "none";
  }

  const iframe = document.createElement("iframe");
  // pageUrl 을 URL 에 포함시켜 postMessage 타이밍에 의존하지 않고 즉시 사용 가능하게 함
  iframe.src = IFRAME_URL + "?pageUrl=" + encodeURIComponent(location.href);
  iframe.title = "Chatbot";
  iframe.style.cssText = "width:100%; height:100%; border:0; background:transparent;";
  iframe.allow = "clipboard-read; clipboard-write";
  wrap.appendChild(iframe);

  // 데스크톱에서 선택적으로 드래그하여 패널 크기를 조절한다 (data-resizable, 기본 켜짐)
  const resizeHandle = document.createElement("button");
  resizeHandle.type = "button";
  resizeHandle.setAttribute("aria-label", "채팅창 크기 조절");
  resizeHandle.style.cssText = `
    position:absolute;
    top:0;
    ${config.position === "right" ? "left" : "right"}:0;
    width:20px;
    height:20px;
    padding:0;
    border:0;
    background:linear-gradient(${config.position === "right" ? "135deg" : "225deg"}, rgba(100,116,139,.55) 0 2px, transparent 2px 5px, rgba(100,116,139,.35) 5px 7px, transparent 7px);
    cursor:${config.position === "right" ? "nwse-resize" : "nesw-resize"};
    touch-action:none;
    z-index:1;
  `;
  wrap.appendChild(resizeHandle);

  // ---- 상태 ------------------------------------------------------------------
  let isOpen = false;
  let inited = false; // iframe 내부 앱이 WM_WIDGET_READY 를 보냈는지
  let generating = false; // 답변 스트리밍 중 (런처 반짝임 표시)
  let destroyed = false;

  function setGenerating(active) {
    generating = !!active;
    btn.setAttribute("data-generating", generating ? "true" : "false");
  }

  applyResponsive();

  // ---- 이벤트 훅 시스템 --------------------------------------------------------
  const eventHandlers = {
    onOpen: [],
    onClose: [],
    onStateChange: [],
    onReady: [],
    onMessage: [],
    onMessageSent: [],
    onMessageReceived: [],
  };

  // window CustomEvent(`chatbot:<name>`) 와 on() 콜백을 함께 발행
  function dispatchEvent(eventName, data = {}) {
    const event = new CustomEvent(`chatbot:${eventName}`, {
      detail: { widgetKey: config.widgetKey, timestamp: Date.now(), ...data },
    });
    window.dispatchEvent(event);

    for (const handler of eventHandlers[eventName] || []) {
      try {
        handler(data);
      } catch (error) {
        console.error(`[ChatbotWidget] Error in ${eventName} handler:`, error);
      }
    }
  }

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
      colors: colorsPayload(),
    });
  }

  // ---- 4) 트리거 -----------------------------------------------------------------
  // 열림 상태를 런처와 페이지의 커스텀 트리거([data-chatbot-toggle|open]) 에 반영한다
  function syncTriggerState() {
    const expanded = isOpen ? "true" : "false";
    btn.setAttribute("aria-expanded", expanded);
    btn.setAttribute("aria-label", isOpen ? "챗봇 닫기" : "챗봇 열기");
    // 펄스 애니메이션 재생: 클래스를 뗐다가 reflow 후 다시 붙인다
    if (btn.classList) {
      btn.classList.remove("cbw-pop");
      void btn.offsetWidth;
      btn.classList.add("cbw-pop");
    }
    if (!document.querySelectorAll) return;
    const triggers = document.querySelectorAll(
      "[data-chatbot-toggle],[data-chatbot-open]"
    );
    for (const el of triggers) el.setAttribute("aria-expanded", expanded);
  }

  // 2프레임 뒤 실행. 백그라운드 탭에서는 rAF 가 멈추므로 타임아웃으로도 한 번은 실행되게 한다.
  function afterTwoFrames(callback) {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      callback();
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
    setTimeout(run, 100);
  }

  function applyClosed() {
    wrap.style.opacity = "0";
    wrap.style.transform = closedTransform();
    wrap.style.pointerEvents = "none";
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  }

  function applyOpen() {
    wrap.style.opacity = "1";
    wrap.style.transform = openTransform();
    wrap.style.pointerEvents = "auto";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
  }

  applyClosed();

  function open() {
    if (isOpen || destroyed) return;
    isOpen = true;
    syncTriggerState();

    // transition 강제 발동: 닫힘 상태를 한 번 확정한 뒤 2프레임 후 열림 적용
    applyClosed();
    afterTwoFrames(() => {
      if (!isOpen) return;
      applyOpen();
      if (inited) sendInit();
      const data = { widgetKey: config.widgetKey, pageUrl: location.href };
      dispatchEvent("onOpen", data);
      dispatchEvent("onStateChange", { ...data, open: true });
    });
  }

  function close() {
    if (!isOpen || destroyed) return;
    isOpen = false;
    syncTriggerState();
    applyClosed();
    safePost({ type: "WM_CLOSE" });
    const data = { widgetKey: config.widgetKey, pageUrl: location.href };
    dispatchEvent("onClose", data);
    dispatchEvent("onStateChange", { ...data, open: false });
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function resize(width, height) {
    config.width = clampInt(width, config.width, 320, 640);
    config.height = clampInt(height, config.height, 420, 720);
    applyResponsive();
    return { width: config.width, height: config.height };
  }

  function setLauncherVisible(visible) {
    config.hideButton = !visible;
    if (visible && config.launcher === "none") config.launcher = "icon";
    if (!visible) config.launcher = "none";
    launcherHost.style.display = visible ? "flex" : "none";
    applyResponsive();
  }

  // 페이지 어디에 있든 data-chatbot-* 속성이 붙은 요소를 클릭하면 동작한다.
  // document 레벨 위임이라 요소가 나중에 렌더링되거나(React 등) 교체되어도 상관없다.
  function onDocumentClick(e) {
    const target = e.target;
    if (!target || typeof target.closest !== "function") return;
    const el = target.closest(
      "[data-chatbot-open],[data-chatbot-close],[data-chatbot-toggle]"
    );
    if (!el) return;
    if (el.tagName === "A") e.preventDefault();
    if (el.hasAttribute("data-chatbot-toggle")) toggle();
    else if (el.hasAttribute("data-chatbot-open")) open();
    else close();
  }

  function onKeyDown(e) {
    if (e.key === "Escape") close();
  }

  function onMediaChange() {
    applyResponsive();
  }

  function onResizePointerDown(event) {
    if (!config.resizable || isMobile()) return;

    event.preventDefault();
    resizeHandle.setPointerCapture?.(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = config.width;
    const startHeight = config.height;

    const onPointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      // center 모드는 양쪽으로 커지므로 이동량을 2배로 반영
      const factor = config.mode === "center" ? 2 : 1;
      resize(
        startWidth + (config.position === "right" ? -dx : dx) * factor,
        startHeight - dy * factor
      );
    };

    const onPointerUp = (upEvent) => {
      resizeHandle.releasePointerCapture?.(upEvent.pointerId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  // ---- 색상 업데이트 ---------------------------------------------------------------
  const COLOR_KEYS = {
    button: "buttonColor",
    primary: "primaryColor",
    background: "backgroundColor",
    text: "textColor",
    textSecondary: "textSecondaryColor",
    border: "borderColor",
    userMessageBg: "userMessageBg",
    assistantMessageBg: "assistantMessageBg",
  };

  function updateColors(newColors) {
    if (!newColors || typeof newColors !== "object") return;

    for (const key of Object.keys(COLOR_KEYS)) {
      if (!newColors[key]) continue;
      const configKey = COLOR_KEYS[key];
      config[configKey] = validateColor(newColors[key], config[configKey]);
    }
    applyLauncherColors();

    // iframe 에 색상 업데이트 전달 (열려있을 때만)
    if (isOpen && inited) {
      safePost({ type: "WM_UPDATE_COLORS", colors: colorsPayload() });
    }
  }

  // ---- postMessage (origin 검증) -----------------------------------------------------
  function onMessage(e) {
    if (e.origin !== WIDGET_ORIGIN) return;

    const data = e.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "WM_WIDGET_READY") {
      inited = true;
      setGenerating(false);
      if (isOpen) sendInit();
      dispatchEvent("onReady", { widgetKey: config.widgetKey, pageUrl: location.href });
    }

    if (data.type === "WM_REQUEST_CLOSE") close();

    if (data.type === "WM_UPDATE_COLORS") updateColors(data.colors);

    // 답변 생성 중 여부 (위젯이 명시적으로 보냄). 아래 SENT/RECEIVED 는 구버전 위젯용 폴백.
    if (data.type === "WM_GENERATING") setGenerating(data.active);

    if (data.type === "WM_MESSAGE_SENT") {
      setGenerating(true);
      const payload = { message: data.message, role: "user" };
      dispatchEvent("onMessageSent", payload);
      dispatchEvent("onMessage", payload);
    }

    if (data.type === "WM_MESSAGE_RECEIVED") {
      setGenerating(false);
      const payload = { message: data.message, role: "assistant" };
      dispatchEvent("onMessageReceived", payload);
      dispatchEvent("onMessage", payload);
    }
  }

  // ---- 마운트 -----------------------------------------------------------------------------
  btn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);
  resizeHandle.addEventListener("pointerdown", onResizePointerDown);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("message", onMessage);
  document.addEventListener("click", onDocumentClick);
  mq.addEventListener?.("change", onMediaChange);

  document.body.appendChild(overlay);
  document.body.appendChild(launcherHost);
  document.body.appendChild(wrap);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    isOpen = false;
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("message", onMessage);
    document.removeEventListener("click", onDocumentClick);
    mq.removeEventListener?.("change", onMediaChange);
    for (const el of [overlay, launcherHost, wrap]) {
      if (el.parentNode) el.parentNode.removeChild(el);
      else if (el.remove) el.remove();
    }
    for (const key of Object.keys(eventHandlers)) eventHandlers[key].length = 0;
    if (window.ChatbotWidget === api) delete window.ChatbotWidget;
    if (window.updateWidgetColors === updateWidgetColorsAlias) {
      delete window.updateWidgetColors;
    }
  }

  // ---- 5) 전역 API --------------------------------------------------------------------------
  const api = {
    // 열기 / 닫기 / 토글
    open: () => open(),
    close: () => close(),
    toggle: () => toggle(),

    // 상태 조회
    isOpen: () => isOpen,
    isReady: () => inited,
    getState: () => ({
      open: isOpen,
      ready: inited,
      generating: generating,
      launcherVisible: !config.hideButton,
      mode: config.mode,
      mobile: isMobile(),
    }),
    getConfig: () => ({ ...config }),

    // 로더가 준비되면(=이 객체가 존재하면) 즉시 호출. 로드 전 호출은 큐로 지원 (아래 참고)
    ready: (callback) => {
      if (typeof callback === "function") callback(api);
      return api;
    },

    // 패널 크기 변경 (허용 범위: 320~640 x 420~720px, 모바일에서는 다음 데스크톱 전환 시 적용)
    resize: (width, height) => resize(width, height),

    // 기본 런처 표시 제어 (커스텀 트리거를 쓸 때)
    showLauncher: () => setLauncherVisible(true),
    hideLauncher: () => setLauncherVisible(false),
    setLauncherVisible: (visible) => setLauncherVisible(!!visible),

    // 색상 업데이트
    updateColors: (colors) => updateColors(colors),

    // 이벤트 구독. 해제 함수를 반환한다.
    on: (eventName, handler) => {
      if (!eventHandlers[eventName]) {
        console.warn(
          `[ChatbotWidget] Unknown event: ${eventName}. Available events:`,
          Object.keys(eventHandlers).join(", ")
        );
        return () => {};
      }
      eventHandlers[eventName].push(handler);
      return () => api.off(eventName, handler);
    },
    off: (eventName, handler) => {
      const list = eventHandlers[eventName];
      if (!list) return;
      const index = list.indexOf(handler);
      if (index > -1) list.splice(index, 1);
    },

    // 위젯 DOM / 리스너 / 전역 객체를 모두 제거
    destroy: () => destroy(),
  };

  function updateWidgetColorsAlias(colors) {
    updateColors(colors);
  }

  window.ChatbotWidget = api;
  // 하위 호환성을 위한 별칭
  window.updateWidgetColors = updateWidgetColorsAlias;

  // 로드 전 큐: 호스트가 미리 `window.ChatbotWidget = window.ChatbotWidget || []` 를 두고
  // `ChatbotWidget.push(["open"])` 처럼 쌓아두면 로드 직후 순서대로 실행된다.
  for (const command of pendingCommands) {
    const [name, ...args] = Array.isArray(command) ? command : [command];
    if (typeof api[name] === "function") {
      try {
        api[name](...args);
      } catch (error) {
        console.error(`[ChatbotWidget] queued command "${name}" failed:`, error);
      }
    } else {
      console.warn(`[ChatbotWidget] Unknown queued command: ${String(name)}`);
    }
  }

  dispatchEvent("onLoad", { widgetKey: config.widgetKey, pageUrl: location.href });
})();
