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

| 옵션            | 설명                         | 기본값 |
| --------------- | ---------------------------- | ------ |
| data-widget-key | 위젯 식별 키                 | (필수) |
| data-position   | 버튼 위치 (`right` / `left`) | right  |
| data-offset     | 화면 가장자리 여백(px)       | 18     |
| data-width      | 위젯 패널 너비(px)           | 360    |
| data-height     | 위젯 패널 높이(px)           | 520    |
| data-theme      | 테마 식별자                  | light  |

예시

```html
<script
  src="https://widget.yourdomain.com/loader.js"
  data-widget-key="wk_live_abc123"
  data-position="right"
  data-offset="20"
  data-width="380"
  data-height="560"
></script>
```

---

🧠 widgetKey란?

widgetKey는 위젯을 설치한 서비스(사이트)를 식별하기 위한 키입니다.

이를 통해 서버에서는 다음과 같은 제어가 가능합니다:

- 허용 도메인 제한 (allowedOrigins)
- 사용량/레이트 리밋
- 테마 및 기능 플래그 분기
- 향후 과금/로그 분리

widgetKey는 공개 HTML에 포함되므로,  
서버에서는 반드시 도메인 기반 검증을 수행해야 합니다.

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
- 이벤트 훅(onOpen, onMessage 등)
