import CodeBlock from "../../../components/CodeBlock";

export default function Security() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Security</h1>
      <p className="text-lg text-gray-600 mb-8">
        챗봇 위젯의 보안 구조와 주의사항을 알아보세요.
      </p>

      <div className="space-y-8">
        {/* 보안 구조 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            보안 구조 개요
          </h2>
          <ul className="space-y-3 text-gray-700 list-disc list-inside mb-4">
            <li>위젯 UI는 iframe에서 실행됩니다</li>
            <li>
              호스트 ↔ iframe 통신은 postMessage + origin 검증을 사용합니다
            </li>
            <li>
              실제 AI 요청/비즈니스 로직은 서버에서만 처리하는 것을 전제로
              합니다
            </li>
          </ul>
          <CodeBlock
            code={`Host Page
  └─ loader.js
      └─ iframe (widget UI)
          └─ API 요청 → AI / Backend Server`}
            language="plaintext"
          />
        </section>

        {/* Widget Key 보안 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Widget Key 보안
          </h2>
          <p className="text-gray-700 mb-4">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              widgetKey
            </code>
            는 위젯을 설치한 서비스를 식별하기 위한 키입니다.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-900 font-semibold mb-2">
              ⚠️ 주의사항
            </p>
            <p className="text-sm text-yellow-900">
              widgetKey는 공개 HTML에 포함되므로, 서버에서는 반드시{" "}
              <strong>도메인 기반 검증</strong>을 수행해야 합니다.
            </p>
          </div>
          <p className="text-gray-700 mb-4">
            widgetKey를 통해 서버에서는 다음과 같은 제어가 가능합니다:
          </p>
          <ul className="space-y-2 text-gray-700 list-disc list-inside">
            <li>허용 도메인 제한 (allowedOrigins)</li>
            <li>사용량/레이트 리밋</li>
            <li>테마 및 기능 플래그 분기</li>
            <li>로그 분리</li>
          </ul>
        </section>

        {/* HTTPS 필수 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            HTTPS 필수
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 font-semibold mb-2">
              🔒 보안 필수사항
            </p>
            <p className="text-sm text-red-900 mb-2">
              <code className="bg-red-100 px-2 py-1 rounded">loader.js</code>는
              반드시 <strong>HTTPS 환경</strong>에서 사용하세요.
            </p>
            <p className="text-sm text-red-900">
              HTTP 환경에서는 보안 위험이 있으며, 일부 브라우저에서는 동작하지
              않을 수 있습니다.
            </p>
          </div>
        </section>

        {/* CSP 개요 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Content Security Policy (CSP) 개요
          </h2>
          <p className="text-gray-700 mb-4">
            <strong>Content Security Policy (CSP)</strong>는 XSS(Cross-Site
            Scripting) 및 데이터 인젝션 공격을 방지하기 위한 보안 레이어입니다.
            CSP를 사용하면 브라우저가 로드할 수 있는 리소스(스크립트, 스타일,
            이미지, iframe 등)의 출처를 명시적으로 제한할 수 있습니다.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              💡 CSP가 중요한 이유
            </p>
            <ul className="text-sm text-blue-900 list-disc list-inside space-y-1">
              <li>악성 스크립트 실행 방지</li>
              <li>데이터 탈취 공격 차단</li>
              <li>신뢰할 수 있는 리소스만 로드</li>
              <li>보안 위반 시 리포팅 가능</li>
            </ul>
          </div>
          <p className="text-gray-700 mb-4">
            챗봇 위젯은 외부 스크립트와 iframe을 사용하기 때문에, CSP가 적용된
            사이트에서는 적절한 설정이 필요합니다.
          </p>
        </section>

        {/* 필수 CSP Directive */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            필수 CSP Directive
          </h2>
          <p className="text-gray-700 mb-4">
            챗봇 위젯을 사용하려면 다음 CSP directive들을 설정해야 합니다:
          </p>

          {/* script-src */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              1. script-src
            </h3>
            <p className="text-gray-700 mb-3">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                loader.js
              </code>{" "}
              스크립트를 로드하기 위해 필요합니다.
            </p>
            <CodeBlock
              code={`script-src 'self' https://chatbot.gistory.me;`}
              language="plaintext"
            />
          </div>

          {/* frame-src */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              2. frame-src
            </h3>
            <p className="text-gray-700 mb-3">
              챗봇 위젯 iframe을 로드하기 위해 필요합니다.
            </p>
            <CodeBlock
              code={`frame-src 'self' https://chatbot.gistory.me;`}
              language="plaintext"
            />
          </div>

          {/* connect-src */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              3. connect-src
            </h3>
            <p className="text-gray-700 mb-3">
              API 통신을 위해 필요합니다. 위젯이 서버와 통신할 때 사용됩니다.
            </p>
            <CodeBlock
              code={`connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me;`}
              language="plaintext"
            />
          </div>

          {/* style-src */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              4. style-src (선택사항)
            </h3>
            <p className="text-gray-700 mb-3">
              위젯 스타일링에 인라인 스타일이 필요한 경우 설정합니다.
            </p>
            <CodeBlock
              code={`style-src 'self' 'unsafe-inline';`}
              language="plaintext"
            />
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
              <p className="text-sm text-yellow-900">
                ⚠️{" "}
                <code className="bg-yellow-100 px-1 py-0.5 rounded">
                  'unsafe-inline'
                </code>
                은 보안상 권장되지 않습니다. 가능하면 nonce 또는 hash 기반
                방식을 사용하세요.
              </p>
            </div>
          </div>
        </section>

        {/* 전체 CSP 설정 예시 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            전체 CSP 설정 예시
          </h2>
          <p className="text-gray-700 mb-4">
            챗봇 위젯을 위한 권장 CSP 설정입니다:
          </p>
          <CodeBlock
            code={`Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://chatbot.gistory.me;
  frame-src 'self' https://chatbot.gistory.me;
  connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://chatbot.gistory.me data:;
  font-src 'self';`}
            language="plaintext"
          />
        </section>

        {/* 서버별 CSP 설정 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            서버별 CSP 설정 방법
          </h2>

          {/* Nginx */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Nginx</h3>
            <CodeBlock
              code={`# nginx.conf 또는 사이트 설정 파일
server {
    # ... 기존 설정 ...

    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://chatbot.gistory.me; frame-src 'self' https://chatbot.gistory.me; connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me; style-src 'self' 'unsafe-inline'; img-src 'self' https://chatbot.gistory.me data:;" always;
}`}
              language="nginx"
            />
          </div>

          {/* Apache */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Apache</h3>
            <CodeBlock
              code={`# .htaccess 또는 httpd.conf
<IfModule mod_headers.c>
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' https://chatbot.gistory.me; frame-src 'self' https://chatbot.gistory.me; connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me; style-src 'self' 'unsafe-inline'; img-src 'self' https://chatbot.gistory.me data:;"
</IfModule>`}
              language="apache"
            />
          </div>

          {/* Node.js / Express */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Node.js / Express
            </h3>
            <CodeBlock
              code={`// helmet 패키지 사용 (권장)
const helmet = require('helmet');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://chatbot.gistory.me"],
      frameSrc: ["'self'", "https://chatbot.gistory.me"],
      connectSrc: ["'self'", "https://chatbot.gistory.me", "https://api.chatbot.gistory.me"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https://chatbot.gistory.me", "data:"],
    },
  })
);`}
              language="javascript"
            />
            <p className="text-gray-600 text-sm mt-2">
              또는 직접 헤더를 설정할 수 있습니다:
            </p>
            <CodeBlock
              code={`// 미들웨어로 직접 설정
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://chatbot.gistory.me; frame-src 'self' https://chatbot.gistory.me; connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me; style-src 'self' 'unsafe-inline'; img-src 'self' https://chatbot.gistory.me data:;"
  );
  next();
});`}
              language="javascript"
            />
          </div>

          {/* Next.js */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Next.js</h3>
            <CodeBlock
              code={`// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: \`
      default-src 'self';
      script-src 'self' https://chatbot.gistory.me;
      frame-src 'self' https://chatbot.gistory.me;
      connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me;
      style-src 'self' 'unsafe-inline';
      img-src 'self' https://chatbot.gistory.me data:;
    \`.replace(/\\n/g, ' ').trim(),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};`}
              language="javascript"
            />
          </div>

          {/* Cloudflare */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Cloudflare Workers / Pages
            </h3>
            <CodeBlock
              code={`// _headers 파일 (Cloudflare Pages)
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://chatbot.gistory.me; frame-src 'self' https://chatbot.gistory.me; connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me; style-src 'self' 'unsafe-inline'; img-src 'self' https://chatbot.gistory.me data:;`}
              language="plaintext"
            />
          </div>

          {/* Vercel */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Vercel</h3>
            <CodeBlock
              code={`// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://chatbot.gistory.me; frame-src 'self' https://chatbot.gistory.me; connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me; style-src 'self' 'unsafe-inline'; img-src 'self' https://chatbot.gistory.me data:;"
        }
      ]
    }
  ]
}`}
              language="json"
            />
          </div>

          {/* HTML meta 태그 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              HTML meta 태그 (권장하지 않음)
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-yellow-900">
                ⚠️ meta 태그를 통한 CSP 설정은 일부 directive(frame-ancestors,
                report-uri 등)를 지원하지 않으며, HTTP 헤더 방식보다 보안성이
                낮습니다. 가능하면 서버에서 HTTP 헤더로 설정하세요.
              </p>
            </div>
            <CodeBlock
              code={`<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' https://chatbot.gistory.me; frame-src 'self' https://chatbot.gistory.me; connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me; style-src 'self' 'unsafe-inline'; img-src 'self' https://chatbot.gistory.me data:;">`}
              language="html"
            />
          </div>
        </section>

        {/* Nonce 기반 CSP */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Nonce 기반 CSP 설정 (고급)
          </h2>
          <p className="text-gray-700 mb-4">
            더 강력한 보안을 위해 nonce(number used once) 기반 CSP를 사용할 수
            있습니다. nonce는 매 요청마다 고유하게 생성되는 임의의 문자열입니다.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-900 font-semibold mb-2">
              ✅ Nonce 기반 CSP의 장점
            </p>
            <ul className="text-sm text-green-900 list-disc list-inside space-y-1">
              <li>
                <code className="bg-green-100 px-1 py-0.5 rounded">
                  'unsafe-inline'
                </code>{" "}
                없이 인라인 스크립트 허용
              </li>
              <li>요청별로 고유한 토큰 사용으로 재사용 공격 방지</li>
              <li>더 세밀한 스크립트 실행 제어</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Node.js / Express 예시
          </h3>
          <CodeBlock
            code={`const crypto = require('crypto');

app.use((req, res, next) => {
  // 매 요청마다 새로운 nonce 생성
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  
  res.setHeader(
    'Content-Security-Policy',
    \`default-src 'self'; script-src 'self' 'nonce-\${res.locals.nonce}' https://chatbot.gistory.me; frame-src 'self' https://chatbot.gistory.me; connect-src 'self' https://chatbot.gistory.me https://api.chatbot.gistory.me;\`
  );
  next();
});

// HTML 렌더링 시 nonce 전달
app.get('/', (req, res) => {
  res.render('index', { nonce: res.locals.nonce });
});`}
            language="javascript"
          />

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
            HTML에서 nonce 사용
          </h3>
          <CodeBlock
            code={`<!-- 서버에서 렌더링된 nonce 사용 -->
<script nonce="{{nonce}}" src="https://chatbot.gistory.me/loader.js"></script>
<script nonce="{{nonce}}">
  window.ChatWidget.init({
    widgetKey: 'YOUR_WIDGET_KEY'
  });
</script>`}
            language="html"
          />
        </section>

        {/* CSP 위반 리포팅 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            CSP 위반 리포팅
          </h2>
          <p className="text-gray-700 mb-4">
            CSP 위반이 발생했을 때 서버로 리포트를 전송하도록 설정할 수 있습니다.
            이를 통해 잠재적인 공격 시도나 설정 오류를 모니터링할 수 있습니다.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            report-uri (레거시)
          </h3>
          <CodeBlock
            code={`Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://chatbot.gistory.me; 
  frame-src 'self' https://chatbot.gistory.me;
  report-uri /csp-report-endpoint;`}
            language="plaintext"
          />

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
            report-to (권장)
          </h3>
          <CodeBlock
            code={`// Report-To 헤더 설정
Report-To: {"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"https://your-domain.com/csp-report"}]}

// CSP 헤더에 report-to 추가
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://chatbot.gistory.me; 
  frame-src 'self' https://chatbot.gistory.me;
  report-to csp-endpoint;`}
            language="plaintext"
          />

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
            Report-Only 모드
          </h3>
          <p className="text-gray-700 mb-3">
            새로운 CSP 정책을 테스트할 때는{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              Content-Security-Policy-Report-Only
            </code>{" "}
            헤더를 사용하세요. 이 모드에서는 정책이 실제로 적용되지 않고
            위반사항만 리포트됩니다.
          </p>
          <CodeBlock
            code={`Content-Security-Policy-Report-Only: 
  default-src 'self'; 
  script-src 'self' https://chatbot.gistory.me; 
  frame-src 'self' https://chatbot.gistory.me;
  report-uri /csp-report-endpoint;`}
            language="plaintext"
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
            <p className="text-sm text-blue-900">
              💡 <strong>팁:</strong> 프로덕션에 적용하기 전에 항상 Report-Only
              모드로 먼저 테스트하세요. 예상치 못한 차단으로 인한 서비스 장애를
              방지할 수 있습니다.
            </p>
          </div>
        </section>

        {/* CSP 트러블슈팅 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            CSP 트러블슈팅
          </h2>
          <p className="text-gray-700 mb-4">
            CSP 관련 문제가 발생했을 때 확인해야 할 사항들입니다.
          </p>

          {/* 브라우저 콘솔 확인 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              1. 브라우저 콘솔 확인
            </h3>
            <p className="text-gray-700 mb-3">
              CSP 위반이 발생하면 브라우저 개발자 도구 콘솔에 다음과 같은 에러가
              표시됩니다:
            </p>
            <CodeBlock
              code={`Refused to load the script 'https://chatbot.gistory.me/loader.js' 
because it violates the following Content Security Policy directive: 
"script-src 'self'".`}
              language="plaintext"
            />
          </div>

          {/* 일반적인 문제들 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              2. 일반적인 문제와 해결책
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      증상
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      원인
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      해결책
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      loader.js가 로드되지 않음
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      script-src 누락
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        script-src
                      </code>
                      에{" "}
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        https://chatbot.gistory.me
                      </code>{" "}
                      추가
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      iframe이 표시되지 않음
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      frame-src 누락
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        frame-src
                      </code>
                      에{" "}
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        https://chatbot.gistory.me
                      </code>{" "}
                      추가
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      API 요청 실패
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      connect-src 누락
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        connect-src
                      </code>
                      에 API 도메인 추가
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      스타일이 적용되지 않음
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      style-src 제한
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        style-src
                      </code>
                      에{" "}
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        'unsafe-inline'
                      </code>{" "}
                      또는 nonce 추가
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      이미지가 로드되지 않음
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      img-src 누락
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        img-src
                      </code>
                      에 이미지 도메인 추가
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CSP 테스트 도구 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              3. CSP 테스트 도구
            </h3>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>
                <strong>Google CSP Evaluator:</strong>{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  https://csp-evaluator.withgoogle.com/
                </code>
              </li>
              <li>
                <strong>Mozilla Observatory:</strong>{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  https://observatory.mozilla.org/
                </code>
              </li>
              <li>
                <strong>Security Headers:</strong>{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  https://securityheaders.com/
                </code>
              </li>
            </ul>
          </div>

          {/* 디버깅 체크리스트 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              4. 디버깅 체크리스트
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">☐</span>
                  브라우저 개발자 도구에서 CSP 에러 메시지 확인
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">☐</span>
                  Network 탭에서 응답 헤더의 CSP 값 확인
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">☐</span>
                  모든 필수 directive가 포함되어 있는지 확인
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">☐</span>
                  도메인 URL이 정확한지 확인 (https:// 포함)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">☐</span>
                  CSP 값에 문법 오류가 없는지 확인
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">☐</span>
                  캐시 삭제 후 재테스트
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 추가 보안 헤더 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            추가 권장 보안 헤더
          </h2>
          <p className="text-gray-700 mb-4">
            CSP 외에도 다음 보안 헤더들을 함께 설정하는 것을 권장합니다:
          </p>
          <CodeBlock
            code={`# X-Frame-Options - 클릭재킹 방지
X-Frame-Options: SAMEORIGIN

# X-Content-Type-Options - MIME 스니핑 방지
X-Content-Type-Options: nosniff

# X-XSS-Protection - 브라우저 XSS 필터 활성화 (레거시)
X-XSS-Protection: 1; mode=block

# Referrer-Policy - 리퍼러 정보 제어
Referrer-Policy: strict-origin-when-cross-origin

# Permissions-Policy - 브라우저 기능 제어
Permissions-Policy: camera=(), microphone=(), geolocation=()`}
            language="plaintext"
          />
        </section>

        {/* 자주 묻는 질문 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            CSP 관련 FAQ
          </h2>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: 'unsafe-inline'을 사용하지 않으면서 인라인 스크립트를 허용할 수
                있나요?
              </h4>
              <p className="text-gray-700">
                A: 네, nonce 또는 hash 기반 CSP를 사용하면 됩니다. 위의 "Nonce
                기반 CSP 설정" 섹션을 참고하세요.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: 여러 도메인을 허용해야 할 때는 어떻게 하나요?
              </h4>
              <p className="text-gray-700">
                A: 공백으로 구분하여 여러 도메인을 나열하면 됩니다:
                <code className="bg-gray-100 px-2 py-1 rounded text-sm ml-2">
                  script-src 'self' https://a.com https://b.com;
                </code>
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: 와일드카드(*)를 사용해도 되나요?
              </h4>
              <p className="text-gray-700">
                A: 가능하지만 권장하지 않습니다. 와일드카드는 보안을 약화시킵니다.
                필요한 도메인만 명시적으로 허용하세요. 서브도메인 와일드카드
                (*.example.com)는 주의해서 사용하세요.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: CSP가 적용되어 있는지 어떻게 확인하나요?
              </h4>
              <p className="text-gray-700">
                A: 브라우저 개발자 도구 → Network 탭 → 페이지 요청 선택 →
                Response Headers에서{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  Content-Security-Policy
                </code>{" "}
                헤더를 확인하세요.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: frame-src와 child-src의 차이는 무엇인가요?
              </h4>
              <p className="text-gray-700">
                A:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  frame-src
                </code>
                는 iframe의 출처를 제어하고,{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  child-src
                </code>
                는 iframe과 Web Worker 모두를 제어합니다. CSP Level 3에서는{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  frame-src
                </code>
                사용을 권장합니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
