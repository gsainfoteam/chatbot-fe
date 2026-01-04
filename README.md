# Chatbot Widget (Embed SDK)

여러 웹 서비스에 **스크립트 한 줄로 설치할 수 있는 iframe 기반 챗봇 위젯**입니다.  
호스트 페이지와 완전히 분리된 구조로, CSS/JS 충돌 없이 안정적으로 동작합니다.

> ⚠️ 이 레포는 **위젯 UI + 로더 스크립트**만 포함합니다.  
> AI 서버 및 실제 응답 로직은 별도의 서버에서 처리됩니다.

---

## 설치 방법 (사용자 기준)

아래 스크립트를 **웹사이트의 `<body>` 하단**에 추가하세요.

```html
<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>
```

설치 즉시 화면 우하단에 챗봇 런처 버튼이 표시됩니다.

---

⚙️ Script 옵션 (data-\*)

### 레이아웃 옵션

| 옵션            | 설명                         | 기본값 |
| --------------- | ---------------------------- | ------ |
| data-widget-key | 위젯 식별 키                 | (필수) |
| data-position   | 버튼 위치 (`right` / `left`) | right  |
| data-offset     | 화면 가장자리 여백(px)       | 18     |
| data-width      | 위젯 패널 너비(px)           | 360    |
| data-height     | 위젯 패널 높이(px)           | 520    |
| data-theme      | 테마 식별자                  | light  |

### 색상 커스터마이징 옵션

| 옵션                      | 설명                                    | 기본값  | 예시     |
| ------------------------- | --------------------------------------- | ------- | -------- |
| data-primary-color        | 주요 색상 (아이콘, 전송 버튼 등)        | ff4500  | `3b82f6` |
| data-button-color         | 런처 버튼 배경색                        | primary | `10b981` |
| data-background-color     | 위젯 배경색                             | ffffff  | `ffffff` |
| data-text-color           | 기본 텍스트 색상                        | 1e293b  | `1e293b` |
| data-text-secondary-color | 보조 텍스트 색상 (설명 텍스트 등)       | 64748b  | `64748b` |
| data-border-color         | 테두리 색상                             | e2e8f0  | `e2e8f0` |
| data-user-message-bg      | 사용자 메시지 배경색 (투명도 자동 적용) | primary | `3b82f6` |
| data-assistant-message-bg | 어시스턴트 메시지 배경색                | ffffff  | `ffffff` |

> **참고**: 색상 값은 `#` 없이 6자리 hex 코드로 입력하세요. (예: `ff4500`, `3b82f6`)

예시

```html
<!-- 기본 설정 -->
<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="wk_live_abc123"
  data-position="right"
  data-offset="20"
  data-width="380"
  data-height="560"
></script>

<!-- 색상 커스터마이징 예시 -->
<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="wk_live_abc123"
  data-primary-color="3b82f6"
  data-button-color="2563eb"
  data-user-message-bg="3b82f6"
  data-text-color="1e293b"
></script>
```

---

🧠 widgetKey란?

widgetKey는 위젯을 설치한 서비스(사이트)를 식별하기 위한 키입니다.

이를 통해 서버에서는 다음과 같은 제어가 가능합니다:

- 허용 도메인 제한 (allowedOrigins)
- 사용량/레이트 리밋
- 테마 및 기능 플래그 분기
- 로그 분리

widgetKey는 공개 HTML에 포함되므로,  
서버에서는 반드시 도메인 기반 검증을 수행해야 합니다.

---

## JavaScript API

위젯 설치 후 `window.ChatbotWidget` 객체를 통해 위젯을 제어하고 이벤트를 감지할 수 있습니다.

### 이벤트 훅

위젯의 상태 변화와 메시지 송수신을 감지할 수 있습니다.

```javascript
// 이벤트 리스너 등록
ChatbotWidget.on("onOpen", (data) => {
  console.log("위젯이 열렸습니다", data);
  // 예: Google Analytics 이벤트 전송
  // gtag('event', 'chatbot_opened');
});

// 이벤트 리스너 제거 (unsubscribe 함수 반환)
const unsubscribe = ChatbotWidget.on("onMessage", (data) => {
  console.log("메시지 이벤트", data);
});

// 나중에 제거
unsubscribe();

// 또는 off 메서드 사용
ChatbotWidget.off("onMessage", handler);
```

#### 사용 가능한 이벤트

| 이벤트              | 설명                        | 데이터 구조                       |
| ------------------- | --------------------------- | --------------------------------- |
| `onOpen`            | 위젯이 열릴 때              | `{ widgetKey, pageUrl }`          |
| `onClose`           | 위젯이 닫힐 때              | `{ widgetKey, pageUrl }`          |
| `onReady`           | 위젯이 준비되었을 때        | `{ widgetKey, pageUrl }`          |
| `onMessage`         | 메시지가 송수신될 때 (통합) | `{ message, role }`               |
| `onMessageSent`     | 사용자가 메시지를 보낼 때   | `{ message: { id, text, role } }` |
| `onMessageReceived` | 봇이 응답할 때              | `{ message: { id, text, role } }` |

#### 이벤트 사용 예시

```javascript
// 위젯 열림 감지
ChatbotWidget.on("onOpen", (data) => {
  console.log("위젯 열림:", data.widgetKey, data.pageUrl);
});

// 메시지 전송 추적
ChatbotWidget.on("onMessageSent", (data) => {
  console.log("사용자 메시지:", data.message.text);
  // 예: 사용자 행동 분석
});

// 메시지 수신 추적
ChatbotWidget.on("onMessageReceived", (data) => {
  console.log("봇 응답:", data.message.text);
  // 예: 응답 품질 모니터링
});
```

### 위젯 제어 API

```javascript
// 위젯 열기
ChatbotWidget.open();

// 위젯 닫기
ChatbotWidget.close();

// 위젯 상태 확인
ChatbotWidget.isOpen(); // boolean
ChatbotWidget.isReady(); // boolean

// 설정 정보 가져오기
const config = ChatbotWidget.getConfig();
console.log(config); // { widgetKey, position, colors, ... }
```

### 색상 동적 업데이트

위젯이 로드된 후에도 색상을 동적으로 변경할 수 있습니다.

```javascript
ChatbotWidget.updateColors({
  primary: "3b82f6",
  button: "2563eb",
  background: "ffffff",
  text: "1e293b",
  textSecondary: "64748b",
  border: "e2e8f0",
  userMessageBg: "3b82f6",
  assistantMessageBg: "ffffff",
});
```

> **참고**: 색상 값은 `#` 없이 6자리 hex 코드로 입력하세요.

### CustomEvent 방식

`ChatbotWidget.on()` 외에도 브라우저의 `CustomEvent`를 직접 사용할 수 있습니다.

```javascript
window.addEventListener("chatbot:onOpen", (event) => {
  console.log("위젯 열림:", event.detail);
});

window.addEventListener("chatbot:onMessage", (event) => {
  console.log("메시지:", event.detail);
});
```

---

🔐 보안 구조 개요

- 위젯 UI는 iframe에서 실행됩니다.
- 호스트 ↔ iframe 통신은 postMessage + origin 검증을 사용합니다.
- 실제 AI 요청/비즈니스 로직은 서버에서만 처리하는 것을 전제로 합니다.

```
Host Page
  └─ loader.js
      └─ iframe (widget UI)
          └─ API 요청 → AI / Backend Server
```

---

🚀 개발 & 배포 (Maintainers)

로컬 개발

```bash
npm install
npm run dev
```

빌드

```bash
npm run build
```

빌드 결과물은 `dist/`에 생성됩니다.

---

📁 프로젝트 구조

```
.
├─ public/
│  ├─ loader.js        # 호스트에 삽입되는 로더 스크립트
│  └─ _headers         # Cloudflare Pages 캐시 설정
├─ src/
│  └─ App.tsx          # iframe 내부 위젯 UI
├─ dist/               # 빌드 결과물 (커밋 ❌)
└─ README.md
```

---

❗ 주의사항

- `loader.js`는 반드시 HTTPS 환경에서 사용하세요.
- `loader.js`는 항상 최신 버전을 받아야 하므로 `no-cache`를 권장합니다.
- CSP(Content-Security-Policy)가 강한 사이트에서는 `script-src` / `frame-src`에 위젯 도메인 허용이 필요할 수 있습니다.
- 이 레포는 UI SDK이며, AI 서버는 포함하지 않습니다.

---

📌 로드맵 (예정)

- widgetKey 발급/관리 콘솔
- AI 서버 연동 가이드
- 스트리밍 응답(SSE)
- 테마/브랜드 커스터마이징
