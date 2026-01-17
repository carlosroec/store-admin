import { useState } from "react";

interface MarkdownEditorProps {
  name: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  error?: string;
}

export function MarkdownEditor({
  name,
  label,
  defaultValue = "",
  placeholder,
  rows = 6,
  error,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-2">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            !showPreview
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            showPreview
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Editor / Preview */}
      {!showPreview ? (
        <div>
          <textarea
            name={name}
            rows={rows}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            placeholder={placeholder}
          />
          <p className="mt-1 text-xs text-gray-500">
            Supports Markdown: **bold**, *italic*, - lists, # headers
          </p>
        </div>
      ) : (
        <div
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[150px] prose prose-sm max-w-none"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {value ? (
            <MarkdownPreview content={value} />
          ) : (
            <p className="text-gray-400 italic">Nothing to preview</p>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Simple markdown renderer
export function MarkdownPreview({ content, className = "" }: { content: string; className?: string }) {
  const renderMarkdown = (text: string) => {
    // Process lists first, then other elements
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem = /^- (.+)$/.test(line);

      if (isListItem) {
        if (!inList) {
          processedLines.push('<ul class="list-none my-1">');
          inList = true;
        }
        const content = line.replace(/^- (.+)$/, '$1');
        processedLines.push(`<li>- ${content}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    }

    if (inList) {
      processedLines.push('</ul>');
    }

    let html = processedLines.join('\n')
      // Escape HTML in non-tag content
      .replace(/&(?!amp;|lt;|gt;)/g, "&amp;")
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      // Code inline
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      // Remove newlines inside lists
      .replace(/<\/li>\n<li>/g, '</li><li>')
      .replace(/<ul([^>]*)>\n/g, '<ul$1>')
      .replace(/\n<\/ul>/g, '</ul>')
      // Line breaks (only outside of lists)
      .replace(/\n\n/g, '</p><p class="my-2">')
      .replace(/\n/g, '<br/>');

    return `<p class="my-2">${html}</p>`;
  };

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
