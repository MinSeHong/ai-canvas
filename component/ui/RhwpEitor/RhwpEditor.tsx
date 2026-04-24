"use client";

import { useEffect, useRef } from "react";

type RhwpEditorInstance = {
  loadFile: (data: ArrayBuffer | Uint8Array, fileName?: string) => Promise<{ pageCount: number }>;
  destroy?: () => void;
};

export default function RhwpEditor() {
  const editorElRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RhwpEditorInstance | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { createEditor } = await import("@rhwp/editor");
      if (!editorElRef.current || !mounted) return;

      const instance = await createEditor(editorElRef.current);
      editorRef.current = instance;
    })();

    return () => {
      mounted = false;
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  }, []);

  const onClickOpen = () => {
    fileInputRef.current?.click();
  };

  const onChangeFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    try {
      const buffer = await file.arrayBuffer();
      await editorRef.current.loadFile(buffer, file.name);
    } catch (err) {
      console.error(err);
      alert("파일 열기에 실패했습니다.");
    } finally {
      // 같은 파일을 다시 선택해도 onChange가 동작하도록 초기화
      e.currentTarget.value = "";
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", overflow: "hidden" }}
    >
      <button
        type="button"
        onClick={onClickOpen}
        style={{
          position: "absolute",
          top: 2,
          left: 400,
          zIndex: 0,
          backgroundColor: "#F5F5F5",
          fontSize: 12,
          padding: "3px 5px",
        }}
      >
        파일 열기
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".hwp,.hwpx"
        onChange={onChangeFile}
        style={{ display: "none" }}
      />

      <div ref={editorElRef} id="editor" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
