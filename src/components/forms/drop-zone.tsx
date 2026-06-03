"use client";

import { FileText, Upload, X } from "lucide-react";
import { type DragEvent, type ChangeEvent, useState, useRef, useCallback } from "react";

const ACCEPTED_EXTENSIONS = [
  ".txt", ".log", ".md", ".json", ".csv", ".xml", ".html", ".htm",
  ".yaml", ".yml", ".sql", ".py", ".js", ".ts", ".jsx", ".tsx",
  ".css", ".scss", ".less", ".sh", ".bash", ".zsh", ".ps1",
  ".env", ".cfg", ".ini", ".toml", ".properties",
];

const ACCEPTED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/xml",
  "application/xml",
  "text/html",
  "text/x-python",
  "text/javascript",
  "text/typescript",
  "text/css",
  "text/x-sh",
  "text/x-shellscript",
  "application/x-yaml",
  "text/yaml",
  "application/x-sql",
  "application/x-msdos-program",
];

function isTextFile(file: File): boolean {
  // Check extension first
  const name = file.name.toLowerCase();
  if (ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return true;
  }

  // Then check MIME type
  if (ACCEPTED_MIME_TYPES.includes(file.type) || file.type === "") {
    // Empty type often means text file without proper MIME mapping
    return true;
  }

  // Heuristic: small files with no binary MIME are likely text
  if (
    !file.type.startsWith("image/") &&
    !file.type.startsWith("audio/") &&
    !file.type.startsWith("video/") &&
    !file.type.startsWith("font/") &&
    !file.type.includes("octet-stream") &&
    file.size < 10 * 1024 * 1024 // under 10MB
  ) {
    return true;
  }

  return false;
}

interface DropZoneProps {
  onFileContent: (content: string, fileName: string) => void;
  hasContent: boolean;
}

export function DropZone({ onFileContent, hasContent }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!isTextFile(file)) {
        setError(`不支持的文件类型: ${file.name}`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("文件过大，请选择小于 10MB 的文件。");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        if (content.trim().length === 0) {
          setError("文件内容为空，请选择包含文本内容的文件。");
          return;
        }
        setFileName(file.name);
        onFileContent(content, file.name);
      };
      reader.onerror = () => {
        setError("读取文件失败，请重试。");
      };
      reader.readAsText(file);
    },
    [onFileContent],
  );

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // Only process the first file
    handleFile(files[0]);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleFile(files[0]);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleClear() {
    setFileName(null);
    setError(null);
    onFileContent("", "");
  }

  return (
    <div className="drop-zone-stack">
      <div
        className={`drop-zone ${dragOver ? "drop-zone-active" : ""} ${error ? "drop-zone-error" : ""} ${fileName && !dragOver ? "drop-zone-filled" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="拖拽文件到此处或点击选择文件"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleInputChange}
          className="drop-zone-input"
          aria-hidden="true"
        />

        {fileName ? (
          <div className="drop-zone-file-info">
            <FileText size={18} />
            <span className="drop-zone-file-name">{fileName}</span>
            <button
              type="button"
              className="drop-zone-clear"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              aria-label="清除已导入文件"
            >
              <X size={16} />
            </button>
          </div>
        ) : dragOver ? (
          <div className="drop-zone-prompt">
            <Upload size={20} className="drop-zone-icon-active" />
            <span>释放鼠标以导入文件</span>
          </div>
        ) : (
          <div className="drop-zone-prompt">
            <Upload size={20} />
            <span>
              {hasContent
                ? "拖拽文件到此处替换内容，或点击选择"
                : "拖拽文件到此处，或点击选择"}
            </span>
            <span className="drop-zone-hint">
              支持 .txt .log .md .json .csv 等文本文件
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="drop-zone-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
