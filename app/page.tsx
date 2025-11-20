"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/signature-builder/sidebar";
import { PreviewArea } from "@/components/signature-builder/preview-area";
import { CodePanel } from "@/components/signature-builder/code-panel";
import { MobileDrawerSidebar } from "@/components/signature-builder/mobile-drawer-sidebar";
import { INITIAL_STATE, THEMES } from "@/lib/constants";
import { FillMode, SignatureState, TextureType } from "@/lib/types";
import { ChevronDown, Download, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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

export default function SignatureBuilderPage() {
  const [state, setState] = useState<SignatureState>(INITIAL_STATE);
  const [svgCode, setSvgCode] = useState("");
  const [uploadedFont, setUploadedFont] = useState<ArrayBuffer | null>(null);
  const [isCodeOverlayOpen, setIsCodeOverlayOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) return;

    setState((prev) => {
      let next: SignatureState = { ...prev };

      const themeKey = params.get("theme");
      if (themeKey && themeKey in THEMES) {
        next = { ...next, ...THEMES[themeKey] } as SignatureState;
      }

      const text = params.get("text");
      if (text) {
        next.text = text;
      }

      const font = params.get("font");
      if (font) {
        next.font = font;
      }

      const fill = params.get("fill") as FillMode | null;
      if (fill === "single" || fill === "gradient" || fill === "multi") {
        next.fillMode = fill;
      }

      const bgParam = params.get("bg");
      if (bgParam) {
        if (bgParam === "transparent") {
          next.bgTransparent = true;
        } else {
          next.bgTransparent = false;
          next.bg = bgParam.startsWith("#") ? bgParam : `#${bgParam}`;
        }
      }

      const texture = params.get("texture") as TextureType | null;
      const allowedTextures: TextureType[] = [
        "none",
        "grid",
        "dots",
        "lines",
        "cross",
      ];
      if (texture && allowedTextures.includes(texture)) {
        next.texture = texture;
      }

      return next;
    });
  }, []);

  const updateState = (updates: Partial<SignatureState>) => {
    setState((prev) => ({ ...prev, ...updates }));
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
            S
          </div>
          <h1 className="text-sm font-bold tracking-tight hidden md:block">
            {t("appTitle")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
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
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-xs inline-flex"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {/* Component Download - Hover Dropdown */}
          <div className="relative group hidden md:block">
            <Button
              variant="default"
              size="sm"
              onClick={() => downloadComponent("react")}
              className="h-8 text-xs gap-2 bg-gray-900 hover:bg-gray-800 text-white pr-8"
            >
              <Download className="w-3.5 h-3.5" />
              Export Component
              <ChevronDown className="w-3 h-3 ml-auto absolute right-2 opacity-50" />
            </Button>

            {/* Hover Dropdown */}
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <div className="p-2">
                <button
                  onClick={() => downloadComponent("react")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition flex items-center gap-2"
                >
                  <svg
                    className="w-6 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <ellipse cx="12" cy="12" rx="9" ry="4" />
                    <ellipse
                      cx="12"
                      cy="12"
                      rx="9"
                      ry="4"
                      transform="rotate(60 12 12)"
                    />
                    <ellipse
                      cx="12"
                      cy="12"
                      rx="9"
                      ry="4"
                      transform="rotate(-60 12 12)"
                    />
                  </svg>
                  React Component
                </button>
                <button
                  onClick={() => downloadComponent("vue")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition flex items-center gap-2"
                >
                  <svg
                    className="w-6 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3 4h4l5 9 5-9h4L12 21 3 4z" opacity="0.9" />
                    <path
                      d="M5 4h3l4 7 4-7h3L12 18 5 4z"
                      className="text-white"
                    />
                  </svg>
                  Vue Component
                </button>
                <button
                  onClick={() => downloadComponent("js")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition flex items-center gap-2"
                >
                  <svg
                    className="w-6 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4 3h16l-1.5 17L12 23 5.5 20 4 3z" />
                    <path
                      d="M9 7h7l-.3 3H11l.2 2.5h4.1L15 17l-3 1-3-1-.2-2h2l.1 1 1.1.3 1.1-.3.1-1.5H9.1L9 7z"
                      className="text-white"
                    />
                  </svg>
                  HTML / JS
                </button>
              </div>
            </div>
          </div>

          {/* SVG Download - Simple Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSVG}
            className="h-8 text-xs gap-2 hidden md:inline-flex"
          >
            <Download className="w-3.5 h-3.5" />
            {t("svgButton")}
          </Button>

          {/* Mobile Code & Download */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSVG}
              className="h-8 text-xs px-3"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="ml-1 text-[11px]">
                {t("mobileDownloadLabel")}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCodeOverlayOpen(true)}
              className="h-8 text-xs px-3"
            >
              {t("mobileCodeLabel")}
            </Button>
          </div>
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
              defaultSize={40}
              minSize={25}
              className="flex flex-col min-h-0"
            >
              <MobileDrawerSidebar
                state={state}
                updateState={updateState}
                onFontUpload={handleFontUpload}
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
