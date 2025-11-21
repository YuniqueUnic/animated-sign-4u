"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/signature-builder/sidebar";
import { PreviewArea } from "@/components/signature-builder/preview-area";
import { CodePanel } from "@/components/signature-builder/code-panel";
import { MobileDrawerSidebar } from "@/components/signature-builder/mobile-drawer-sidebar";
import { INITIAL_STATE, THEMES } from "@/lib/constants";
import { FillMode, SignatureState, TextureType } from "@/lib/types";
import { buildStateFromQuery } from "@/lib/state-from-query";
import {
  ChevronDown,
  Code2,
  Download,
  FileCode2,
  FileImage,
  Film,
  Github,
  Moon,
  Sun,
  Triangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  generateJSComponent,
  generateReactComponent,
  generateVueComponent,
} from "@/lib/code-generators";
import { useTheme } from "next-themes";
import { useI18n } from "@/components/i18n-provider";
import { buildSignApiUrl } from "@/lib/api-url";

export default function SignatureBuilderPage() {
  const [state, setState] = useState<SignatureState>(INITIAL_STATE);
  const [svgCode, setSvgCode] = useState("");
  const [uploadedFont, setUploadedFont] = useState<ArrayBuffer | null>(null);
  const [isCodeOverlayOpen, setIsCodeOverlayOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();

  const mobileBottomPanelRef = useRef<ImperativePanelHandle | null>(null);
  const mobileBottomLastSizeRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const search = window.location.search;
    if (!search || search === "?") return;

    const params = new URLSearchParams(search);
    if ([...params.keys()].length === 0) return;

    setState(() => buildStateFromQuery(params));
  }, []);

  const updateState = (updates: Partial<SignatureState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const renderDownloadIcon = (key: string) => {
    switch (key) {
      case "react":
        return <Code2 className="w-3.5 h-3.5" />;
      case "vue":
        return <Triangle className="w-3.5 h-3.5 rotate-180" />;
      case "js":
        return <FileCode2 className="w-3.5 h-3.5" />;
      case "svg":
        return <FileCode2 className="w-3.5 h-3.5" />;
      case "png":
        return <FileImage className="w-3.5 h-3.5" />;
      case "gif":
        return <Film className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "zh" : "en");
  };

  const handleFontUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedFont(e.target.result as ArrayBuffer);
        updateState({ font: "custom" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSVG = () => {
    if (!svgCode) return;
    const blob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signature_${state.text}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadRaster = (format: "png" | "gif") => {
    const url = buildSignApiUrl(state, { format });
    const a = document.createElement("a");
    a.href = url;
    a.download = `signature_${state.text || "sign"}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadOptions = [
    {
      key: "react",
      label: t("reactComponent"),
      action: () => downloadComponent("react"),
    },
    {
      key: "vue",
      label: t("vueComponent"),
      action: () => downloadComponent("vue"),
    },
    {
      key: "js",
      label: t("jsComponent"),
      action: () => downloadComponent("js"),
    },
    {
      key: "svg",
      label: t("svgButton"),
      action: () => downloadSVG(),
    },
    {
      key: "png",
      label: t("downloadPngLabel"),
      action: () => downloadRaster("png"),
    },
    {
      key: "gif",
      label: t("downloadGifLabel"),
      action: () => downloadRaster("gif"),
    },
  ];

  const downloadComponent = (type: "react" | "vue" | "js") => {
    if (!svgCode) return;

    let code = "";
    let filename = "";
    let mimeType = "";

    if (type === "react") {
      code = generateReactComponent(svgCode, state);
      filename = `Signature.tsx`;
      mimeType = "text/typescript";
    } else if (type === "vue") {
      code = generateVueComponent(svgCode, state);
      filename = `Signature.vue`;
      mimeType = "text/plain";
    } else if (type === "js") {
      code = generateJSComponent(svgCode, state);
      filename = `signature.js`;
      mimeType = "text/javascript";
    }

    const blob = new Blob([code], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background font-sans">
      {/* Header */}
      <header className="h-14 border-b bg-card backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-br  from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg transform -rotate-3">
            4U
          </div>
          <h1 className="text-sm font-bold tracking-tight hidden md:block">
            {t("appTitle")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Code & Download */}
          <div className="flex items-center gap-2 md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-3"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="ml-1 text-[11px]">
                    {t("mobileDownloadLabel")}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {downloadOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={opt.action}
                    className="text-xs flex items-center gap-2"
                  >
                    {renderDownloadIcon(opt.key)}
                    <span>{opt.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCodeOverlayOpen(true)}
              className="h-8 text-xs px-3"
            >
              {t("mobileCodeLabel")}
            </Button>
          </div>

          {/* Desktop Download - hover dropdown with all formats */}
          <div className="relative group hidden md:block">
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs gap-2 bg-gray-900 hover:bg-gray-800 text-white pr-8"
            >
              <Download className="w-3.5 h-3.5" />
              {t("mobileDownloadLabel")}
              <ChevronDown className="w-3 h-3 ml-auto absolute right-2 opacity-50" />
            </Button>
            <div className="absolute right-0 mt-2 w-52 bg-popover rounded-xl shadow-2xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <div className="p-1">
                {downloadOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={opt.action}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition text-left"
                  >
                    {renderDownloadIcon(opt.key)}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Locale toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="h-8 text-xs px-2 inline-flex"
          >
            {locale === "en" ? "EN" : "中文"}
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            className="h-8 w-8 text-xs inline-flex"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* GitHub repo link */}
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 text-xs inline-flex"
          >
            <a
              href="https://github.com/YuniqueUnic/animated-sign-4u"
              target="_blank"
              rel="noreferrer"
              aria-label={t("githubRepoLabel")}
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Sidebar
          state={state}
          updateState={updateState}
          onFontUpload={handleFontUpload}
        />

        <main className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-background">
          <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
            <ResizablePanel defaultSize={60} minSize={30}>
              <PreviewArea
                state={state}
                onSvgGenerated={setSvgCode}
                uploadedFont={uploadedFont}
                idPrefix="desktop-"
              />
            </ResizablePanel>

            <ResizableHandle
              className="relative group cursor-row-resize bg-border hover:bg-indigo-500 active:bg-indigo-600 transition-colors duration-200"
              style={{ height: "6px", minHeight: "6px", maxHeight: "6px" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col gap-0.5">
                  <div className="w-8 h-0.5 bg-muted-foreground/30 rounded-full group-hover:bg-white group-hover:w-10 transition-all duration-200" />
                  <div className="w-8 h-0.5 bg-muted-foreground/30 rounded-full group-hover:bg-white group-hover:w-10 transition-all duration-200" />
                </div>
              </div>
            </ResizableHandle>

            <ResizablePanel defaultSize={40} minSize={20}>
              <CodePanel svgCode={svgCode} state={state} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-background">
          <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
            <ResizablePanel defaultSize={60} minSize={40}>
              <PreviewArea
                state={state}
                onSvgGenerated={setSvgCode}
                uploadedFont={uploadedFont}
                idPrefix="mobile-"
              />
            </ResizablePanel>

            <ResizableHandle
              className="relative group cursor-row-resize bg-border hover:bg-indigo-500 active:bg-indigo-600 transition-colors duration-200"
              style={{ height: "6px", minHeight: "6px", maxHeight: "6px" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col gap-0.5">
                  <div className="w-8 h-0.5 bg-muted-foreground/30 rounded-full group-hover:bg-white group-hover:w-10 transition-all duration-200" />
                  <div className="w-8 h-0.5 bg-muted-foreground/30 rounded-full group-hover:bg-white group-hover:w-10 transition-all duration-200" />
                </div>
              </div>
            </ResizableHandle>

            <ResizablePanel
              ref={mobileBottomPanelRef}
              defaultSize={40}
              minSize={5}
              className="flex flex-col min-h-0"
              onResize={(size) => {
                // Track the last "usable" size for restore; ignore tiny
                // collapsed sizes so re-open always returns to a helpful
                // height.
                if (size > 8) {
                  mobileBottomLastSizeRef.current = size;
                }
              }}
            >
              <MobileDrawerSidebar
                state={state}
                updateState={updateState}
                onFontUpload={handleFontUpload}
                onToggleOpen={(open) => {
                  const panel = mobileBottomPanelRef.current;
                  if (!panel) return;
                  try {
                    if (open) {
                      const last = mobileBottomLastSizeRef.current ?? 40;
                      panel.resize?.(last);
                    } else {
                      // Collapse down to a small strip so the preview gets
                      // most of the height while still keeping the header
                      // visible.
                      panel.resize?.(6);
                    }
                  } catch {
                    // no-op
                  }
                }}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>

      {isCodeOverlayOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col md:hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
            <span className="text-xs font-semibold text-[#c9d1d9]">
              {t("apiAndCode")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCodeOverlayOpen(false)}
              className="h-7 text-xs text-[#c9d1d9]"
            >
              Close
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <CodePanel svgCode={svgCode} state={state} />
          </div>
        </div>
      )}
    </div>
  );
}
