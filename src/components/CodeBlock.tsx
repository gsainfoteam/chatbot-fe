import { useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CheckIcon, CopyIcon } from "./Icons";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = "html" }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200">
      <button
        onClick={copyToClipboard}
        aria-label={isCopied ? "복사됨" : "코드 복사"}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md text-gray-400 bg-white/5 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
      >
        <span className="flex items-center justify-center w-4 h-4">
          {isCopied ? (
            <CheckIcon className="w-3.5 h-3.5" />
          ) : (
            <CopyIcon className="w-4 h-4" />
          )}
        </span>
      </button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
        }}
        showLineNumbers={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
