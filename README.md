# Chatbot Widget (Embed SDK)

<div align="center">

**여러 웹 서비스에 스크립트 한 줄로 설치할 수 있는 iframe 기반 챗봇 위젯**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[문서](#) · [예제](#) · [문제 신고](#)

</div>

---

## 📖 소개

Chatbot Widget은 웹사이트에 **간단하게 통합할 수 있는 임베디드 챗봇 위젯**입니다. iframe 기반의 격리된 구조로 호스트 페이지와 CSS/JS 충돌 없이 안정적으로 동작하며, 다양한 커스터마이징 옵션을 제공합니다.

### 주요 특징

- 🚀 **원라이너 설치**: 스크립트 태그 하나로 즉시 사용 가능
- 🎨 **완전한 커스터마이징**: 색상, 레이아웃, 위치 등 자유롭게 설정
- 🔒 **격리된 구조**: iframe 기반으로 호스트 페이지와 완전 분리
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두 지원
- 🔌 **이벤트 API**: 위젯 상태와 메시지 이벤트를 실시간으로 감지
- ⚡ **가벼움**: 최소한의 리소스로 빠른 로딩

---

## 🚀 빠른 시작

### 설치

웹사이트의 `<body>` 태그 하단에 아래 스크립트를 추가하세요:

```html
<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>
```

설치 즉시 화면 우하단에 챗봇 런처 버튼이 표시됩니다.

### 기본 예제

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>내 웹사이트</title>
  </head>
  <body>
    <h1>환영합니다!</h1>

    <!-- 챗봇 위젯 설치 -->
    <script
      src="https://chatbot.gistory.me/loader.js"
      data-widget-key="wk_live_abc123"
    ></script>
  </body>
</html>
```

### 커스터마이징 예제

```html
<script
  src="https://chatbot.gistory.me/loader.js"
  data-widget-key="wk_live_abc123"
  data-position="right"
  data-primary-color="df3326"
  data-button-color="df3326"
  data-width="380"
  data-height="560"
></script>
```

더 자세한 사용법은 [문서](#)를 참고하세요.

---

## 🛠 기술 스택

- **React** + **TypeScript** - 위젯 UI 개발
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Query** - 상태 관리
- **OAuth2/OIDC** - 인증 시스템

---

## 📦 설치 및 개발

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/chatbot-fe.git
cd chatbot-fe

# 의존성 설치
npm install
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env.example` 파일을 복사한 후 필요한 값을 설정하세요.

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

---

## 🏗 프로젝트 구조

```
chatbot-fe/
├── src/
│   ├── components/     # 공통 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── widget/         # 위젯 UI
│   ├── api/            # API 클라이언트
│   └── ...
├── public/
│   └── loader.js       # 위젯 로더 스크립트
└── ...
```

---

## 🤝 기여하기

기여는 언제나 환영합니다!

1. 이 저장소를 Fork 하세요
2. 새로운 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

---

## 📚 추가 자료

- [상세 문서](#) - API 레퍼런스, 가이드 등
- [예제 모음](#) - 다양한 사용 예제
- [문제 신고](#) - 버그 리포트 및 기능 제안

---

## ⚠️ 주의사항

- `loader.js`는 반드시 HTTPS 환경에서 사용하세요
- 이 레포는 **위젯 UI + 로더 스크립트**만 포함합니다
- AI 서버 및 실제 응답 로직은 별도의 서버에서 처리됩니다

---

<div align="center">

**Made with ❤️ by Infoteam**

[문서](#) · [GitHub](#) · [이슈](#)

</div>
