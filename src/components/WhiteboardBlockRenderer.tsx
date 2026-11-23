import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
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
  const saveTimerRef = useRef<number | null>(null);
  const latestSceneRef = useRef<string>(initialSceneJson || '');
  const onSaveRef = useRef(onSaveScene);
  onSaveRef.current = onSaveScene;

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
      viewBackgroundColor: '#0e1320',
      currentItemStrokeColor: '#e2e8f0',
    };
    if (!initialSceneJson || !initialSceneJson.trim()) {
      return { elements: [], appState: baseAppState };
    }
    try {
      const parsed: StoredScene = JSON.parse(initialSceneJson);
      return {
        elements: Array.isArray(parsed.elements) ? parsed.elements : [],
        appState: {
          ...baseAppState,
          ...(parsed.appState && typeof parsed.appState === 'object' ? parsed.appState : {}),
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
          viewBackgroundColor: appState?.viewBackgroundColor || '#0e1320',
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
          ? 'fixed inset-0 z-[120] bg-[#0a0f1c]/95 backdrop-blur-md flex flex-col p-3 sm:p-5'
          : 'w-full rounded-2xl overflow-hidden border border-white/[0.10] bg-[#0e1320] shadow-xl'
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tempered Glass Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.08] bg-[#121829]/95 select-none">
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

      {/* Excalidraw Canvas Container */}
      <div
        className={isFullscreen ? 'flex-1 w-full rounded-b-2xl overflow-hidden' : 'w-full h-[420px] relative'}
      >
        <Excalidraw
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

  return canvasNode;
};

export const WhiteboardBlockRenderer = React.memo(WhiteboardBlockRendererInner);
export default WhiteboardBlockRenderer;
