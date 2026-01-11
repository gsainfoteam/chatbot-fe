export default function FAQ() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        FAQ / Troubleshooting
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        자주 묻는 질문과 문제 해결 방법을 확인하세요.
      </p>

      <div className="space-y-8">
        {/* 위젯이 표시되지 않는 경우 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            위젯이 표시되지 않아요
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1. 스크립트가 제대로 로드되었는지 확인
              </h3>
              <p className="text-gray-700 mb-2">
                브라우저 개발자 도구(F12)의 Console 탭에서 오류 메시지를
                확인하세요.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>
                  네트워크 탭에서{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    loader.js
                  </code>
                  가 성공적으로 로드되었는지 확인
                </li>
                <li>CORS 오류가 있는지 확인</li>
                <li>404 에러가 있는지 확인</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2. Widget Key 확인
              </h3>
              <p className="text-gray-700 mb-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  data-widget-key
                </code>{" "}
                속성이 올바르게 설정되었는지 확인하세요.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                3. 도메인 등록 확인
              </h3>
              <p className="text-gray-700 mb-2">
                대시보드에서 현재 도메인이 허용 도메인 목록에 등록되어 있는지
                확인하세요.
              </p>
            </div>
          </div>
        </section>

        {/* CORS 오류 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            CORS 오류가 발생해요
          </h2>
          <p className="text-gray-700 mb-4">
            CORS(Cross-Origin Resource Sharing) 오류는 위젯 도메인과 호스트
            페이지 도메인이 다를 때 발생할 수 있습니다.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>해결 방법:</strong> 위젯 서버에서 호스트 페이지의 도메인을
              허용하도록 CORS 설정이 되어 있어야 합니다. 백엔드 관리자에게
              문의하세요.
            </p>
          </div>
        </section>

        {/* CSP 설정 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Content Security Policy (CSP) 오류
          </h2>
          <p className="text-gray-700 mb-4">
            강한 CSP 정책이 설정된 사이트에서는 위젯이 차단될 수 있습니다.
          </p>
          <p className="text-gray-700 mb-4">다음을 CSP에 추가하세요:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                script-src
              </code>
              에 위젯 도메인 허용
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                frame-src
              </code>
              에 위젯 도메인 허용
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                connect-src
              </code>
              에 API 도메인 허용 (필요시)
            </li>
          </ul>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 자세한 내용은{" "}
              <a
                href="/docs/security"
                className="text-[#df3326] hover:underline font-medium"
              >
                Security 문서
              </a>
              를 참고하세요.
            </p>
          </div>
        </section>

        {/* 이벤트가 발생하지 않는 경우 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            이벤트가 발생하지 않아요
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1. 위젯이 준비되었는지 확인
              </h3>
              <p className="text-gray-700">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  ChatbotWidget.isReady()
                </code>
                를 사용하여 위젯이 준비되었는지 확인하세요.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2. 이벤트 리스너 등록 시점
              </h3>
              <p className="text-gray-700">
                이벤트 리스너는 스크립트 로드 후, 위젯이 준비되기 전에 등록하는
                것이 좋습니다.{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  onReady
                </code>{" "}
                이벤트를 활용하세요.
              </p>
            </div>
          </div>
        </section>

        {/* Widget Key 관련 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Widget Key를 잃어버렸어요
          </h2>
          <p className="text-gray-700 mb-4">
            대시보드에 로그인하여 발급받은 위젯 키 목록을 확인할 수 있습니다.
            새로운 키를 발급받아 사용할 수도 있습니다.
          </p>
        </section>

        {/* 성능 문제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            위젯이 페이지 로딩을 느리게 만들어요
          </h2>
          <p className="text-gray-700 mb-4">
            위젯은 비동기적으로 로드되므로 페이지 로딩 속도에 영향을 주지 않아야
            합니다.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>
              스크립트를{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                &lt;body&gt;
              </code>{" "}
              태그 하단에 배치하세요
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                async
              </code>{" "}
              또는{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                defer
              </code>{" "}
              속성을 사용하지 마세요 (위젯이 자동으로 처리합니다)
            </li>
            <li>네트워크 탭에서 실제 로딩 시간을 확인하세요</li>
          </ul>
        </section>

        {/* 모바일에서 문제 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            모바일에서 위젯이 제대로 동작하지 않아요
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1. 뷰포트 메타 태그 확인
              </h3>
              <p className="text-gray-700">
                HTML{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  &lt;head&gt;
                </code>
                에 뷰포트 메타 태그가 있는지 확인하세요:
              </p>
              <div className="mt-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  &lt;meta name="viewport" content="width=device-width,
                  initial-scale=1.0"&gt;
                </code>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2. 모바일 브라우저 캐시
              </h3>
              <p className="text-gray-700">
                모바일 브라우저의 캐시를 지우고 다시 시도해보세요.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
