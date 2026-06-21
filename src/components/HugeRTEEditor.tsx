"use client";

import { useEffect, useRef, useId, useCallback, useState } from "react";
import "hugerte/skins/ui/oxide/skin.min.css";

interface HugeRTEEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function HugeRTEEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung bài viết...",
  minHeight = 450,
}: HugeRTEEditorProps) {
  const editorId = useId().replace(/:/g, "");
  const editorRef = useRef<HTMLDivElement>(null);
  const hugerteRef = useRef<unknown>(null);
  const initializedRef = useRef(false);
  const suppressOnChangeRef = useRef(false);
  const [ready, setReady] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const initEditor = useCallback(async () => {
    if (!editorRef.current || initializedRef.current) return;
    initializedRef.current = true;

    // Load core hugerte first so global is available for plugins
    const hugerteModule = await import("hugerte");
    const hugerte = (hugerteModule as any).default || hugerteModule;

    // Set global reference if missing
    if (typeof window !== "undefined" && !(window as any).hugerte) {
      (window as any).hugerte = hugerte;
    }

    await Promise.all([
      import("hugerte/models/dom/model.js"),
      // @ts-ignore
      import("hugerte/themes/silver/theme.js"),
      // @ts-ignore
      import("hugerte/icons/default/icons.js"),
    ]);

    await Promise.all([
      import("hugerte/plugins/accordion"),
      import("hugerte/plugins/advlist"),
      import("hugerte/plugins/anchor"),
      import("hugerte/plugins/autolink"),
      import("hugerte/plugins/autoresize"),
      import("hugerte/plugins/autosave"),
      import("hugerte/plugins/charmap"),
      import("hugerte/plugins/code"),
      import("hugerte/plugins/codesample"),
      import("hugerte/plugins/directionality"),
      import("hugerte/plugins/emoticons"),
      import("hugerte/plugins/fullscreen"),
      import("hugerte/plugins/help"),
      import("hugerte/plugins/image"),
      import("hugerte/plugins/insertdatetime"),
      import("hugerte/plugins/link"),
      import("hugerte/plugins/lists"),
      import("hugerte/plugins/media"),
      import("hugerte/plugins/nonbreaking"),
      import("hugerte/plugins/pagebreak"),
      import("hugerte/plugins/preview"),
      import("hugerte/plugins/quickbars"),
      import("hugerte/plugins/save"),
      import("hugerte/plugins/searchreplace"),
      import("hugerte/plugins/table"),
      import("hugerte/plugins/template"),
      import("hugerte/plugins/visualblocks"),
      import("hugerte/plugins/visualchars"),
      import("hugerte/plugins/wordcount"),
      import("hugerte/plugins/emoticons/js/emojis"),
      import("hugerte/plugins/help/js/i18n/keynav/en"),
    ]);

    if (!editorRef.current || !initializedRef.current) return;

    if (hugerte.get(editorId)) {
      hugerte.get(editorId).remove();
    }

    hugerteRef.current = hugerte;

    hugerte.init({
      target: editorRef.current,
      plugins: [
        "accordion",
        "advlist",
        "anchor",
        "autolink",
        "autosave",
        "charmap",
        "code",
        "codesample",
        "directionality",
        "emoticons",
        "fullscreen",
        "help",
        "image",
        "insertdatetime",
        "link",
        "lists",
        "media",
        "nonbreaking",
        "pagebreak",
        "preview",
        "quickbars",
        "save",
        "searchreplace",
        "table",
        "template",
        "visualblocks",
        "visualchars",
        "wordcount",
      ].join(" "),
      toolbar: [
        "undo redo restoredraft | blocks fontfamily fontsizeinput | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | charmap emoticons | codesample code | anchor pagebreak | fullscreen preview save",
      ].join(" | "),
      skin: false,
      content_css: false,
      min_height: minHeight,
      placeholder,
      relative_urls: false,
      remove_script_host: false,
      document_base_url: "/",
      branding: false,
      promotion: false,
      statusbar: true,
      menubar: "file edit view insert format table tools help",
      quickbars_insert_toolbar:
        "quicktable image media | charmap anchor | blocks | emoticons",
      quickbars_selection_toolbar:
        "bold italic underline strikethrough | quicklink | blocks | forecolor backcolor | bullist numlist | quote",
      paste_data_images: true,
      smart_paste: true,
      autosave_interval: "30s",
      autosave_restore_when_empty: false,
      table_default_styles: { "border-collapse": "collapse", width: "100%" },
      urlconverter_callback: (url: string, node: any, on_save: boolean, name: string) => {
        if (typeof url === 'string') {
          const trimmed = url.trim();
          if (trimmed.includes('lh3.googleusercontent.com')) {
            if (!trimmed.includes('=')) return `${trimmed}=s0`;
            return trimmed;
          }
          const match = trimmed.match(/(?:[\/?=]id=|\/d\/)([a-zA-Z0-9_-]{10,})/);
          if (match) {
            return `https://lh3.googleusercontent.com/d/${match[1]}=s0`;
          }
        }
        return url;
      },
      content_style: `
        body {
          font-family: var(--font-be-vietnam), 'Be Vietnam Pro', sans-serif;
          font-size: 16px;
          line-height: 1.75;
          color: #18181b;
          padding: 16px 20px;
        }
        img { max-width: 100%; height: auto; }
        table { width: 100%; border-collapse: collapse; }
        table td, table th { border: 1px solid #e4e4e7; padding: 10px; }
        pre { background: #27272a; color: #fafafa; padding: 16px; border-radius: 6px; overflow-x: auto; }
        blockquote { border-left: 4px solid #e4e4e7; padding-left: 20px; color: #71717a; margin-left: 0; font-style: italic; }
        h1,h2,h3,h4,h5,h6 { font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; }
        a { color: #dc2626; text-decoration: underline; }
      `,
      paste_preprocess: (plugin: any, args: any) => {
        const content = args.content;
        // Nếu user paste 1 URL Google Drive trực tiếp dưới dạng text
        if (typeof content === 'string' && content.match(/^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=)[a-zA-Z0-9_-]{10,}/)) {
          const match = content.match(/(?:[\/?=]id=|\/d\/)([a-zA-Z0-9_-]{10,})/);
          if (match) {
            args.content = `<img src="https://lh3.googleusercontent.com/d/${match[1]}=s0" alt="drive-image" />`;
          }
        }
      },
      setup: (ed: unknown) => {
        const editor = ed as {
          on: (event: string, handler: (api?: any) => void) => void;
          setContent: (html: string) => void;
          getContent: () => string;
          id: string;
        };

        const convertDriveHtml = (html: string) => {
          let clean = html.replace(
            /src=["']https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]{10,})[^"']*["']/g,
            'src="https://lh3.googleusercontent.com/d/$1=s0"'
          );
          // Strip WordPress thumbnail dimensions
          clean = clean.replace(
            /(src=["'][^"']+)m?-\d+x\d+(\.(?:jpg|jpeg|png|webp|gif)["'])/gi,
            '$1$2'
          );
          // Strip WordPress lazyload junk
          clean = clean.replace(/\s+(srcset|sizes|data-src|data-srcset|data-sizes)=["'][^"']*["']/gi, '');
          clean = clean.replace(/\s+class=["']([^"']*)lazyloaded([^"']*)["']/gi, ' class="$1$2"');
          return clean;
        };

        editor.on("BeforeSetContent", (e: any) => {
          if (e.content) {
            e.content = convertDriveHtml(e.content);
          }
        });

        editor.on("NodeChange", (e: any) => {
          if (e.element && e.element.nodeName === 'IMG') {
            const src = e.element.getAttribute('src');
            if (src && src.includes('drive.google.com')) {
              const match = src.match(/(?:[\/?=]id=|\/d\/)([a-zA-Z0-9_-]{10,})/);
              if (match) {
                e.element.setAttribute('src', `https://lh3.googleusercontent.com/d/${match[1]}=s0`);
                // force update dimensions if possible
                e.element.removeAttribute('width');
                e.element.removeAttribute('height');
              }
            }
          }
        });

        editor.on("init", () => {
          if (value) {
            editor.setContent(value);
          }
          setReady(true);
        });

        editor.on("input change keyup undo redo SetContent", () => {
          if (suppressOnChangeRef.current) return;
          onChangeRef.current(editor.getContent());
        });
      },
    });
  }, [editorId, minHeight, placeholder]);

  useEffect(() => {
    initEditor();
    return () => {
      initializedRef.current = false;
      setReady(false);
      try {
        const hugerte = hugerteRef.current as any;
        if (hugerte) {
          const ed = hugerte.get?.(editorId);
          if (ed) ed.remove();
        }
      } catch {
        // ignore cleanup errors
      }
    };
  }, [initEditor, editorId]);

  useEffect(() => {
    if (!ready) return;
    const hugerte = hugerteRef.current as any;
    if (!hugerte) return;
    const ed = hugerte.get?.(editorId);
    if (!ed) return;
    const current = ed.getContent();
    if (value !== current) {
      suppressOnChangeRef.current = true;
      ed.setContent(value || "");
      suppressOnChangeRef.current = false;
    }
  }, [value, ready, editorId]);

  return (
    <div className="huge-rte-wrapper border border-zinc-300 rounded-md overflow-hidden">
      <style>{`
        .tox.tox-hugerte {
          visibility: visible !important;
          opacity: 1 !important;
        }
      `}</style>
      <div ref={editorRef} id={editorId} />
    </div>
  );
}
