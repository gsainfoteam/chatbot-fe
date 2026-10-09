# GIST 챗봇 홈 리디자인 — 구현 핸드오프

chatbot.gistory.me 홈을 "서비스 소개 + 위젯 설치 코드" 페이지에서
"들어오자마자 질문하는 채팅 앱"(GPT/Gemini 구조)으로 바꾸는 시안입니다.

## 파일

| 파일 | 내용 |
|---|---|
| `screens/01-home-new-chat.html` | 홈(새 채팅). 좌측 사이드바 + 중앙 인사말/입력창/추천 질문 4개 |
| `screens/02-thread-with-sources.html` | 대화 중 화면. 질문 버블, 답변 표, 원문 확인 경고, 출처 카드 2장, 피드백 버튼, 후속 질문 칩 |
| `screens/03-settings-menu-open.html` | 사이드바 하단 "설정" 메뉴가 열린 상태 (크롭) |
| `tokens/tokens.json` | 색·타이포·간격·radius·그림자 토큰 (light/dark) |

## 화면 파일 읽는 법

- 각 파일은 디자인 캔버스용 포맷(`.dc.html`)이라 브라우저에서 단독으로 열면 렌더되지 않습니다. **마크업을 스펙으로 읽는 용도**입니다.
- 실제 UI는 `<x-dc>` 안의 마크업 전부입니다. 모든 스타일이 인라인 `style=""`이라 값(px, 색, radius)을 그대로 옮기면 됩니다.
- `<helmet><style>`에는 body 기본값, hover 규칙, 격자 배경(`.grid-bg`)이 있습니다.
- `<sc-for list="{{sections}}" as="sec">` 는 반복 블록입니다. 데이터는 파일 맨 아래 `<script type="text/x-dc">` 안 `renderVals()`의 `sections` 배열에 있습니다 (채팅 기록 샘플: 오늘 / 어제 / 지난 7일).
- `<sc-if value="{{menuOpen}}">` 는 조건부 렌더. 설정 메뉴 열림/닫힘 상태입니다.
- `<a href="Thread.dc.html">` 같은 링크는 프로토타입 화면 이동이라 실제 라우팅으로 바꾸면 됩니다.
- 모든 아이콘은 인라인 SVG(24 그리드, stroke 1.8)입니다. lucide 계열로 대체 가능.

## 구조 요약

```
<div 1440×900 flex>
  <aside 272px>                 # sidebar, bg #f9fafb, border-right #e6e7eb
    로고 + 접기 버튼
    [새 채팅] 버튼 (brand #ce4333, radius 10, h44)
    채팅 검색 input
    <nav> 채팅 기록: 섹션 레이블(오늘/어제/지난 7일) + 항목 (h36, radius 10)
         활성 항목: bg #fcf3f3, border #f7dcd8
    ── 구분선 ──
    [⚙ 설정] 버튼 → 위로 열리는 메뉴 248px:
         대시보드 [관리자] / 문서 관리 [관리자] / ── / 문서 / 키 발급
         (관리자 아닌 계정은 위 두 줄 숨김)
    ── 구분선 ──
    아바타 + 이름/역할 + 로그아웃 아이콘
  <main flex-grow>              # bg #fefcfc + 48px 격자(#f8f0ef)
    상단 바 h60 (홈: "새 채팅" + 이용 안내 / 스레드: 대화 제목 + 공유 + ⋯)
    홈: 배지 → h1 인사말(44px/800, 2행째 brand) → 입력창 760px(radius 26) → 추천 질문 2×2
    스레드: 메시지 스크롤 영역 → 하단 입력창 760px
    footnote 12px "답변은 GIST 공지를 바탕으로…"
```

## 핵심 토큰 (전체는 tokens.json)

| 토큰 | Light | 용도 |
|---|---|---|
| brand | #ce4333 | 주 버튼, 전송 버튼, 인사말 2행, 활성 텍스트 |
| brand-strong | #b83a2b | hover, brand-50 위 작은 텍스트(배지) |
| brand-50 / brand-100 | #fcf3f3 / #f7dcd8 | 배지·활성 항목 배경 / 테두리 |
| bg / surface / sidebar | #fefcfc / #ffffff / #f9fafb | 메인 / 카드·입력창 / 사이드바 |
| hover / border | #f3f4f6 / #e6e7eb | hover, 사용자 버블 / 구분선 |
| ink / ink-2 / muted / subtle | #121827 / #384151 / #4c5564 / #6c7281 | 텍스트 4단계 |
| radius md / lg / xl / pill | 10 / 16 / 26 / 999 px | 버튼·항목 / 카드·버블 / 입력창 / 칩·배지 |
| shadow-composer | 0 8px 28px rgba(206,67,51,.08), 0 1px 3px rgba(18,24,39,.06) | 입력창 |

폰트: Pretendard → Apple SD Gothic Neo → Noto Sans KR 순 폴백.

## 구현 시 결정이 필요한 것 (시안에 없음)

- 채팅 기록 데이터 모델 / API (사이드바 섹션은 날짜 기준 그룹핑)
- 답변의 출처 카드: `[공지 제목]`, `[게시일]` 자리는 placeholder. 실제 RAG 응답의 출처 필드와 매핑 필요
- "출처 공지 함께 보기" 토글이 실제 옵션인지, 항상 켜진 것인지
- 모바일(390px) 레이아웃: 시안 없음. 사이드바를 드로어로 전환하는 게 자연스러움
- 다크 모드: tokens.json에 dark 값은 있으나 화면 시안은 없음
- 로고: 시안은 "G" 텍스트 placeholder. 실제 로고 SVG로 교체

## 구현 메모 (시안과 다르게 결정한 것)

- 입력창의 "파일 첨부" 버튼: 위젯 API에 업로드가 없어 비활성(흐림, `aria-disabled`) 상태로 두고 "파일 첨부는 준비 중이에요" 툴팁을 보여줍니다. 업로드가 생기면 시안의 활성 `icon-btn` 모양으로 되돌리면 됩니다.
