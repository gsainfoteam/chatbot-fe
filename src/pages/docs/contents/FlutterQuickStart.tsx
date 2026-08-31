import CodeBlock from "../../../components/CodeBlock";

export default function FlutterQuickStart() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Flutter 시작하기
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        <a
          href="https://pub.dev/packages/gist_chatbot_flutter"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#df3326] hover:underline font-medium"
        >
          gist_chatbot_flutter
        </a>{" "}
        패키지를 사용하면 Flutter 앱에서도 웹과 동일한 챗봇 경험을 제공할 수
        있습니다.
      </p>

      <div className="space-y-8">
        {/* Step 1 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#df3326] text-white rounded-full text-sm font-bold mr-3">
              1
            </span>
            패키지 설치
          </h2>
          <p className="text-gray-700 mb-4">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              pubspec.yaml
            </code>
            에 의존성을 추가하세요.
          </p>
          <CodeBlock
            code={`dependencies:
  gist_chatbot_flutter: ^0.1.1`}
            language="yaml"
          />
          <p className="text-gray-700 mt-4 mb-4">
            또는 명령어 한 줄로 추가할 수 있습니다.
          </p>
          <CodeBlock code={`flutter pub add gist_chatbot_flutter`} language="bash" />
        </section>

        {/* Step 2 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#df3326] text-white rounded-full text-sm font-bold mr-3">
              2
            </span>
            Widget Key 발급 & 앱 ID 등록
          </h2>
          <p className="text-gray-700 mb-4">
            웹과 동일하게{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              widget-key
            </code>
            가 필요합니다. 관리자 페이지에서 키를 발급받은 뒤, 웹의 도메인 등록
            대신 <strong>앱 ID를 허용 목록에 등록</strong>하세요.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-900 mb-2">
              ⚠️ <strong>앱 ID 등록 안내</strong>
            </p>
            <ul className="text-sm text-yellow-900 space-y-1 list-disc list-inside">
              <li>
                Android:{" "}
                <code className="bg-yellow-100 px-1.5 py-0.5 rounded text-xs">
                  android/app/build.gradle
                </code>
                의{" "}
                <code className="bg-yellow-100 px-1.5 py-0.5 rounded text-xs">
                  applicationId
                </code>
              </li>
              <li>
                iOS: Xcode의 <strong>Bundle Identifier</strong>
              </li>
              <li>
                <code className="bg-yellow-100 px-1.5 py-0.5 rounded text-xs">
                  com.company.myapp
                </code>{" "}
                형식의 역도메인(reverse-DNS) 문자열이며, 프로토콜(https://)은
                붙이지 않습니다
              </li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 앱 ID를 등록하지 않으면 세션 발급이 거부됩니다. 등록한 앱
              ID는 패키지가 실행 시{" "}
              <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">
                package_info_plus
              </code>
              로 자동 인식하는 값과 일치해야 합니다.
            </p>
          </div>
        </section>

        {/* Step 3 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#df3326] text-white rounded-full text-sm font-bold mr-3">
              3
            </span>
            코드 추가
          </h2>
          <p className="text-gray-700 mb-4">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              GistChatbot
            </code>{" "}
            인스턴스를 만들고 원하는 시점에{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              open(context)
            </code>
            를 호출하면 챗봇 패널이 열립니다.
          </p>
          <CodeBlock
            code={`import 'package:flutter/material.dart';
import 'package:gist_chatbot_flutter/gist_chatbot_flutter.dart';

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  final _chatbot = GistChatbot(
    config: const GistChatbotConfig(
      widgetKey: 'wk_live_xxx',
    ),
  );

  @override
  void dispose() {
    _chatbot.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => _chatbot.open(context),
        child: const Icon(Icons.chat_bubble_rounded),
      ),
    );
  }
}`}
            language="dart"
          />
        </section>

        {/* Step 4 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#df3326] text-white rounded-full text-sm font-bold mr-3">
              4
            </span>
            완료!
          </h2>
          <p className="text-gray-700 mb-4">
            버튼을 누르면 바텀 시트 형태의 챗봇 패널이 열리고, 웹 위젯과 동일한
            스트리밍 답변을 받을 수 있습니다.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              ✅ 패널이 열리지 않는다면 위젯 키와 앱 ID 등록 여부를 먼저
              확인하세요.
            </p>
          </div>
        </section>

        {/* 다음 단계 */}
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            다음 단계
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <a
                href="/docs/flutter/api"
                className="text-[#df3326] hover:underline font-medium"
              >
                Flutter API & 설정
              </a>{" "}
              에서 설정 옵션과 색상 커스터마이징 방법을 확인하세요
            </li>
            <li>
              <a
                href="https://pub.dev/packages/gist_chatbot_flutter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#df3326] hover:underline font-medium"
              >
                pub.dev 패키지 페이지
              </a>{" "}
              에서 최신 버전과 변경 사항을 확인하세요
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
