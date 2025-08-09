import React, { useState } from "react";
import Markdown from "markdown-to-jsx";
import "github-markdown-css";

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SimpleMarkdownEditor: React.FC<SimpleMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Type your markdown here...",
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const markdownOverrides = {
    img: {
      props: {
        style: { maxWidth: "100%", height: "auto" },
      },
    },
    table: {
      props: {
        className: "table-auto w-full border-collapse border border-gray-300",
      },
    },
    th: {
      props: {
        className: "border border-gray-300 px-4 py-2 bg-gray-100 font-bold",
      },
    },
    td: {
      props: {
        className: "border border-gray-300 px-4 py-2",
      },
    },
  };

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
    >
      {/* Tab Headers */}
      <div className="flex border-b border-gray-300 bg-gray-50">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "edit"
              ? "bg-white border-b-2 border-primary text-primary"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "preview"
              ? "bg-white border-b-2 border-primary text-primary"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {activeTab === "edit" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[200px] p-4 border-none outline-none resize-y font-mono text-sm"
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          />
        ) : (
          <div className="markdown-body p-4 min-h-[200px]">
            {value.trim() ? (
              <Markdown options={{ overrides: markdownOverrides }}>
                {value}
              </Markdown>
            ) : (
              <p className="text-gray-500 italic">Nothing to preview...</p>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      {activeTab === "edit" && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-300 text-xs text-gray-600">
          <p>
            <strong>Supported:</strong> **bold** *italic* # headings - lists |
            tables | ![images](url) [links](url) &gt; quotes `code` ```code
            blocks```
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleMarkdownEditor;
