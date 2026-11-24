import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './whiteboard-glass.css';
import { Maximize2, Minimize2, PenTool, Trash2, X } from 'lucide-react';

interface WhiteboardBlockRendererProps {
  id: string;
  title?: string;
  initialSceneJson?: string;
  onSaveScene: (sceneJson: string, title?: string) => void;
  onDelete: () => void;
}

interface StoredScene {
  elements?: readonly any[];
  appState?: Record<string, any>;
}

const WhiteboardBlockRendererInner: React.FC<WhiteboardBlockRendererProps> = ({
  title: initialTitle,
  initialSceneJson,
  onSaveScene,
  onDelete,
}) => {
  const [title, setTitle] = useState(initialTitle || 'Whiteboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const saveTimerRef = useRef<number | null>(null);
  const latestSceneRef = useRef<string>(initialSceneJson || '');
  const onSaveRef = useRef(onSaveScene);
  onSaveRef.current = onSaveScene;

  // Ensure mounted canvas never keeps an inverted opaque background (#0e1320 or #ffffff)
  useEffect(() => {
    if (!excalidrawAPI) return;
    try {
      const appState = excalidrawAPI.getAppState?.();
      const bg = appState?.viewBackgroundColor;
      if (!bg || bg === '#0e1320' || bg === '#ffffff' || bg === '#121212') {
        excalidrawAPI.updateScene({
          appState: {
            viewBackgroundColor: 'transparent',
            theme: 'dark',
          },
        });
      }
    } catch {
      // ignore api errors
    }
  }, [excalidrawAPI]);

  useEffect(() => {
    setTitle(initialTitle || 'Whiteboard');
  }, [initialTitle]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  const parsedInitialData = useMemo(() => {
    const baseAppState = {
      theme: 'dark' as const,
      viewBackgroundColor: 'transparent',
      currentItemStrokeColor: '#1e1e1e',
    };
    if (!initialSceneJson || !initialSceneJson.trim()) {
      return { elements: [], appState: baseAppState };
    }
    try {
      const parsed: StoredScene = JSON.parse(initialSceneJson);
      const savedBg = parsed.appState?.viewBackgroundColor;
      // Migrate old inverted dark hex (#0e1320) to transparent tempered glass
      const safeBg = !savedBg || savedBg === '#0e1320' || savedBg === '#ffffff' ? 'transparent' : savedBg;
      return {
        elements: Array.isArray(parsed.elements) ? parsed.elements : [],
        appState: {
          ...baseAppState,
          ...(parsed.appState && typeof parsed.appState === 'object' ? parsed.appState : {}),
          viewBackgroundColor: safeBg,
          collaborators: new Map(),
        },
      };
    } catch {
      return { elements: [], appState: baseAppState };
    }
  }, [initialSceneJson]);

  const handleChange = useCallback(
    (elements: readonly any[], appState: any) => {
      // Only persist non-deleted elements + essential visual appState fields
      const activeElements = elements.filter((el) => !el.isDeleted);
      const compactPayload = JSON.stringify({
        elements: activeElements,
        appState: {
          viewBackgroundColor: appState?.viewBackgroundColor || 'transparent',
          gridSize: appState?.gridSize ?? null,
        },
      });

      if (compactPayload === latestSceneRef.current) return;
      latestSceneRef.current = compactPayload;

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        onSaveRef.current(compactPayload, title);
      }, 500);
    },
    [title]
  );

  const handleTitleBlur = useCallback(() => {
    const clean = title.trim() || 'Whiteboard';
    setTitle(clean);
    onSaveRef.current(latestSceneRef.current, clean);
  }, [title]);

  const canvasNode = (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen bg-[#08080a]/96 backdrop-blur-xl flex flex-col p-2.5 sm:p-4'
          : 'w-full rounded-2xl overflow-hidden glass-card shadow-2xl'
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tempered Glass Header Bar */}
      <div
        className={`flex items-center justify-between px-3.5 py-2 border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-md select-none ${
          isFullscreen ? 'rounded-t-2xl border border-white/[0.10]' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
            <PenTool className="w-3.5 h-3.5 text-white/75" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="Whiteboard"
            className="bg-transparent border-0 outline-none text-xs font-semibold text-white/90 placeholder:text-white/35 truncate w-full max-w-[260px]"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="p-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Perbesar Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          {isFullscreen ? (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors"
              title="Tutup Layar Penuh"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-white/45 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
              title="Hapus Whiteboard"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Excalidraw Canvas Container — Tempered Glass Midnight Navy */}
      <div
        className={
          isFullscreen
            ? 'seenote-excalidraw flex-1 w-full rounded-b-2xl overflow-hidden border border-t-0 border-white/[0.10]'
            : 'seenote-excalidraw w-full h-[420px] relative'
        }
      >
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          theme="dark"
          initialData={parsedInitialData}
          onChange={handleChange}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: true,
              export: { saveFileToDisk: true },
            },
          }}
        />
      </div>
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return (
      <>
        <div className="w-full h-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-xs text-white/45 select-none">
          Whiteboard sedang dibuka di mode layar penuh...
        </div>
        {createPortal(canvasNode, document.body)}
      </>
    );
  }

  return canvasNode;
};

export const WhiteboardBlockRenderer = React.memo(WhiteboardBlockRendererInner);
export default WhiteboardBlockRenderer;
