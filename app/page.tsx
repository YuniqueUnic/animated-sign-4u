"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/signature-builder/sidebar";
import { PreviewArea } from "@/components/signature-builder/preview-area";
import { CodePanel } from "@/components/signature-builder/code-panel";
import { INITIAL_STATE } from "@/lib/constants";
import { SignatureState } from "@/lib/types";
import { ChevronDown, Download } from "lucide-react";
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

export default function SignatureBuilderPage() {
  const [state, setState] = useState<SignatureState>(INITIAL_STATE);
  const [svgCode, setSvgCode] = useState("");
  const [uploadedFont, setUploadedFont] = useState<ArrayBuffer | null>(null);

  const updateState = (updates: Partial<SignatureState>) => {
    setState((prev) => ({ ...prev, ...updates }));
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
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg transform -rotate-3">
            S
          </div>
          <h1 className="text-sm font-bold tracking-tight hidden md:block">
            Animated Signature <span className="text-indigo-600">4u</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Component Download - Hover Dropdown */}
          <div className="relative group">
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
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <circle cx="10" cy="10" r="2" />
                    <path d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm0 12a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM3 10a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zm12 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
                  </svg>
                  React Component
                </button>
                <button
                  onClick={() => downloadComponent("vue")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition flex items-center gap-2"
                >
                  <svg
                    className="w-6 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2L2 18h16L10 2zm0 3.5L15.5 16h-11L10 5.5z" />
                  </svg>
                  Vue Component
                </button>
                <button
                  onClick={() => downloadComponent("js")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition flex items-center gap-2"
                >
                  <svg
                    className="w-6 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1zm2 3v6h2V7H5zm4 0l2 3-2 3h2l1-1.5L13 13h2l-2-3 2-3h-2l-1 1.5L11 7H9z" />
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
            className="h-8 text-xs gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            SVG
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          state={state}
          updateState={updateState}
          onFontUpload={handleFontUpload}
        />

        <main className="flex-1 flex flex-col min-w-0 relative bg-[#0d1117]">
          <ResizablePanelGroup direction="vertical" className="flex-1">
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
    </div>
  );
}
